import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sql = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require" });

async function main() {
  console.log("Tentando configurar db_schemas no Postgres...");
  try {
    await sql`ALTER ROLE authenticator SET pgrst.db_schemas = 'public, aplicacao';`;
    await sql`NOTIFY pgrst, 'reload config';`;
    console.log("Configuração aplicada com sucesso!");
  } catch (err) {
    console.error("Erro ao alterar authenticator:", err);
  }
  await sql.end();
}

main();
