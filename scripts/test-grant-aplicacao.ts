import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sql = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require" });

async function main() {
  console.log("Aplicando GRANTs no schema aplicacao...");

  await sql`GRANT USAGE ON SCHEMA aplicacao, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria, sistema TO postgres, anon, authenticated, service_role;`;
  await sql`GRANT ALL ON ALL TABLES IN SCHEMA aplicacao, biblioteca TO postgres, authenticated, service_role;`;
  await sql`GRANT ALL ON ALL ROUTINES IN SCHEMA aplicacao, biblioteca TO postgres, authenticated, service_role;`;
  await sql`GRANT ALL ON ALL SEQUENCES IN SCHEMA aplicacao, biblioteca TO postgres, authenticated, service_role;`;

  await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA aplicacao GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;`;
  await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA aplicacao GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;`;

  // Criar também sinônimos/views em public para compatibilidade universal
  await sql`
    CREATE OR REPLACE VIEW public.v_obras_detalhadas AS
    SELECT * FROM aplicacao.v_obras_detalhadas;
  `;
  await sql`
    CREATE OR REPLACE VIEW public.v_biblioteca_estatisticas AS
    SELECT * FROM aplicacao.v_biblioteca_estatisticas;
  `;

  // Função RPC espelhada em public delegando para aplicacao
  await sql`
    CREATE OR REPLACE FUNCTION public.cadastrar_obra_com_versao(
        p_usuario_id UUID,
        p_titulo TEXT,
        p_subtitulo TEXT,
        p_autor_nome TEXT,
        p_tipo biblioteca.tipo_obra,
        p_natureza biblioteca.natureza_obra,
        p_ano_publicacao INTEGER,
        p_descricao TEXT,
        p_participa_cerebro BOOLEAN,
        p_peso_autoral NUMERIC,
        p_arquivo_caminho TEXT,
        p_arquivo_nome_original TEXT,
        p_arquivo_tamanho_bytes BIGINT,
        p_arquivo_mime_type TEXT,
        p_hash_sha256 TEXT,
        p_metadados JSONB DEFAULT '{}'::jsonb
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        RETURN aplicacao.cadastrar_obra_com_versao(
            p_usuario_id,
            p_titulo,
            p_subtitulo,
            p_autor_nome,
            p_tipo,
            p_natureza,
            p_ano_publicacao,
            p_descricao,
            p_participa_cerebro,
            p_peso_autoral,
            p_arquivo_caminho,
            p_arquivo_nome_original,
            p_arquivo_tamanho_bytes,
            p_arquivo_mime_type,
            p_hash_sha256,
            p_metadados
        );
    END;
    $$;
  `;

  await sql`NOTIFY pgrst, 'reload schema';`;
  console.log("GRANTs e views de projeção aplicadas com sucesso!");
  await sql.end();
}

main().catch(console.error);
