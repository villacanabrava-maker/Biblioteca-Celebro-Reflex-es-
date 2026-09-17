"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { gerarPlanoReflexao } from "@/dominios/reflexoes/planejador-reflexao";
import { redigirReflexao } from "@/dominios/reflexoes/redator-reflexao";
import { auditarVersaoReflexao } from "@/dominios/auditoria/auditor-independente";
import type {
  ResumoReflexao,
  EntradaReflexao,
  PlanoReflexao,
  VersaoReflexao,
  CitacaoEvidencia,
  FormatoReflexao,
} from "@/tipos/reflexoes";
import type { RelatorioAuditoria } from "@/tipos/auditoria";

/**
 * Obtém a lista de todas as reflexões do usuário com métricas da última versão.
 */
export async function obterResumoReflexoes(): Promise<ResumoReflexao[]> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .from("v_reflexoes_resumo")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("atualizado_em", { ascending: false });

  if (error) {
    console.error("Erro ao obter resumo de reflexões:", error);
    return [];
  }

  return (data as ResumoReflexao[]) || [];
}

/**
 * Obtém os dados completos de uma reflexão (entrada, plano, versões, citações, auditoria).
 */
export async function obterReflexaoCompleta(entradaId: string): Promise<{
  entrada: EntradaReflexao | null;
  plano: PlanoReflexao | null;
  versoes: (VersaoReflexao & {
    citacoes: CitacaoEvidencia[];
    auditoria?: RelatorioAuditoria | null;
  })[];
}> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Entrada
  const { data: entrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .select("*")
    .eq("id", entradaId)
    .eq("usuario_id", usuarioId)
    .single();

  if (!entrada) {
    return { entrada: null, plano: null, versoes: [] };
  }

  // 2. Plano mais recente
  const { data: plano } = await admin
    .schema("reflexoes")
    .from("planos_reflexao")
    .select("*")
    .eq("entrada_id", entradaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Versões
  const { data: versoes } = await admin
    .schema("reflexoes")
    .from("versoes_reflexao")
    .select("*")
    .eq("entrada_id", entradaId)
    .order("numero_versao", { ascending: false });

  const versoesCompletas = [];

  for (const v of versoes || []) {
    // Citações da versão
    const { data: citacoes } = await admin
      .schema("reflexoes")
      .from("citacoes_evidencias")
      .select("*")
      .eq("versao_reflexao_id", v.id);

    // Relatório de Auditoria da versão
    const { data: relatorio } = await admin
      .schema("auditoria")
      .from("relatorios_auditoria")
      .select("*")
      .eq("versao_reflexao_id", v.id)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    versoesCompletas.push({
      ...v,
      citacoes: citacoes || [],
      auditoria: relatorio || null,
    });
  }

  return {
    entrada: entrada as EntradaReflexao,
    plano: (plano as PlanoReflexao) || null,
    versoes: versoesCompletas as any,
  };
}

/**
 * Cria uma nova entrada de reflexão e dispara o planejamento cognitivo com IA.
 */
export async function criarNovaReflexao({
  titulo,
  temaCentral,
  provocacaoInicial,
  objetivoComunicativo,
  publicoAlvo,
  formatoDesejado = "ensaio",
  restricoesEspecificas,
}: {
  titulo: string;
  temaCentral: string;
  provocacaoInicial: string;
  objetivoComunicativo?: string;
  publicoAlvo?: string;
  formatoDesejado?: FormatoReflexao;
  restricoesEspecificas?: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Inserir entrada
  const { data: entrada, error: errEntrada } = await admin
    .schema("reflexoes")
    .from("entradas")
    .insert({
      usuario_id: usuarioId,
      titulo: titulo.trim(),
      tema_central: temaCentral.trim(),
      provocacao_inicial: provocacaoInicial.trim(),
      objetivo_comunicativo: objetivoComunicativo?.trim() || null,
      publico_alvo: publicoAlvo?.trim() || null,
      formato_desejado: formatoDesejado,
      restricoes_especificas: restricoesEspecificas?.trim() || null,
      estado: "criada",
    })
    .select()
    .single();

  if (errEntrada || !entrada) {
    throw new Error(`Falha ao criar entrada de reflexão: ${errEntrada?.message}`);
  }

  // 2. Disparar Planejador Cognitivo
  try {
    const plano = await gerarPlanoReflexao({
      entradaId: entrada.id,
      usuarioId,
      titulo: entrada.titulo,
      temaCentral: entrada.tema_central,
      provocacaoInicial: entrada.provocacao_inicial,
      objetivoComunicativo: entrada.objetivo_comunicativo,
      publicoAlvo: entrada.publico_alvo,
      formatoDesejado: entrada.formato_desejado,
      restricoesEspecificas: entrada.restricoes_especificas,
    });

    try {
      revalidatePath("/reflexoes");
    } catch {}

    return { sucesso: true, entradaId: entrada.id, planoId: plano.id };
  } catch (err: any) {
    console.error("Erro no planejamento automático:", err);
    return { sucesso: true, entradaId: entrada.id, planoId: null, aviso: err.message };
  }
}

/**
 * Aprova o plano de reflexão e aciona o motor de redação autoral e auditoria imediata.
 */
export async function acionarRedacaoReflexao({
  entradaId,
  planoId,
}: {
  entradaId: string;
  planoId: string;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  // 1. Atualizar estado do plano para aprovado_pelo_autor
  await admin
    .schema("reflexoes")
    .from("planos_reflexao")
    .update({ estado: "aprovado_pelo_autor" })
    .eq("id", planoId);

  // 2. Redigir reflexão completa
  const versao = await redigirReflexao({
    entradaId,
    planoId,
    usuarioId,
  });

  // 3. Executar Auditoria Crítica Independente
  const auditoria = await auditarVersaoReflexao({
    versaoId: versao.id,
    usuarioId,
  });

  try {
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true, versaoId: versao.id, auditoriaId: auditoria.id };
}

/**
 * Salva as notas de revisão e o parecer final do autor sobre uma versão gerada.
 */
export async function registrarRevisaoAutor({
  versaoId,
  entradaId,
  comentarioGeral,
  ajustesSolicitados = [],
  aprovado,
}: {
  versaoId: string;
  entradaId: string;
  comentarioGeral?: string;
  ajustesSolicitados?: string[];
  aprovado: boolean;
}) {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { error } = await admin
    .schema("reflexoes")
    .from("revisoes_autor")
    .insert({
      versao_reflexao_id: versaoId,
      usuario_id: usuarioId,
      comentario_geral: comentarioGeral || null,
      ajustes_solicitados: ajustesSolicitados,
      aprovado,
    });

  if (error) {
    throw new Error(`Falha ao registrar revisão: ${error.message}`);
  }

  // Se aprovado pelo autor, marcar versão e entrada como aprovadas
  if (aprovado) {
    await admin
      .schema("reflexoes")
      .from("versoes_reflexao")
      .update({ estado: "aprovado" })
      .eq("id", versaoId);

    await admin
      .schema("reflexoes")
      .from("entradas")
      .update({ estado: "concluida" })
      .eq("id", entradaId);
  }

  try {
    revalidatePath(`/reflexoes/${entradaId}`);
    revalidatePath("/reflexoes");
  } catch {}

  return { sucesso: true };
}
