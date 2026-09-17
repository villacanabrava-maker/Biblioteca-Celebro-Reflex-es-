"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/infraestrutura/supabase/cliente-servidor";
import { criarClienteAdmin } from "@/infraestrutura/supabase/cliente-admin";

/**
 * Autentica o usuário com e-mail e senha e estabelece a sessão persistente nos cookies.
 */
export async function fazerLogin(dados: { email: string; senha: string }) {
  try {
    const supabase = await criarClienteServidor();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dados.email.trim(),
      password: dados.senha,
    });

    if (error) {
      console.error("Erro no login:", error);
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("invalid_credentials")
      ) {
        return { sucesso: false, erro: "E-mail ou senha incorretos. Verifique os dados digitados." };
      }
      if (error.message.includes("Email not confirmed")) {
        // Se por ventura o e-mail não foi confirmado, o admin auto-confirma e tenta logar de novo
        try {
          const admin = criarClienteAdmin();
          const { data: listaUsuarios } = await admin.auth.admin.listUsers();
          const usuarioEncontrado = listaUsuarios.users.find(
            (u) => u.email?.toLowerCase() === dados.email.trim().toLowerCase()
          );
          if (usuarioEncontrado) {
            await admin.auth.admin.updateUserById(usuarioEncontrado.id, { email_confirm: true });
            const retry = await supabase.auth.signInWithPassword({
              email: dados.email.trim(),
              password: dados.senha,
            });
            if (!retry.error) {
              revalidatePath("/", "layout");
              return { sucesso: true, usuario: retry.data.user };
            }
          }
        } catch {}

        return {
          sucesso: false,
          erro: "E-mail pendente de confirmação. Tentamos ativar sua conta; tente clicar em Entrar novamente.",
        };
      }
      return { sucesso: false, erro: error.message };
    }

    try {
      revalidatePath("/", "layout");
    } catch {}

    return { sucesso: true, usuario: data.user };
  } catch (err: any) {
    console.error("Erro de conexão no login:", err);
    return {
      sucesso: false,
      erro: err.message?.includes("NEXT_PUBLIC_SUPABASE_URL")
        ? "A conexão com o Supabase ainda não foi configurada nas variáveis de ambiente deste servidor."
        : "Erro inesperado ao conectar ao serviço de autenticação.",
    };
  }
}

/**
 * Cadastra uma nova conta de autor no Supabase Auth via Admin API:
 * - Evita o limite de envio de e-mails (rate limit SMTP)
 * - Auto-confirma o e-mail imediatamente
 * - Efetua o login nos cookies do navegador sem exigir clique em links
 */
export async function cadastrarConta(dados: {
  nome: string;
  email: string;
  senha: string;
}) {
  try {
    const admin = criarClienteAdmin();
    const supabase = await criarClienteServidor();

    const emailLimpo = dados.email.trim().toLowerCase();
    const nomeLimpo = dados.nome.trim() || "Autor";

    // 1. Criar o usuário via Admin API com e-mail já confirmado
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email: emailLimpo,
      password: dados.senha,
      email_confirm: true,
      user_metadata: {
        nome_completo: nomeLimpo,
        papel: "autor",
      },
    });

    if (createError) {
      console.error("Erro ao criar usuário via admin:", createError);
      if (
        createError.message.includes("already registered") ||
        createError.message.includes("User already exists") ||
        createError.message.includes("unique constraint")
      ) {
        return {
          sucesso: false,
          erro: "Já existe uma conta cadastrada com este endereço de e-mail. Tente fazer login.",
        };
      }
      return { sucesso: false, erro: createError.message };
    }

    if (!userData.user) {
      return { sucesso: false, erro: "Não foi possível criar a conta de usuário." };
    }

    // 2. Assegurar registro em sistema.usuarios
    try {
      await admin
        .schema("sistema")
        .from("usuarios")
        .upsert({
          id: userData.user.id,
          nome: nomeLimpo,
          email: emailLimpo,
          papel: "autor",
          ativo: true,
        });
    } catch (errPerfil) {
      console.warn("Aviso ao provisionar perfil em sistema.usuarios:", errPerfil);
    }

    // 3. Efetuar login e gravar cookies de sessão para o cliente
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: emailLimpo,
      password: dados.senha,
    });

    if (loginError) {
      console.warn("Conta criada com sucesso, requer login manual:", loginError.message);
      return {
        sucesso: true,
        requerLoginManual: true,
        usuario: userData.user,
      };
    }

    try {
      revalidatePath("/", "layout");
    } catch {}

    return { sucesso: true, usuario: loginData.user };
  } catch (err: any) {
    console.error("Erro no cadastro:", err);
    return {
      sucesso: false,
      erro: `Erro ao criar conta: ${err.message || "Tente novamente mais tarde."}`,
    };
  }
}

/**
 * Encerra a sessão do usuário, remove os cookies e redireciona para a tela de login.
 */
export async function fazerLogout() {
  try {
    const supabase = await criarClienteServidor();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Erro ao deslogar:", err);
  }

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
