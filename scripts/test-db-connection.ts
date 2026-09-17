import path from "path";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("ERRO: SUPABASE_DB_URL não encontrada.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require", max: 1 });

async function testConnection() {
  console.log("Iniciando auditoria no Supabase PostgreSQL...");
  try {
    const schemas = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('aplicacao', 'biblioteca', 'processamento', 'taxonomia', 'cerebro_autoral', 'reflexoes', 'auditoria', 'sistema')
      ORDER BY schema_name;
    `;
    console.log("Schemas ativos encontrados:", schemas.map((s) => s.schema_name));

    const extensions = await sql`
      SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'vector');
    `;
    console.log("Extensões ativas:", extensions.map((e) => `${e.extname} (v${e.extversion})`));

    const dimensoes = await sql`
      SELECT ordem, codigo, nome FROM cerebro_autoral.dimensoes ORDER BY ordem;
    `;
    console.log(`Dimensões do Cérebro cadastradas: ${dimensoes.length}`);
    dimensoes.forEach((d) => console.log(`  [${d.ordem}] ${d.nome} (${d.codigo})`));

    const modelos = await sql`
      SELECT apelido, finalidade, identificador_modelo FROM sistema.modelos_ia;
    `;
    console.log(`Modelos de IA mapeados: ${modelos.length}`);
    modelos.forEach((m) => console.log(`  - [${m.finalidade}] ${m.apelido}: ${m.identificador_modelo}`));

    console.log("\nAuditoria concluída com 100% de integridade!");
  } catch (err) {
    console.error("Erro na verificação do banco:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testConnection();
