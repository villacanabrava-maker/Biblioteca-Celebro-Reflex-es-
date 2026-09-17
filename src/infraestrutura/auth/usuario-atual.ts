import { criarClienteServidor } from "@/infraestrutura/supabase/cliente-servidor";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";

// ID canônico do autor padrão semeado no banco de dados
export const USUARIO_AUTOR_PADRAO_ID = "fa373fbb-3024-45ce-be24-268dc228a6d0";

/**
 * Retorna o ID do usuário atualmente autenticado.
 * Se a sessão não estiver ativa (ex.: primeiro acesso, desenvolvimento local),
 * retorna o ID do autor padrão semeado no sistema.
 */
export async function obterUsuarioAtualId(): Promise<string> {
  try {
    const supabase = await criarClienteServidor();
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    }
  } catch (erro) {
    // Modo resiliente em ambientes de desenvolvimento ou SSR
  }

  return USUARIO_AUTOR_PADRAO_ID;
}

/**
 * Retorna os dados do perfil do autor atual.
 */
export async function obterPerfilUsuarioAtual() {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: user, error } = await admin.auth.admin.getUserById(usuarioId);

  if (error || !user) {
    return {
      id: usuarioId,
      email: "autor@memoriareflexiva.com",
      nome: "Autor da Memória Reflexiva",
    };
  }

  return {
    id: user.user.id,
    email: user.user.email || "autor@memoriareflexiva.com",
    nome: (user.user.user_metadata?.nome_completo as string) || "Autor da Memória Reflexiva",
  };
}
