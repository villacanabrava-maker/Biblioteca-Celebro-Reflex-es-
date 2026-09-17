import path from "path";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sql = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require", max: 1 });

async function diagnostico() {
  console.log("--- DIAGNÓSTICO DO BANCO E TRIGGERS DE AUTH ---");

  // 1. Verificar tabela usuarios
  const tables = await sql`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name = 'usuarios';
  `;
  console.log("Tabela 'usuarios' encontrada:", tables);

  // 2. Verificar triggers em auth.users
  const triggers = await sql`
    SELECT trigger_name, event_manipulation, action_statement, action_timing
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' AND event_object_table = 'users';
  `;
  console.log("Triggers em auth.users:", triggers);

  // 3. Testar função manipular_novo_usuario_auth
  try {
    const fn = await sql`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'sistema' AND routine_name = 'manipular_novo_usuario_auth';
    `;
    console.log("Função sistema.manipular_novo_usuario_auth:", fn);
  } catch (e: any) {
    console.error("Erro ao buscar função:", e.message);
  }

  await sql.end();
}

diagnostico().catch(console.error);
