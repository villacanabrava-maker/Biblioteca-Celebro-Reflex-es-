import fs from "fs";
import path from "path";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("ERRO: SUPABASE_DB_URL não encontrada no .env.local");
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: "require",
  max: 1,
});

async function runMigrations() {
  console.log("Conectando ao Supabase PostgreSQL...");
  try {
    const version = await sql`SELECT version();`;
    console.log("Conexão estabelecida com sucesso!");
    console.log("Versão do PostgreSQL:", version[0].version);

    // Tabela de controle de migrations
    await sql`
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        nome TEXT UNIQUE NOT NULL,
        executado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

    for (const file of files) {
      const jaExecutada = await sql`
        SELECT 1 FROM public._migrations WHERE nome = ${file};
      `;

      if (jaExecutada.length > 0) {
        console.log(`- Migration já aplicada: ${file}`);
        continue;
      }

      console.log(`-> Executando migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");

      await sql.unsafe(sqlContent);

      await sql`
        INSERT INTO public._migrations (nome) VALUES (${file});
      `;
      console.log(`OK: ${file} aplicada com sucesso!`);
    }

    console.log("Todas as migrations foram aplicadas com sucesso!");
  } catch (error) {
    console.error("Erro durante a execução das migrations:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
