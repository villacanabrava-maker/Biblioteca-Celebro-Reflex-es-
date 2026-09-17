import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sql = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require" });

async function limparDuplicatasTeste() {
  console.log("Higienizando acervo de teste...");

  // Manter a obra mais recente de cada título e remover duplicadas
  const duplicatas = await sql`
    DELETE FROM biblioteca.obras
    WHERE id NOT IN (
      SELECT DISTINCT ON (titulo) id
      FROM biblioteca.obras
      ORDER BY titulo, criado_em DESC
    );
  `;
  console.log("Duplicatas removidas.");

  const restantes = await sql`
    SELECT id, titulo, natureza, tipo, participa_cerebro, criado_em
    FROM biblioteca.obras
    ORDER BY criado_em DESC;
  `;
  console.log("Obras ativas no acervo:", restantes);

  await sql.end();
}

limparDuplicatasTeste();
