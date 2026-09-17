import { criarClienteServidor } from "@/infraestrutura/supabase/cliente-servidor";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";

export class NaoAutenticadoError extends Error {
  constructor(mensagem: string = "Usuário não autenticado. Acesso restrito.") {
    super(mensagem);
    this.name = "NaoAutenticadoError";
  }
}

/**
 * Retorna o ID do usuário atualmente autenticado.
 * Em conformidade com o princípio de segurança Fail-Closed:
 * Se não houver sessão autenticada, lança NaoAutenticadoError.
 */
export async function obterUsuarioAtualId(): Promise<string> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw new NaoAutenticadoError();
  }

  return user.id;
}

/**
 * Retorna os dados do perfil do autor atualmente autenticado.
 */
export async function obterPerfilUsuarioAtual() {
  const usuarioId = await obterUsuarioAtualId();
  const admin = criarClienteAdmin();

  const { data: user, error } = await admin.auth.admin.getUserById(usuarioId);

  if (error || !user) {
    throw new NaoAutenticadoError("Perfil de usuário não localizado no sistema.");
  }

  return {
    id: user.user.id,
    email: user.user.email || "",
    nome:
      (user.user.user_metadata?.nome_completo as string) ||
      user.user.email?.split("@")[0] ||
      "Autor",
    papel: (user.user.user_metadata?.papel as string) || "autor",
  };
}
