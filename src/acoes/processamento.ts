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
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_documentos_processados")
    .select("*")
    .eq("versao_obra_id", versaoObraId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao obter documento processado:", error);
    return null;
  }

  return (data as DocumentoProcessado) || null;
}

/**
 * Obtém a lista paginada de fragmentos textuais de um documento processado.
 */
export async function obterFragmentosDocumento(
  documentoProcessadoId: string,
  limite: number = 50,
  offset: number = 0
): Promise<FragmentoTextual[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_fragmentos_detalhados")
    .select("*")
    .eq("documento_processado_id", documentoProcessadoId)
    .eq("usuario_id", usuarioId)
    .order("ordem", { ascending: true })
    .range(offset, offset + limite - 1);

  if (error) {
    console.error("Erro ao listar fragmentos do documento:", error);
    return [];
  }

  return (data as FragmentoTextual[]) || [];
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
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const [execResult, etapasResult] = await Promise.all([
    admin
      .from("v_execucoes_processamento")
      .select("*")
      .eq("id", execucaoId)
      .eq("usuario_id", usuarioId)
      .single(),
    admin
      .schema("processamento")
      .from("etapas_execucao")
      .select("*")
      .eq("execucao_id", execucaoId)
      .order("criado_em", { ascending: true }),
  ]);

  return {
    execucao: execResult.data as ExecucaoProcessamento | null,
    etapas: (etapasResult.data as EtapaExecucao[]) || [],
  };
}
