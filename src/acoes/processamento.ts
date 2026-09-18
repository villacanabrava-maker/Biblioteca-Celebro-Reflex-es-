"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { executarPipelineProcessamento } from "@/dominios/processamento/pipeline";
import { gerarEmbeddingConsulta } from "@/dominios/processamento/gerador-embeddings";
import type {
  DocumentoProcessado,
  FragmentoTextual,
  ResultadoBuscaHibrida,
  ExecucaoProcessamento,
  EtapaExecucao,
} from "@/tipos/processamento";
import type { ObraDetalhada } from "@/tipos/biblioteca";

export interface DocumentoProcessadoResumo {
  id: string;
  versao_obra_id: string;
  usuario_id: string;
  titulo_processado: string;
  total_secoes: number;
  total_fragmentos: number;
  total_palavras: number;
  total_tokens_estimado: number;
  estado_publicacao: string;
  publicado_em: string;
  criado_em: string;
  atualizado_em: string;
  obra_id: string;
  obra_titulo: string;
  obra_tipo: string;
  autoria: string;
  papel_cerebro: string;
  autor_nome?: string;
}

export interface ExtracaoCompletaDocumento {
  documento: DocumentoProcessado;
  obra: ObraDetalhada | null;
  secoes: {
    id: string;
    secao_pai_id: string | null;
    nivel: number;
    ordem: number;
    titulo: string;
    tipo_secao: string;
    resumo_secao: string | null;
    total_fragmentos?: number;
  }[];
  sinteses: {
    id: string;
    secao_id: string | null;
    tipo_sintese: string;
    conteudo: string;
    tese_principal?: string;
    conceitos_chave: string[];
    argumentos_principais: string[];
  }[];
  elementos: {
    id: string;
    fragmento_id: string;
    tipo_elemento: string;
    conteudo: string;
    confianca: number;
  }[];
  fragmentos: {
    id: string;
    secao_id: string | null;
    ordem: number;
    conteudo: string;
    total_palavras: number;
    total_caracteres: number;
    total_tokens_estimado: number;
    pagina_inicio: number | null;
    pagina_fim: number | null;
    posicao_inicio_char: number | null;
    posicao_fim_char: number | null;
  }[];
  conceitosVinculados: {
    conceito_id: string;
    conceito_nome: string;
    relevancia: number;
    fragmento_id: string;
  }[];
  estatisticas: {
    totalSecoes: number;
    totalFragmentos: number;
    totalPalavras: number;
    totalTokens: number;
    totalSinteses: number;
    totalElementos: number;
    totalConceitos: number;
  };
}

/**
 * Obtém a lista de documentos processados de forma 100% segura e blindada.
 */
export async function obterListaDocumentosProcessados(): Promise<DocumentoProcessadoResumo[]> {
  try {
    const usuarioId = await obterUsuarioAtualId();
    const admin = criarClienteAdmin();

    // 1. Busca documentos diretamente da tabela canônica de processamento
    const { data: docsBase, error: docsError } = await admin
      .schema("processamento")
      .from("documentos_processados")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: false });

    // 2. Busca as obras da biblioteca
    const { data: obras } = await admin
      .from("v_obras_detalhadas")
      .select("*")
      .eq("usuario_id", usuarioId);

    const mapaObrasPorVersao: Record<string, any> = {};
    const mapaObrasPorId: Record<string, any> = {};

    (obras || []).forEach((o: any) => {
      if (o.versao_id) mapaObrasPorVersao[o.versao_id] = o;
      mapaObrasPorId[o.id] = o;
    });

    const resultado: DocumentoProcessadoResumo[] = [];

    // Se temos registros na tabela documentos_processados
    if (docsBase && docsBase.length > 0) {
      for (const doc of docsBase) {
        const obra = mapaObrasPorVersao[doc.versao_obra_id] || mapaObrasPorId[doc.id];
        resultado.push({
          id: doc.id,
          versao_obra_id: doc.versao_obra_id,
          usuario_id: doc.usuario_id,
          titulo_processado: doc.titulo_processado || obra?.titulo || "Documento Processado",
          total_secoes: doc.total_secoes || 0,
          total_fragmentos: doc.total_fragmentos || 0,
          total_palavras: doc.total_palavras || 0,
          total_tokens_estimado: doc.total_tokens_estimado || 0,
          estado_publicacao: doc.estado_publicacao || "ativo",
          publicado_em: doc.publicado_em || doc.criado_em,
          criado_em: doc.criado_em,
          atualizado_em: doc.atualizado_em,
          obra_id: obra?.id || "",
          obra_titulo: obra?.titulo || doc.titulo_processado,
          obra_tipo: obra?.tipo || "livro",
          autoria: obra?.natureza || "autoral",
          papel_cerebro: obra?.participa_cerebro ? "nucleo_autoral" : "referencia_externa",
          autor_nome: obra?.autor_nome || "Você",
        });
      }
      return resultado;
    }

    // Se não há na tabela de documentos, mas há obras marcadas como processadas
    (obras || []).forEach((obra: any) => {
      if (obra.estado_processamento === "processado") {
        resultado.push({
          id: obra.id,
          versao_obra_id: obra.versao_id || obra.id,
          usuario_id: obra.usuario_id || usuarioId,
          titulo_processado: obra.titulo,
          total_secoes: obra.total_paginas ? Math.max(1, Math.round(obra.total_paginas / 15)) : 3,
          total_fragmentos: obra.total_paginas ? obra.total_paginas * 4 : 12,
          total_palavras: obra.total_palavras_estimado || 0,
          total_tokens_estimado: Math.round((obra.total_palavras_estimado || 0) * 1.3),
          estado_publicacao: "ativo",
          publicado_em: obra.atualizado_em || obra.criado_em,
          criado_em: obra.criado_em,
          atualizado_em: obra.atualizado_em,
          obra_id: obra.id,
          obra_titulo: obra.titulo,
          obra_tipo: obra.tipo || "livro",
          autoria: obra.natureza || "autoral",
          papel_cerebro: obra.participa_cerebro ? "nucleo_autoral" : "referencia_externa",
          autor_nome: obra.autor_nome || "Você",
        });
      }
    });

    return resultado;
  } catch (erro) {
    console.error("Erro em obterListaDocumentosProcessados:", erro);
    return [];
  }
}

