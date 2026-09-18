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
    totalConceitos: number;
  };
}

/**
 * Obtém a lista de todos os documentos processados do usuário de forma ultra resiliente.
 */
export async function obterListaDocumentosProcessados(): Promise<DocumentoProcessadoResumo[]> {
  try {
    const usuarioId = await obterUsuarioAtualId();
    const admin = criarClienteAdmin();

    // 1. Tenta consulta via view aplicacao.v_documentos_processados
    const { data: viewData, error: viewError } = await admin
      .from("v_documentos_processados")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: false });

    if (!viewError && viewData && viewData.length > 0) {
      return viewData.map((doc: any) => ({
        id: doc.id,
        versao_obra_id: doc.versao_obra_id,
        usuario_id: doc.usuario_id,
        titulo_processado: doc.titulo_processado,
        total_secoes: doc.total_secoes || 0,
        total_fragmentos: doc.total_fragmentos || 0,
        total_palavras: doc.total_palavras || 0,
        total_tokens_estimado: doc.total_tokens_estimado || 0,
        estado_publicacao: doc.estado_publicacao || "ativo",
        publicado_em: doc.publicado_em || doc.criado_em,
        criado_em: doc.criado_em,
        atualizado_em: doc.atualizado_em,
        obra_id: doc.obra_id || "",
        obra_titulo: doc.obra_titulo || doc.titulo_processado,
        obra_tipo: doc.obra_tipo || "livro",
        autoria: doc.obra_natureza || "autoral",
        papel_cerebro: doc.participa_cerebro ? "nucleo_autoral" : "referencia_externa",
        autor_nome: doc.autor_nome || "Você",
      }));
    }

    // 2. Fallback direto para tabela base processamento.documentos_processados
    const { data: docsBase, error: docsError } = await admin
      .schema("processamento")
      .from("documentos_processados")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: false });

    if (docsError || !docsBase) {
      console.warn("Nenhum documento processado encontrado na tabela base:", docsError?.message);
      return [];
    }

    // Busca metadados das versões e obras
    const resultado: DocumentoProcessadoResumo[] = [];

    for (const doc of docsBase) {
      let obraInfo: any = null;
      if (doc.versao_obra_id) {
        const { data: versao } = await admin
          .schema("biblioteca")
          .from("versoes_obras")
          .select("obra_id")
          .eq("id", doc.versao_obra_id)
          .maybeSingle();

        if (versao?.obra_id) {
          const { data: obra } = await admin
            .schema("biblioteca")
            .from("obras")
            .select("id, titulo, tipo, natureza, autor_nome, participa_cerebro")
            .eq("id", versao.obra_id)
            .maybeSingle();

          obraInfo = obra;
        }
      }

      resultado.push({
        id: doc.id,
        versao_obra_id: doc.versao_obra_id,
        usuario_id: doc.usuario_id,
        titulo_processado: doc.titulo_processado,
        total_secoes: doc.total_secoes || 0,
        total_fragmentos: doc.total_fragmentos || 0,
        total_palavras: doc.total_palavras || 0,
        total_tokens_estimado: doc.total_tokens_estimado || 0,
        estado_publicacao: doc.estado_publicacao || "ativo",
        publicado_em: doc.publicado_em || doc.criado_em,
        criado_em: doc.criado_em,
        atualizado_em: doc.atualizado_em,
        obra_id: obraInfo?.id || "",
        obra_titulo: obraInfo?.titulo || doc.titulo_processado,
        obra_tipo: obraInfo?.tipo || "livro",
        autoria: obraInfo?.natureza || "autoral",
        papel_cerebro: obraInfo?.participa_cerebro ? "nucleo_autoral" : "referencia_externa",
        autor_nome: obraInfo?.autor_nome || "Você",
      });
    }

    return resultado;
  } catch (erro) {
    console.error("Erro crítico ao obter lista de documentos processados:", erro);
    return [];
  }
}

/**
 * Obtém os materiais extraídos completos de um livro/documento processado
 * (Árvore de seções, sínteses, fragmentos, conceitos e evidências).
 */
