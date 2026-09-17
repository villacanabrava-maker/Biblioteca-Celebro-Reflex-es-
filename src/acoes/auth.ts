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
      if (error.message.includes("Invalid login credentials")) {
        return { sucesso: false, erro: "E-mail ou senha incorretos. Verifique os dados digitados." };
      }
      if (error.message.includes("Email not confirmed")) {
        return {
          sucesso: false,
          erro: "Seu e-mail ainda não foi confirmado. Acesse sua caixa postal ou realize um novo cadastro.",
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
 * Cadastra uma nova conta de autor no Supabase Auth, auto-confirma e inicia a sessão imediatamente.
 */
export async function cadastrarConta(dados: {
  nome: string;
  email: string;
  senha: string;
}) {
  try {
    const supabase = await criarClienteServidor();
    const admin = criarClienteAdmin();

    // 1. Criar usuário no Supabase Auth
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
      if (error.message.includes("User already registered")) {
        return { sucesso: false, erro: "Já existe uma conta cadastrada com este endereço de e-mail." };
      }
      return { sucesso: false, erro: error.message };
    }

    if (!data.user) {
      return { sucesso: false, erro: "Não foi possível criar a conta de usuário." };
    }

    // 2. Auto-confirmar o e-mail via service_role para liberar acesso imediato sem travas
    try {
      await admin.auth.admin.updateUserById(data.user.id, {
        email_confirm: true,
      });
    } catch (errConfirm) {
      console.warn("Aviso ao auto-confirmar e-mail:", errConfirm);
    }

    // 3. Garantir o perfil na tabela sistema.usuarios
    try {
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
    } catch (errPerfil) {
      console.warn("Aviso ao sincronizar perfil:", errPerfil);
    }

    // 4. Estabelecer a sessão persistente nos cookies chamando signInWithPassword
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: dados.email.trim(),
      password: dados.senha,
    });

    if (loginError) {
      console.warn("Conta criada, aguardando login manual:", loginError.message);
      return {
        sucesso: true,
        requerLoginManual: true,
        usuario: data.user,
      };
    }

    try {
      revalidatePath("/", "layout");
    } catch {}

    return { sucesso: true, usuario: data.user };
  } catch (err: any) {
    console.error("Erro no cadastro:", err);
    return {
      sucesso: false,
      erro: err.message?.includes("NEXT_PUBLIC_SUPABASE_URL")
        ? "A conexão com o Supabase ainda não foi configurada nas variáveis de ambiente deste servidor."
        : `Erro ao criar conta: ${err.message || "Tente novamente mais tarde."}`,
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
