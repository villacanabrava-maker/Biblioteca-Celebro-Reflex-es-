"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { analisarDimensaoComIA } from "@/dominios/cerebro/analisador-dimensoes";
import type {
  DimensaoCerebro,
  CaracteristicaCerebro,
  RegraCerebro,
  ResumoCerebro,
  PropostaAtualizacaoCerebro,
} from "@/tipos/cerebro";

/**
 * Obtém as 18 dimensões canônicas agrupadas pelos 3 Planos (Conteúdo, Método, Expressão).
 */
export async function obterDimensoesCerebro(): Promise<DimensaoCerebro[]> {
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_cerebro_dimensoes")
    .select("*")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao listar dimensões do cérebro:", error);
    return [];
  }

  return (data as DimensaoCerebro[]) || [];
}

/**
 * Obtém características detalhadas de uma dimensão ou de todo o cérebro.
 */
export async function obterCaracteristicasDimensao(
  dimensaoId?: string
): Promise<CaracteristicaCerebro[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  let query = admin
    .from("v_cerebro_caracteristicas_detalhadas")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("confianca_calculada", { ascending: false });

  if (dimensaoId) {
    query = query.eq("dimensao_id", dimensaoId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao obter características da dimensão:", error);
    return [];
  }

  return (data as CaracteristicaCerebro[]) || [];
}

/**
 * Obtém as regras e anti-regras ativas do Cérebro.
 */
export async function obterRegrasCerebro(tipo?: string): Promise<RegraCerebro[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  let query = admin
    .from("v_cerebro_regras_ativas")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("peso", { ascending: false });

  if (tipo && tipo !== "todas") {
    query = query.eq("tipo_regra", tipo);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao obter regras do cérebro:", error);
    return [];
  }

  return (data as RegraCerebro[]) || [];
}

/**
 * Obtém o resumo consolidado de métricas do Cérebro Autoral.
 */
export async function obterResumoCerebro(): Promise<ResumoCerebro> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_cerebro_resumo")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error || !data) {
    return {
      usuario_id: usuarioId,
      total_caracteristicas: 0,
      total_regras: 0,
      total_anti_regras: 0,
      total_nucleo_autoral: 0,
      total_influencias_externas: 0,
      confianca_media_geral: 0,
    };
  }

  return data as ResumoCerebro;
}

/**
 * Dispara a análise cognitiva com OpenAI gpt-4o para extrair características
 * e regras metodológicas de uma dimensão a partir dos fragmentos autorais.
 */
export async function acionarAnaliseDimensao(dimensaoId: string) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Obter metadados da dimensão
  const { data: dimensao, error: errDim } = await admin
    .schema("cerebro_autoral")
    .from("dimensoes")
    .select("*")
    .eq("id", dimensaoId)
    .single();

  if (errDim || !dimensao) {
    throw new Error("Dimensão não encontrada.");
  }

  // 2. Buscar fragmentos autorais ativos para subsidiar a análise
  const { data: fragmentos, error: errFrags } = await admin
    .from("v_fragmentos_detalhados")
    .select("id, conteudo, obra_titulo")
    .eq("usuario_id", usuarioId)
    .eq("obra_natureza", "autoral")
    .limit(15);

  if (errFrags || !fragmentos || fragmentos.length === 0) {
    throw new Error(
      "Nenhum fragmento autoral processado encontrado. Processe obras autorais na Biblioteca antes de analisar o Cérebro."
    );
  }

  // 3. Executar o motor cognitivo de extração com OpenAI gpt-4o
  const resultado = await analisarDimensaoComIA({
    dimensaoId: dimensao.id,
    dimensaoCodigo: dimensao.codigo,
    dimensaoNome: dimensao.nome,
    dimensaoDescricao: dimensao.descricao,
    usuarioId,
    fragmentos: fragmentos as any,
  });

  try {
    revalidatePath("/cerebro");
    revalidatePath("/");
  } catch {
    // Ignorado fora do ciclo de requisição HTTP
  }

  return resultado;
}

/**
 * Lista propostas de aprendizado derivadas de edições autorais.
 * Elas permanecem separadas das regras formais até a decisão do autor.
 */
export async function obterPropostasAtualizacaoCerebro(): Promise<PropostaAtualizacaoCerebro[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .schema("cerebro_autoral")
    .from("propostas_atualizacao")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Erro ao listar propostas de atualização do Cérebro:", error);
    return [];
  }

  return (data as PropostaAtualizacaoCerebro[]) || [];
}

/**
 * Registra a decisão soberana do autor sobre uma proposta.
 * Confirmar torna o aprendizado elegível para dossiês futuros;
 * rejeitar preserva o histórico sem influenciar novas reflexões.
 */
export async function decidirPropostaAtualizacaoCerebro({
  propostaId,
  decisao,
  notasAutor,
}: {
  propostaId: string;
  decisao: "confirmada" | "rejeitada";
  notasAutor?: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: proposta, error: erroBusca } = await admin
    .schema("cerebro_autoral")
    .from("propostas_atualizacao")
    .select("id, estado_decisao")
    .eq("id", propostaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (erroBusca || !proposta) {
    throw new Error("Proposta de aprendizado não encontrada.");
  }

  if (proposta.estado_decisao !== "pendente") {
    throw new Error("Esta proposta já recebeu uma decisão e foi preservada no histórico.");
  }

  const { error: erroAtualizacao } = await admin
    .schema("cerebro_autoral")
    .from("propostas_atualizacao")
    .update({
      estado_decisao: decisao,
      decidido_em: new Date().toISOString(),
      notas_autor: notasAutor?.trim() || null,
    })
    .eq("id", propostaId)
    .eq("usuario_id", usuarioId)
    .eq("estado_decisao", "pendente");

  if (erroAtualizacao) {
    throw new Error(`Falha ao registrar decisão sobre o aprendizado: ${erroAtualizacao.message}`);
  }

  try {
    revalidatePath("/cerebro");
    revalidatePath("/reflexoes");
  } catch {
    // Ignorado fora do ciclo de requisição HTTP.
  }

  return { sucesso: true, estado: decisao };
}