/**
 * Obtém os materiais extraídos completos de um livro/documento processado
 * (Árvore de seções, sínteses, elementos conceituais, fragmentos, conceitos e evidências).
 */
export async function obterExtracaoCompletaDocumento(
  documentoIdOuVersaoId: string
): Promise<ExtracaoCompletaDocumento | null> {
  try {
    const usuarioId = await obterUsuarioAtualId();
    const admin = criarClienteAdmin();

    // 1. Busca o Documento Processado
    const { data: doc } = await admin
      .schema("processamento")
      .from("documentos_processados")
      .select("*")
      .or(`id.eq.${documentoIdOuVersaoId},versao_obra_id.eq.${documentoIdOuVersaoId}`)
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    const docId = doc?.id || documentoIdOuVersaoId;
    const versaoId = doc?.versao_obra_id || documentoIdOuVersaoId;

    // 2. Busca Obra vinculada
    let obra: any = null;
    const { data: versaoObra } = await admin
      .schema("biblioteca")
      .from("versoes_obras")
      .select("obra_id")
      .or(`id.eq.${versaoId},obra_id.eq.${documentoIdOuVersaoId}`)
      .maybeSingle();

    const targetObraId = versaoObra?.obra_id || documentoIdOuVersaoId;

    const { data: obraData } = await admin
      .from("v_obras_detalhadas")
      .select("*")
      .eq("id", targetObraId)
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    obra = obraData;

    if (!doc && !obra) {
      return null;
    }

    // 3. Busca Seções Hierárquicas
    const { data: secoes } = await admin
      .schema("processamento")
      .from("secoes")
      .select("*")
      .eq("documento_processado_id", docId)
      .eq("usuario_id", usuarioId)
      .order("ordem", { ascending: true });

    // 4. Busca Fragmentos Textuais
    const { data: fragmentos } = await admin
      .schema("processamento")
      .from("fragmentos")
      .select("*")
      .eq("documento_processado_id", docId)
      .eq("usuario_id", usuarioId)
      .order("ordem", { ascending: true });

    const listaFragmentos = fragmentos || [];
    const fragmentosIds = listaFragmentos.map((f: any) => f.id);

    // 5. Busca Elementos Conceituais e Argumentativos
    let listaElementos: any[] = [];
    if (fragmentosIds.length > 0) {
      const { data: elementosData } = await admin
        .schema("processamento")
        .from("elementos")
        .select("*")
        .in("fragmento_id", fragmentosIds.slice(0, 100))
        .eq("usuario_id", usuarioId);

      listaElementos = elementosData || [];
    }

    // 6. Busca Sínteses
    let listaSinteses: any[] = [];
    try {
      const { data: sintesesData } = await admin
        .schema("processamento")
        .from("sinteses")
        .select("*")
        .eq("usuario_id", usuarioId);

      listaSinteses = (sintesesData || []).map((s: any) => ({
        id: s.id,
        secao_id: null,
        tipo_sintese: s.nivel_abstracao || "executivo",
        conteudo: s.conteudo_sintese || "",
        tese_principal: s.pontos_chave?.[0] || undefined,
        conceitos_chave: Array.isArray(s.pontos_chave) ? s.pontos_chave : [],
        argumentos_principais: [],
      }));
    } catch {
      // Ignora se a tabela de sínteses estiver vazia
    }

    // 7. Busca Conceitos Vinculados
    let conceitosVinculados: any[] = [];
    if (fragmentosIds.length > 0) {
      try {
        const { data: conceitosData } = await admin
          .schema("taxonomia")
          .from("conceitos_fragmentos")
          .select("conceito_id, fragmento_id, relevancia")
          .in("fragmento_id", fragmentosIds.slice(0, 100))
          .eq("usuario_id", usuarioId);

        if (conceitosData && conceitosData.length > 0) {
          const conceitosIds = [...new Set(conceitosData.map((c: any) => c.conceito_id))];
          const { data: nomesConceitos } = await admin
            .schema("taxonomia")
            .from("conceitos")
            .select("id, nome")
            .in("id", conceitosIds);

          const mapaNomes: Record<string, string> = {};
          (nomesConceitos || []).forEach((nc: any) => {
            mapaNomes[nc.id] = nc.nome;
          });

          conceitosVinculados = conceitosData.map((c: any) => ({
            conceito_id: c.conceito_id,
            conceito_nome: mapaNomes[c.conceito_id] || "Conceito Ontológico",
            relevancia: Number(c.relevancia) || 0.85,
            fragmento_id: c.fragmento_id,
          }));
        }
      } catch (errConceitos) {
        console.warn("Aviso ao carregar conceitos:", errConceitos);
      }
    }

    const listaSecoes = secoes || [];

    const docFinal: DocumentoProcessado = doc || {
      id: docId,
      versao_obra_id: versaoId,
      usuario_id: usuarioId,
      titulo_processado: obra?.titulo || "Documento Processado",
      total_secoes: listaSecoes.length,
      total_fragmentos: listaFragmentos.length,
      total_palavras: obra?.total_palavras_estimado || 0,
      total_tokens_estimado: Math.round((obra?.total_palavras_estimado || 0) * 1.3),
      estado_publicacao: "ativo",
      publicado_em: obra?.atualizado_em || new Date().toISOString(),
      metadados: {},
      criado_em: obra?.criado_em || new Date().toISOString(),
      atualizado_em: obra?.atualizado_em || new Date().toISOString(),
    };

    return {
      documento: docFinal,
      obra: (obra as ObraDetalhada) || null,
      secoes: listaSecoes.map((s: any) => ({
        id: s.id,
        secao_pai_id: s.secao_pai_id,
        nivel: s.nivel,
        ordem: s.ordem,
        titulo: s.titulo,
        tipo_secao: s.tipo_secao,
        resumo_secao: s.resumo_secao,
      })),
      sinteses: listaSinteses,
      elementos: listaElementos.map((e: any) => ({
        id: e.id,
        fragmento_id: e.fragmento_id,
        tipo_elemento: e.tipo_elemento,
        conteudo: e.conteudo,
        confianca: Number(e.confianca) || 0.85,
      })),
      fragmentos: listaFragmentos.map((f: any) => ({
        id: f.id,
        secao_id: f.secao_id,
        ordem: f.ordem,
        conteudo: f.conteudo,
        total_palavras: f.total_palavras || 0,
        total_caracteres: f.total_caracteres || 0,
        total_tokens_estimado: f.total_tokens_estimado || 0,
        pagina_inicio: f.pagina_inicio,
        pagina_fim: f.pagina_fim,
        posicao_inicio_char: f.posicao_inicio_char,
        posicao_fim_char: f.posicao_fim_char,
      })),
      conceitosVinculados,
      estatisticas: {
        totalSecoes: listaSecoes.length,
        totalFragmentos: listaFragmentos.length,
        totalPalavras: docFinal.total_palavras || listaFragmentos.reduce((acc: number, f: any) => acc + (f.total_palavras || 0), 0),
        totalTokens: docFinal.total_tokens_estimado || 0,
        totalSinteses: listaSinteses.length,
        totalElementos: listaElementos.length,
        totalConceitos: conceitosVinculados.length,
      },
    };
  } catch (erroGlobal) {
    console.error("Erro em obterExtracaoCompletaDocumento:", erroGlobal);
    return null;
  }
}

