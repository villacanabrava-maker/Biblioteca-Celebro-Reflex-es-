"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";
import { obterUsuarioAtualId } from "@/infraestrutura/auth/usuario-atual";
import { auditarVersaoReflexao } from "@/dominios/auditoria/auditor-independente";
import type { RelatorioAuditoria } from "@/tipos/auditoria";

/**
 * Obtém o relatório de auditoria de uma versão específica.
 */
export async function obterRelatorioAuditoria(versaoId: string): Promise<RelatorioAuditoria | null> {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data, error } = await admin
    .schema("auditoria")
    .from("relatorios_auditoria")
    .select("*")
    .eq("versao_reflexao_id", versaoId)
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao obter relatório de auditoria:", error);
    return null;
  }

  return (data as RelatorioAuditoria) || null;
}

/**
 * Aciona manualmente uma nova rodada de auditoria crítica independente sobre uma versão.
 */
export async function reexecutarAuditoria(versaoId: string, entradaId?: string) {
  const usuarioId = await obterUsuarioAtualId();

  const relatorio = await auditarVersaoReflexao({
    versaoId,
    usuarioId,
  });

  if (entradaId) {
    try {
      revalidatePath(`/reflexoes/${entradaId}`);
    } catch {}
  }

  return relatorio;
}
