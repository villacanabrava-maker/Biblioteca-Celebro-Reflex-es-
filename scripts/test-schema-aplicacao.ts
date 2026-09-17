import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const r1 = await admin.schema("aplicacao").from("v_obras_detalhadas").select("*");
  console.log("Teste schema aplicacao (v_obras_detalhadas):", r1.error ? r1.error : "SUCCESS: " + r1.data?.length + " itens");

  const r2 = await admin.schema("aplicacao").from("v_biblioteca_estatisticas").select("*");
  console.log("Teste schema aplicacao (v_biblioteca_estatisticas):", r2.error ? r2.error : "SUCCESS: " + r2.data?.length + " itens");
}

main().catch(console.error);
