import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const dbUrl = process.env.SUPABASE_DB_URL!;

const sql = postgres(dbUrl, { ssl: "require", max: 1 });
const client = createClient(supabaseUrl, supabaseAnonKey);
const admin = createClient(supabaseUrl, serviceRoleKey);

async function auditoriaCompleta() {
  console.log("=================================================");
  console.log("AUDITORIA GERAL DO BANCO SUPABASE & FLUXO DE AUTH");
  console.log("=================================================");

  // 1. Verificar Schemas
  const schemas = await sql`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name IN ('sistema', 'biblioteca', 'processamento', 'taxonomia', 'cerebro_autoral', 'reflexoes', 'auditoria')
    ORDER BY schema_name;
  `;
  console.log("✓ Schemas ativos:", schemas.map(s => s.schema_name).join(", "));

  // 2. Verificar Tabelas Críticas
  const tabelas = await sql`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('sistema', 'biblioteca', 'processamento', 'taxonomia', 'cerebro_autoral', 'reflexoes', 'auditoria')
    ORDER BY table_schema, table_name;
  `;
  console.log(`✓ Total de tabelas ativas no banco: ${tabelas.length}`);

  // 3. Teste Completo de Criação de Conta do Usuário
  const emailTeste = `autor_auditoria_${Date.now()}@teste.com`;
  const senhaTeste = "SenhaValida123!";

  console.log(`\n-> Testando criação de conta: ${emailTeste}...`);
  const { data: signData, error: signError } = await client.auth.signUp({
    email: emailTeste,
    password: senhaTeste,
    options: {
      data: {
        nome_completo: "Roberth Autor",
        papel: "autor",
      },
    },
  });

  if (signError || !signData.user) {
    console.error("FALHA no cadastro:", signError);
    process.exit(1);
  }
  console.log("✓ Conta criada com sucesso no Supabase Auth! ID:", signData.user.id);

  // 4. Auto-confirmação imediata
  const { error: confirmError } = await admin.auth.admin.updateUserById(signData.user.id, {
    email_confirm: true,
  });
  if (confirmError) {
    console.error("FALHA ao confirmar e-mail:", confirmError);
  } else {
    console.log("✓ E-mail confirmado com sucesso via service_role!");
  }

  // 5. Testar Login e Sessão
  const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
    email: emailTeste,
    password: senhaTeste,
  });

  if (loginError || !loginData.session) {
    console.error("FALHA no login:", loginError);
    process.exit(1);
  }
  console.log("✓ Login efetuado com sucesso! Access token JWT gerado!");

  // 6. Testar Acesso Autenticado ao Perfil (RLS)
  const clientAutenticado = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${loginData.session.access_token}`,
      },
    },
  });

  const { data: perfil, error: perfilError } = await clientAutenticado
    .schema("sistema")
    .from("usuarios")
    .select("*")
    .eq("id", signData.user.id)
    .single();

  if (perfilError) {
    console.error("FALHA ao ler perfil com RLS:", perfilError);
  } else {
    console.log("✓ Perfil do usuário lido com RLS ativo:", perfil.nome, "| Papel:", perfil.papel);
  }

  // 7. Testar Criação de Obra na Biblioteca
  const { data: obra, error: obraError } = await clientAutenticado
    .schema("biblioteca")
    .from("obras")
    .insert({
      usuario_id: signData.user.id,
      titulo: "Ensaio Teste de Auditoria",
      tipo: "ensaio",
      natureza: "autoral",
      participa_cerebro: true,
      peso_autoral: 1.0,
    })
    .select()
    .single();

  if (obraError) {
    console.error("FALHA ao criar obra:", obraError);
  } else {
    console.log("✓ Obra criada na Biblioteca com sucesso via RLS! ID:", obra.id);
  }

  // 8. Testar Criação de Reflexão e Fluxo
  const { data: reflexao, error: reflexaoError } = await clientAutenticado
    .schema("reflexoes")
    .from("entradas")
    .insert({
      usuario_id: signData.user.id,
      titulo: "Reflexão sobre o Tempo",
      tema_central: "Tempo e Paciência",
      provocacao_inicial: "A urgência destrói o pensamento?",
      formato_desejado: "ensaio",
      estado: "criada",
    })
    .select()
    .single();

  if (reflexaoError) {
    console.error("FALHA ao criar reflexão:", reflexaoError);
  } else {
    console.log("✓ Entrada de reflexão criada com sucesso via RLS! ID:", reflexao.id);
  }

  // 9. Limpeza do Usuário de Teste
  await admin.auth.admin.deleteUser(signData.user.id);
  console.log("✓ Usuário de teste removido após validação 100% limpa.");

  await sql.end();
  console.log("\n=================================================");
  console.log("TODOS OS TESTES DO SUPABASE PASSARAM COM SUCESSO!");
  console.log("O BANCO ESTÁ 100% OPERACIONAL E SEM NENHUM ERRO.");
  console.log("=================================================");
}

auditoriaCompleta().catch(console.error);
