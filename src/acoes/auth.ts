"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/infraestrutura/supabase/cliente-servidor";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";

/**
 * Autentica o usuário com e-mail e senha e estabelece a sessão persistente nos cookies.
 */
export async function fazerLogin(dados: { email: string; senha: string }) {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: dados.email.trim(),
    password: dados.senha,
  });

  if (error) {
    console.error("Erro no login:", error);
    return { sucesso: false, erro: error.message };
  }

  try {
    revalidatePath("/", "layout");
  } catch {}

  return { sucesso: true, usuario: data.user };
}

/**
 * Cadastra uma nova conta de autor no Supabase Auth com sincronização automática do perfil.
 */
export async function cadastrarConta(dados: {
  nome: string;
  email: string;
  senha: string;
}) {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.auth.signUp({
    email: dados.email.trim(),
    password: dados.senha,
    options: {
      data: {
        nome_completo: dados.nome.trim(),
        papel: "autor",
      },
    },
  });

  if (error) {
    console.error("Erro no cadastro:", error);
    return { sucesso: false, erro: error.message };
  }

  // Garantir que o perfil exista em sistema.usuarios imediatamente
  if (data.user) {
    const admin = criarClienteAdmin();
    await admin
      .schema("sistema")
      .from("usuarios")
      .upsert({
        id: data.user.id,
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        papel: "autor",
        ativo: true,
      });
  }

  try {
    revalidatePath("/", "layout");
  } catch {}

  return { sucesso: true, usuario: data.user };
}

/**
 * Encerra a sessão do usuário, remove os cookies e redireciona para a tela de login.
 */
export async function fazerLogout() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();

  try {
    revalidatePath("/", "layout");
  } catch {}

  redirect("/login");
}

/**
 * Retorna o usuário autenticado na requisição atual ou null.
 */
export async function obterUsuarioSessao() {
  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