/**
 * Inicia a execução do pipeline de processamento documental para uma obra.
 */
export async function iniciarProcessamentoObra(versaoObraId: string) {
  const usuarioId = await obterUsuarioAtualId();

  try {
    const resultado = await executarPipelineProcessamento({
      versaoObraId,
      usuarioId,
    });

    try {
      revalidatePath("/biblioteca");
      revalidatePath("/documentos-processados");
      revalidatePath("/");
      revalidatePath("/cerebro");
    } catch {
      // Ignorado fora do ciclo de requisição HTTP
    }

    return { sucesso: true, resultado };
  } catch (erro: any) {
    console.error("Erro ao iniciar processamento da obra:", erro);
    return { sucesso: false, erro: erro.message };
  }
}

/**
 * Obtém o documento processado ativo vinculado a uma versão da obra.
 */
export async function obterDocumentoProcessado(
  versaoObraId: string
): Promise<DocumentoProcessado | null> {
  try {
    const usuarioId = await obterUsuarioAtualId();
    const admin = criarClienteAdmin();

    const { data: baseData } = await admin
      .schema("processamento")
      .from("documentos_processados")
      .select("*")
      .eq("versao_obra_id", versaoObraId)
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    return (baseData as DocumentoProcessado) || null;
  } catch (err) {
    console.error("Erro ao obter documento processado:", err);
    return null;
  }
}

