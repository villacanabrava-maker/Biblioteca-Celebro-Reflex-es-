import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.SUPABASE_DB_URL!);

  console.log("--- BUCKETS ---");
  const buckets = await sql`SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets`;
  console.log(JSON.stringify(buckets, null, 2));

  console.log("\n--- POLICIES ON storage.objects ---");
  const policies = await sql`
    SELECT policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  `;
  console.log(JSON.stringify(policies, null, 2));

  await sql.end();
}

main().catch(console.error);