export async function obterExtracaoCompletaDocumento(
  documentoIdOuVersaoId: string
): Promise<ExtracaoCompletaDocumento | null> {
  try {
    const usuarioId = await obterUsuarioAtualId();
    const admin = criarClienteAdmin();

    // 1. Busca o Documento Processado
    const { data: doc, error: docError } = await admin
      .schema("processamento")
      .from("documentos_processados")
      .select("*")
      .or(`id.eq.${documentoIdOuVersaoId},versao_obra_id.eq.${documentoIdOuVersaoId}`)
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (docError || !doc) {
      console.warn("Documento processado não localizado:", docError?.message);
      return null;
    }

    // 2. Busca Obra vinculada
    let obra: any = null;
    if (doc.versao_obra_id) {
      const { data: versaoObra } = await admin
        .schema("biblioteca")
        .from("versoes_obras")
        .select("obra_id")
        .eq("id", doc.versao_obra_id)
        .maybeSingle();

      if (versaoObra?.obra_id) {
        const { data: obraData } = await admin
          .schema("biblioteca")
          .from("obras")
          .select("*")
          .eq("id", versaoObra.obra_id)
          .maybeSingle();

        obra = obraData;
      }
    }

    // 3. Busca Seções
    const { data: secoes } = await admin
      .schema("processamento")
      .from("secoes")
      .select("*")
      .eq("documento_processado_id", doc.id)
      .eq("usuario_id", usuarioId)
      .order("ordem", { ascending: true });

    // 4. Busca Sínteses
    const { data: sinteses } = await admin
      .schema("processamento")
      .from("sinteses_secoes")
      .select("*")
      .eq("documento_processado_id", doc.id)
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: true });

    // 5. Busca Fragmentos Textuais
    const { data: fragmentos } = await admin
      .schema("processamento")
      .from("fragmentos")
      .select("*")
      .eq("documento_processado_id", doc.id)
      .eq("usuario_id", usuarioId)
      .order("ordem", { ascending: true });

    // 6. Busca Conceitos Vinculados aos Fragmentos
    const fragmentosIds = (fragmentos || []).map((f: any) => f.id);
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
        console.warn("Erro não impeditivo ao carregar conceitos:", errConceitos);
      }
    }

    const listaSecoes = secoes || [];
    const listaSinteses = sinteses || [];
    const listaFragmentos = fragmentos || [];

    return {
      documento: doc as DocumentoProcessado,
      obra: obra as ObraDetalhada,
      secoes: listaSecoes.map((s: any) => ({
        id: s.id,
        secao_pai_id: s.secao_pai_id,
        nivel: s.nivel,
        ordem: s.ordem,
        titulo: s.titulo,
        tipo_secao: s.tipo_secao,
        resumo_secao: s.resumo_secao,
      })),
      sinteses: listaSinteses.map((st: any) => ({
        id: st.id,
        secao_id: st.secao_id,
        tipo_sintese: st.tipo_sintese,
        conteudo: st.conteudo,
        tese_principal: st.tese_principal,
        conceitos_chave: st.conceitos_chave || [],
        argumentos_principais: st.argumentos_principais || [],
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
        totalPalavras: doc.total_palavras || listaFragmentos.reduce((acc: number, f: any) => acc + (f.total_palavras || 0), 0),
        totalTokens: doc.total_tokens_estimado || 0,
        totalSinteses: listaSinteses.length,
        totalConceitos: conceitosVinculados.length,
      },
    };
  } catch (erroGlobal) {
    console.error("Erro crítico ao obter extração completa do documento:", erroGlobal);
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

    const { data, error } = await admin
      .from("v_documentos_processados")
      .select("*")
      .eq("versao_obra_id", versaoObraId)
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (error || !data) {
      const { data: baseData } = await admin
        .schema("processamento")
        .from("documentos_processados")
        .select("*")
        .eq("versao_obra_id", versaoObraId)
        .eq("usuario_id", usuarioId)
        .maybeSingle();

      return (baseData as DocumentoProcessado) || null;
    }

    return (data as DocumentoProcessado) || null;
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

    const { data, error } = await admin
      .from("v_fragmentos_detalhados")
      .select("*")
      .eq("documento_processado_id", documentoProcessadoId)
      .eq("usuario_id", usuarioId)
      .order("ordem", { ascending: true })
      .range(offset, offset + limite - 1);

    if (error || !data) {
      const { data: baseData } = await admin
        .schema("processamento")
        .from("fragmentos")
        .select("*")
        .eq("documento_processado_id", documentoProcessadoId)
        .eq("usuario_id", usuarioId)
        .order("ordem", { ascending: true })
        .range(offset, offset + limite - 1);

      return (baseData as FragmentoTextual[]) || [];
    }

    return (data as FragmentoTextual[]) || [];
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
        .from("v_execucoes_processamento")
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