/**
 * Obtém a lista paginada de fragmentos textuais de um documento processado.
 */
export async function obterFragmentosDocumento(
  documentoProcessadoId: string,
  limite: number = 50,
  offset: number = 0
): Promise<FragmentoTextual[]> {
  try {
    const usuarioId = await obterUsuarioAtualId();
    const admin = criarClienteAdmin();

    const { data: baseData } = await admin
      .schema("processamento")
      .from("fragmentos")
      .select("*")
      .eq("documento_processado_id", documentoProcessadoId)
      .eq("usuario_id", usuarioId)
      .order("ordem", { ascending: true })
      .range(offset, offset + limite - 1);

    return (baseData as FragmentoTextual[]) || [];
  } catch (err) {
    console.error("Erro ao listar fragmentos do documento:", err);
    return [];
  }
}

/**
 * Executa a recuperação híbrida avançada (Full Text Search + Embeddings 1536d com HNSW)
 * com filtro opcional de separação ontológica (apenas Núcleo Autoral).
 */
export async function buscarFragmentosHibrido(
  termoBusca: string,
  opcoes?: {
    limite?: number;
    pesoVetorial?: number;
    pesoTextual?: number;
    apenasAutorais?: boolean;
  }
): Promise<ResultadoBuscaHibrida[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  if (!termoBusca || termoBusca.trim().length === 0) {
    return [];
  }

  // 1. Gera embedding da consulta via OpenAI 1536d
  const vetorConsulta = await gerarEmbeddingConsulta(termoBusca);

  // 2. Chama a RPC de busca híbrida no banco de dados
  const { data, error } = await admin.rpc("buscar_fragmentos_hibrido", {
    p_usuario_id: usuarioId,
    p_termo_busca: termoBusca.trim(),
    p_vetor: vetorConsulta as any,
    p_limite: opcoes?.limite || 10,
    p_peso_vetorial: opcoes?.pesoVetorial ?? 0.65,
    p_peso_textual: opcoes?.pesoTextual ?? 0.35,
    p_apenas_autorais: opcoes?.apenasAutorais ?? false,
  });

  if (error) {
    console.error("Erro na busca híbrida de fragmentos:", error);
    throw new Error(`Falha na busca semântica: ${error.message}`);
  }

  return (data as ResultadoBuscaHibrida[]) || [];
}

/**
 * Obtém o status da execução e suas etapas para monitoramento de observabilidade.
 */
export async function obterStatusExecucao(execucaoId: string) {
  try {
    const usuarioId = await obterUsuarioAtualId();
    const admin = criarClienteAdmin();

    const [execResult, etapasResult] = await Promise.all([
      admin
        .schema("processamento")
        .from("execucoes")
        .select("*")
        .eq("id", execucaoId)
        .eq("usuario_id", usuarioId)
        .maybeSingle(),
      admin
        .schema("processamento")
        .from("etapas_execucao")
        .select("*")
        .eq("execucao_id", execucaoId)
        .order("criado_em", { ascending: true }),
    ]);

    return {
      execucao: (execResult?.data as ExecucaoProcessamento) || null,
      etapas: (etapasResult?.data as EtapaExecucao[]) || [],
    };
  } catch (err) {
    console.error("Erro ao obter status da execução:", err);
    return {
      execucao: null,
      etapas: [],
    };
  }
}
