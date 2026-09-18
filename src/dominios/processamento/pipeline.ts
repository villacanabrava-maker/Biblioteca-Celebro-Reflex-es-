import crypto from "crypto";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { extrairTextoDeBuffer } from "./extrator-texto";
import { executarChunkingSemantico } from "./chunker-semantico";
import { gerarEmbeddingsEmLote } from "./gerador-embeddings";

export interface OpcoesPipeline {
  versaoObraId: string;
  usuarioId: string;
}

export interface ResultadoPipeline {
  sucesso: boolean;
  execucaoId: string;
  documentoProcessadoId: string;
  totalSecoes: number;
  totalFragmentos: number;
  totalTokens: number;
  custoEstimadoUsd: number;
}

function calcularChaveIdempotencia(partes: string[]): string {
  return crypto.createHash("sha256").update(partes.join("::")).digest("hex");
}

/**
 * Pipeline durável de processamento documental, estruturação hierárquica e vetorização HNSW.
 */
export async function executarPipelineProcessamento({
  versaoObraId,
  usuarioId,
}: OpcoesPipeline): Promise<ResultadoPipeline> {
  const admin = criarClienteAdmin();
  const inicioPipeline = Date.now();
  const correlacaoId = `proc_${versaoObraId.slice(0, 8)}_${inicioPipeline}`;

  // 1. Obter dados da versão da obra e da obra pai
  const { data: versao, error: errVersao } = await admin
    .schema("biblioteca")
    .from("versoes_obras")
    .select("*, obra:obras(*)")
    .eq("id", versaoObraId)
    .eq("usuario_id", usuarioId)
    .single();

  if (errVersao || !versao) {
    throw new Error(`Versão da obra não encontrada: ${errVersao?.message || "ID inválido"}`);
  }

  // 2. Obter perfil de embedding ativo
  const { data: perfilEmbedding } = await admin
    .schema("sistema")
    .from("perfis_embedding")
    .select("*")
    .eq("ativo", true)
    .limit(1)
    .single();

  if (!perfilEmbedding) {
    throw new Error("Nenhum perfil de embedding ativo configurado no sistema.");
  }

  // Se a tentativa anterior falhou, remove artefatos parciais antes de reprocessar.
  // Unidades são removidas primeiro para acionar cascatas de seções, fragmentos e vetores.
  if (versao.estado_processamento === "falha") {
    const { data: unidadesParciais } = await admin
      .schema("processamento")
      .from("unidades_conhecimento")
      .select("id")
      .eq("versao_obra_id", versaoObraId)
      .eq("usuario_id", usuarioId);

    const idsUnidades = (unidadesParciais || []).map((unidade) => unidade.id);
    if (idsUnidades.length > 0) {
      await admin
        .schema("processamento")
        .from("unidades_conhecimento")
        .delete()
        .in("id", idsUnidades)
        .eq("usuario_id", usuarioId);
    }

    await admin
      .schema("processamento")
      .from("documentos_processados")
      .delete()
      .eq("versao_obra_id", versaoObraId)
      .eq("usuario_id", usuarioId);
  }

  // 3. Registrar execução do pipeline
  const { data: execucao, error: errExecucao } = await admin
    .schema("processamento")
    .from("execucoes")
    .insert({
      versao_obra_id: versaoObraId,
      usuario_id: usuarioId,
      pipeline_versao: "v1.0",
      estado: "em_execucao",
      correlacao_id: correlacaoId,
    })
    .select()
    .single();

  if (errExecucao || !execucao) {
    throw new Error(`Falha ao iniciar execução do processamento: ${errExecucao?.message}`);
  }

  // Atualiza estado na versão da obra
  await admin
    .schema("biblioteca")
    .from("versoes_obras")
    .update({ estado_processamento: "em_processamento", erro_processamento: null })
    .eq("id", versaoObraId);

  let totalTokensGlobal = 0;
  let totalSecoesCriadas = 0;
  let totalFragmentosCriados = 0;

  try {
    // ------------------------------------------------------------------------
    // ETAPA 1: EXTRAIR TEXTO DO STORAGE
    // ------------------------------------------------------------------------
    const chaveEtapaExtrair = calcularChaveIdempotencia([
      versaoObraId,
      "extrair",
      versao.hash_sha256,
      execucao.id,
    ]);

    const inicioExtrair = Date.now();
    const { data: etapaExtrair } = await admin
      .schema("processamento")
      .from("etapas_execucao")
      .insert({
        execucao_id: execucao.id,
        nome_etapa: "extrair_texto",
        estado: "em_execucao",
        chave_idempotencia: chaveEtapaExtrair,
      })
      .select()
      .single();

    // Download do arquivo do storage privado
    const { data: arquivoBlob, error: errDownload } = await admin.storage
      .from("originais-biblioteca")
      .download(versao.arquivo_caminho);

    if (errDownload || !arquivoBlob) {
      throw new Error(`Erro ao baixar arquivo do storage: ${errDownload?.message}`);
    }

    const bufferArquivo = Buffer.from(await arquivoBlob.arrayBuffer());
    const extracao = await extrairTextoDeBuffer(
      bufferArquivo,
      versao.arquivo_mime_type,
      versao.arquivo_nome_original
    );

    if (!extracao.textoCompleto || extracao.textoCompleto.length < 10) {
      throw new Error("O arquivo não contém texto legível ou legibilidade insuficiente.");
    }

    // Atualiza metadados na versão da obra
    await admin
      .schema("biblioteca")
      .from("versoes_obras")
      .update({
        total_paginas: extracao.totalPaginas,
        total_palavras_estimado: extracao.totalPalavras,
      })
      .eq("id", versaoObraId);

    if (etapaExtrair) {
      await admin
        .schema("processamento")
        .from("etapas_execucao")
        .update({
          estado: "concluido",
          duracao_ms: Date.now() - inicioExtrair,
          resultado: {
            totalPalavras: extracao.totalPalavras,
            totalPaginas: extracao.totalPaginas,
            totalCaracteres: extracao.totalCaracteres,
          },
          concluido_em: new Date().toISOString(),
        })
        .eq("id", etapaExtrair.id);
    }

    // ------------------------------------------------------------------------
    // ETAPA 2: ESTRUTURAÇÃO HIERÁRQUICA E CHUNKING SEMÂNTICO
    // ------------------------------------------------------------------------
    const chaveEtapaChunking = calcularChaveIdempotencia([
      versaoObraId,
      "chunking",
      versao.hash_sha256,
      "v1",
      execucao.id,
    ]);

    const inicioChunking = Date.now();
    const { data: etapaChunking } = await admin
      .schema("processamento")
      .from("etapas_execucao")
      .insert({
        execucao_id: execucao.id,
        nome_etapa: "chunking_semantico",
        estado: "em_execucao",
        chave_idempotencia: chaveEtapaChunking,
      })
      .select()
      .single();

    const estrutura = executarChunkingSemantico(extracao.textoCompleto, versao.obra.titulo);

    if (etapaChunking) {
      await admin
        .schema("processamento")
        .from("etapas_execucao")
        .update({
          estado: "concluido",
          duracao_ms: Date.now() - inicioChunking,
          resultado: {
            totalSecoes: estrutura.secoes.length,
            totalFragmentos: estrutura.fragmentos.length,
          },
          concluido_em: new Date().toISOString(),
        })
        .eq("id", etapaChunking.id);
    }

    // ------------------------------------------------------------------------
    // ETAPA 3: PERSISTÊNCIA ATÔMICA DO DOCUMENTO PROCESSADO, SEÇÕES E FRAGMENTOS
    // ------------------------------------------------------------------------
    // 3.1 Criar ou atualizar Documento Processado
    const { data: docProc, error: errDocProc } = await admin
      .schema("processamento")
      .from("documentos_processados")
      .upsert(
        {
          versao_obra_id: versaoObraId,
          usuario_id: usuarioId,
          titulo_processado: versao.obra.titulo,
          total_secoes: estrutura.secoes.length,
          total_fragmentos: estrutura.fragmentos.length,
          total_palavras: extracao.totalPalavras,
          total_tokens_estimado: Math.ceil(extracao.totalCaracteres / 3.8),
          estado_publicacao: "candidato",
        },
        { onConflict: "versao_obra_id" }
      )
      .select()
      .single();

    if (errDocProc || !docProc) {
      throw new Error(`Erro ao registrar documento processado: ${errDocProc?.message}`);
    }

    // 3.2 Inserir Seções com Unidade de Conhecimento
    const mapaSecoesId = new Map<number, string>();

    for (const secao of estrutura.secoes) {
      // Cria a Unidade de Conhecimento raiz
      const { data: unidadeSecao } = await admin
        .schema("processamento")
        .from("unidades_conhecimento")
        .insert({
          usuario_id: usuarioId,
          obra_id: versao.obra_id,
          versao_obra_id: versaoObraId,
          tipo_unidade: "secao",
        })
        .select()
        .single();

      if (unidadeSecao) {
        await admin
          .schema("processamento")
          .from("secoes")
          .insert({
            id: unidadeSecao.id,
            documento_processado_id: docProc.id,
            usuario_id: usuarioId,
            nivel: secao.nivel,
            ordem: secao.ordem,
            titulo: secao.titulo,
            tipo_secao: secao.tipoSecao,
          });

        mapaSecoesId.set(secao.ordem, unidadeSecao.id);
        totalSecoesCriadas++;
      }
    }

    // 3.3 Inserir Fragmentos com Unidade de Conhecimento
    const fragmentosCriados: { id: string; conteudo: string }[] = [];

    for (const frag of estrutura.fragmentos) {
      const secaoId = mapaSecoesId.get(frag.ordemSecao) || null;

      const { data: unidadeFrag } = await admin
        .schema("processamento")
        .from("unidades_conhecimento")
        .insert({
          usuario_id: usuarioId,
          obra_id: versao.obra_id,
          versao_obra_id: versaoObraId,
          tipo_unidade: "fragmento",
        })
        .select()
        .single();

      if (unidadeFrag) {
        await admin
          .schema("processamento")
          .from("fragmentos")
          .insert({
            id: unidadeFrag.id,
            documento_processado_id: docProc.id,
            secao_id: secaoId,
            usuario_id: usuarioId,
            ordem: frag.ordem,
            conteudo: frag.conteudo,
            total_palavras: frag.totalPalavras,
            total_caracteres: frag.totalCaracteres,
            total_tokens_estimado: frag.totalTokensEstimado,
            posicao_inicio_char: frag.posicaoInicioChar,
            posicao_fim_char: frag.posicaoFimChar,
          });

        fragmentosCriados.push({ id: unidadeFrag.id, conteudo: frag.conteudo });
        totalFragmentosCriados++;
      }
    }

    // ------------------------------------------------------------------------
    // ETAPA 4: VETORIZAÇÃO HNSW (EMBEDDINGS 1536D)
    // ------------------------------------------------------------------------
    const chaveEtapaVetorizar = calcularChaveIdempotencia([
      versaoObraId,
      "vetorizar",
      perfilEmbedding.id,
      `${fragmentosCriados.length}`,
      execucao.id,
    ]);

    const inicioVetorizar = Date.now();
    const { data: etapaVetorizar } = await admin
      .schema("processamento")
      .from("etapas_execucao")
      .insert({
        execucao_id: execucao.id,
        nome_etapa: "vetorizacao_hnsw",
        estado: "em_execucao",
        chave_idempotencia: chaveEtapaVetorizar,
      })
      .select()
      .single();

    // Gera embeddings em lotes via OpenAI
    const textosParaEmbeddings = fragmentosCriados.map((f) => f.conteudo);
    const resultadoEmbeddings = await gerarEmbeddingsEmLote(textosParaEmbeddings, 32);

    totalTokensGlobal += resultadoEmbeddings.tokensUtilizados;

    // Persiste os vetores no banco
    for (let i = 0; i < fragmentosCriados.length; i++) {
      const vetor = resultadoEmbeddings.vetores[i];
      if (vetor) {
        await admin
          .schema("processamento")
          .from("vetores")
          .insert({
            unidade_conhecimento_id: fragmentosCriados[i].id,
            usuario_id: usuarioId,
            perfil_embedding_id: perfilEmbedding.id,
            embedding: vetor as any,
          });
      }
    }

    if (etapaVetorizar) {
      await admin
        .schema("processamento")
        .from("etapas_execucao")
        .update({
          estado: "concluido",
          duracao_ms: Date.now() - inicioVetorizar,
          resultado: {
            totalVetores: resultadoEmbeddings.vetores.length,
            tokensUtilizados: resultadoEmbeddings.tokensUtilizados,
          },
          concluido_em: new Date().toISOString(),
        })
        .eq("id", etapaVetorizar.id);
    }

    // ------------------------------------------------------------------------
    // ETAPA 5: PUBLICAÇÃO ATÔMICA
    // ------------------------------------------------------------------------
    // Custo estimado para text-embedding-3-small ($0.02 / 1M tokens)
    const custoEstimadoUsd = (totalTokensGlobal / 1_000_000) * 0.02;

    // Ativa documento processado
    await admin
      .schema("processamento")
      .from("documentos_processados")
      .update({
        estado_publicacao: "ativo",
        publicado_em: new Date().toISOString(),
      })
      .eq("id", docProc.id);

    // Conclui versão da obra
    await admin
      .schema("biblioteca")
      .from("versoes_obras")
      .update({
        estado_processamento: "processado",
        erro_processamento: null,
      })
      .eq("id", versaoObraId);

    // Conclui execução
    await admin
      .schema("processamento")
      .from("execucoes")
      .update({
        estado: "concluido",
        concluido_em: new Date().toISOString(),
        total_tokens: totalTokensGlobal,
        custo_estimado_usd: custoEstimadoUsd,
      })
      .eq("id", execucao.id);

    return {
      sucesso: true,
      execucaoId: execucao.id,
      documentoProcessadoId: docProc.id,
      totalSecoes: totalSecoesCriadas,
      totalFragmentos: totalFragmentosCriados,
      totalTokens: totalTokensGlobal,
      custoEstimadoUsd,
    };
  } catch (erro: any) {
    console.error("Falha na execução do pipeline documental:", erro);

    // Registra falha na execução
    await admin
      .schema("processamento")
      .from("execucoes")
      .update({
        estado: "falha",
        erro_mensagem: erro.message,
        concluido_em: new Date().toISOString(),
        total_tokens: totalTokensGlobal,
      })
      .eq("id", execucao.id);

    // Marca versão como falha
    await admin
      .schema("biblioteca")
      .from("versoes_obras")
      .update({
        estado_processamento: "falha",
        erro_processamento: erro.message,
      })
      .eq("id", versaoObraId);

    throw erro;
  }
}
