import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testarAdminCreateUser() {
  console.log("Testando admin.auth.admin.createUser (Sem rate limit de e-mail)...");
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const emailTeste = `autor_sucesso_${Date.now()}@teste.com`;
  const senhaTeste = "SenhaValida123!";

  console.log(`1. Criando usuário via admin: ${emailTeste}...`);
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email: emailTeste,
    password: senhaTeste,
    email_confirm: true,
    user_metadata: {
      nome_completo: "Autor Sucesso Imediato",
      papel: "autor",
    },
  });

  if (createError || !userData.user) {
    console.error("ERRO ao criar usuário via admin:", createError);
    return;
  }
  console.log("✓ Usuário criado e auto-confirmado com sucesso! ID:", userData.user.id);

  console.log("2. Efetuando login imediato via signInWithPassword...");
  const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
    email: emailTeste,
    password: senhaTeste,
  });

  if (loginError || !loginData.session) {
    console.error("ERRO ao logar:", loginError);
    return;
  }
  console.log("✓ LOGIN EFETUADO COM SUCESSO ABSOLUTO! Sessão ativa:", !!loginData.session.access_token);

  // Limpeza
  await admin.auth.admin.deleteUser(userData.user.id);
  console.log("✓ Usuário de teste removido.");
}

testarAdminCreateUser().catch(console.error);
