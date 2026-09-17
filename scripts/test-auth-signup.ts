import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testarAuth() {
  console.log("Testando Supabase Auth...");
  console.log("Supabase URL:", supabaseUrl);
  console.log("Anon Key presente:", !!supabaseAnonKey);
  console.log("Service Role Key presente:", !!serviceRoleKey);

  const client = createClient(supabaseUrl, supabaseAnonKey);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const emailTeste = `autor_teste_${Date.now()}@teste.com`;
  const senhaTeste = "SenhaSegura123!";

  console.log(`Tentando cadastrar usuário teste: ${emailTeste}...`);
  const { data: signData, error: signError } = await client.auth.signUp({
    email: emailTeste,
    password: senhaTeste,
    options: {
      data: {
        nome_completo: "Autor Teste",
        papel: "autor",
      },
    },
  });

  if (signError) {
    console.error("ERRO no signUp:", signError);
    return;
  }

  console.log("Cadastro realizado com sucesso!");
  console.log("ID do usuário:", signData.user?.id);
  console.log("Sessão criada:", !!signData.session);
  console.log("E-mail confirmado:", signData.user?.confirmed_at || "Aguardando confirmação ou auto-confirmado");

  // Verificar se o trigger em sistema.usuarios funcionou
  const { data: usuarioDb, error: dbError } = await admin
    .schema("sistema")
    .from("usuarios")
    .select("*")
    .eq("id", signData.user?.id)
    .single();

  if (dbError) {
    console.warn("Aviso ao buscar em sistema.usuarios:", dbError.message);
  } else {
    console.log("Usuário encontrado em sistema.usuarios:", usuarioDb);
  }

  // Tentar fazer login com a conta criada
  console.log("Tentando login com a conta criada...");
  const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
    email: emailTeste,
    password: senhaTeste,
  });

  if (loginError) {
    console.error("ERRO no signInWithPassword:", loginError.message);
    if (loginError.message.includes("Email not confirmed")) {
      console.log("DIAGNÓSTICO: O Supabase está exigindo confirmação de e-mail por link!");
    }
  } else {
    console.log("Login realizado com sucesso! Sessão ativa:", !!loginData.session);
  }

  // Limpar usuário de teste
  if (signData.user?.id) {
    await admin.auth.admin.deleteUser(signData.user.id);
    console.log("Usuário de teste removido após validação.");
  }
}

testarAuth().catch(console.error);
