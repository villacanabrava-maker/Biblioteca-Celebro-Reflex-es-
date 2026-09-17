import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sql = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require" });

async function main() {
  console.log("Tentando configurar db_schemas no Postgres...");
  try {
    await sql`ALTER ROLE authenticator SET pgrst.db_schemas = 'public, aplicacao, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria, sistema';`;
    await sql`GRANT USAGE ON SCHEMA aplicacao, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria, sistema TO postgres, anon, authenticated, service_role;`;
    await sql`GRANT ALL ON ALL TABLES IN SCHEMA aplicacao, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria, sistema TO postgres, authenticated, service_role;`;
    await sql`GRANT ALL ON ALL SEQUENCES IN SCHEMA aplicacao, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria, sistema TO postgres, authenticated, service_role;`;
    await sql`GRANT ALL ON ALL ROUTINES IN SCHEMA aplicacao, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria, sistema TO postgres, authenticated, service_role;`;
    await sql`NOTIFY pgrst, 'reload config';`;
    await sql`NOTIFY pgrst, 'reload schema';`;
    console.log("Configuração aplicada com sucesso!");
  } catch (err) {
    console.error("Erro ao alterar authenticator:", err);
  }
  await sql.end();
}

main();
