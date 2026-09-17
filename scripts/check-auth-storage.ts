import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sql = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require" });

async function main() {
  const users = await sql`SELECT id, email, created_at FROM auth.users LIMIT 5;`;
  console.log("Usuários encontrados:", users);
  const buckets = await sql`SELECT id, name, public FROM storage.buckets;`;
  console.log("Buckets encontrados:", buckets);
  await sql.end();
}

main().catch(console.error);
