/**
 * Domínio de Reflexões: Incorporador à Memória Autoral
 * Executa a promoção atômica de uma reflexão concluída/aprovada para Obra Autoral na Biblioteca,
 * alimentando o Cérebro Autoral de forma permanente e controlada pelo autor.
 *
 * Idioma: Português do Brasil
 */

import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";

export async function incorporarReflexaoComoObra({
  entradaId,
  versaoId,
  usuarioId,
}: {
  entradaId: string;
  versaoId: string;
  usuarioId: string;
}): Promise<{ obraId: string }> {
  const admin = criarClienteAdmin();

  // Executar a função RPC atômica criada na migration 0008
  const { data: obraId, error } = await admin.rpc(
    "incorporar_reflexao_como_obra" as any,
    {
      p_entrada_id: entradaId,
      p_versao_id: versaoId,
      p_usuario_id: usuarioId,
    }
  );

  if (error || !obraId) {
    console.error("Erro ao incorporar reflexão como obra autoral:", error);
    throw new Error(
      `Falha ao incorporar reflexão à memória: ${error?.message || "Erro desconhecido"}`
    );
  }

  return { obraId: obraId as string };
}
