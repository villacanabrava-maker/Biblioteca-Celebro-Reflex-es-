import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testarAutoConfirm() {
  console.log("--- TESTE DE AUTO-CONFIRMAÇÃO E LOGIN IMEDIATO ---");
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const emailTeste = `autor_confirmado_${Date.now()}@teste.com`;
  const senhaTeste = "SenhaSegura123!";

  console.log(`1. Cadastrando: ${emailTeste}...`);
  const { data: signData, error: signError } = await client.auth.signUp({
    email: emailTeste,
    password: senhaTeste,
    options: {
      data: {
        nome_completo: "Autor AutoConfirmado",
        papel: "autor",
      },
    },
  });

  if (signError || !signData.user) {
    console.error("Erro no signUp:", signError);
    return;
  }

  console.log("2. Auto-confirmando e-mail via Admin...");
  const { data: updatedUser, error: updateError } = await admin.auth.admin.updateUserById(
    signData.user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error("Erro ao auto-confirmar:", updateError);
    return;
  }
  console.log("E-mail confirmado com sucesso pelo admin!");

  console.log("3. Testando signInWithPassword imediato...");
  const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
    email: emailTeste,
    password: senhaTeste,
  });

  if (loginError) {
    console.error("ERRO no login:", loginError.message);
  } else {
    console.log("SUCESSO ABSOLUTO! Login efetuado sem precisar clicar em link de e-mail!");
    console.log("Access Token gerado:", !!loginData.session?.access_token);
  }

  // Limpeza
  await admin.auth.admin.deleteUser(signData.user.id);
  console.log("Usuário de teste removido.");
}

testarAutoConfirm().catch(console.error);
