-- ============================================================================
-- MIGRATION 0003: BIBLIOTECA & ARMAZENAMENTO SEGURO
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- 1. TIPOS ENUM CANÔNICOS DA BIBLIOTECA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'tipo_obra' AND n.nspname = 'biblioteca') THEN
        CREATE TYPE biblioteca.tipo_obra AS ENUM (
            'livro',
            'reflexao',
            'carta',
            'relato',
            'ensaio',
            'artigo',
            'caderno_notas',
            'entrevista',
            'outro'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'natureza_obra' AND n.nspname = 'biblioteca') THEN
        CREATE TYPE biblioteca.natureza_obra AS ENUM (
            'autoral',          -- Fonte primária do autor: integra o Núcleo Autoral
            'externa_aprovada', -- Influência externa deliberada: nunca vira autoria silenciosamente
            'referencia'        -- Material de apoio ou consulta técnica
        );
    END IF;
END $$;

-- 2. TABELA: biblioteca.obras
CREATE TABLE IF NOT EXISTS biblioteca.obras (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    autor_nome TEXT NOT NULL DEFAULT 'Autor',
    tipo biblioteca.tipo_obra NOT NULL,
    natureza biblioteca.natureza_obra NOT NULL DEFAULT 'autoral',
    ano_publicacao INTEGER,
    descricao TEXT,
    metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
    participa_cerebro BOOLEAN NOT NULL DEFAULT TRUE,
    peso_autoral NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (peso_autoral >= 0.00 AND peso_autoral <= 1.00),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE biblioteca.obras IS 'Catálogo central de obras, livros, ensaios e fontes do acervo';
COMMENT ON COLUMN biblioteca.obras.natureza IS 'Separação rígida entre Núcleo Autoral e Influências Externas';
COMMENT ON COLUMN biblioteca.obras.peso_autoral IS 'Peso de ponderação metodológica no cálculo do Cérebro Autoral (0.00 a 1.00)';

-- Trigger de atualização automática da coluna atualizado_em
DROP TRIGGER IF EXISTS trg_biblioteca_obras_atualizado_em ON biblioteca.obras;
CREATE TRIGGER trg_biblioteca_obras_atualizado_em
    BEFORE UPDATE ON biblioteca.obras
    FOR EACH ROW
    EXECUTE FUNCTION sistema.atualizar_coluna_atualizado_em();

-- 3. TABELA: biblioteca.versoes_obras
CREATE TABLE IF NOT EXISTS biblioteca.versoes_obras (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    obra_id UUID NOT NULL REFERENCES biblioteca.obras(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_versao INTEGER NOT NULL DEFAULT 1,
    arquivo_caminho TEXT NOT NULL,
    arquivo_nome_original TEXT NOT NULL,
    arquivo_tamanho_bytes BIGINT NOT NULL,
    arquivo_mime_type TEXT NOT NULL,
    hash_sha256 TEXT NOT NULL,
    total_paginas INTEGER DEFAULT 0,
    total_palavras_estimado INTEGER DEFAULT 0,
    estado_processamento TEXT NOT NULL DEFAULT 'pendente' CHECK (estado_processamento IN ('pendente', 'em_processamento', 'processado', 'falha', 'reprocessando')),
    erro_processamento TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_versao_obra_numero UNIQUE (obra_id, numero_versao)
);

COMMENT ON TABLE biblioteca.versoes_obras IS 'Arquivos imutáveis preservados e metadados de cada versão da obra';

DROP TRIGGER IF EXISTS trg_biblioteca_versoes_obras_atualizado_em ON biblioteca.versoes_obras;
CREATE TRIGGER trg_biblioteca_versoes_obras_atualizado_em
    BEFORE UPDATE ON biblioteca.versoes_obras
    FOR EACH ROW
    EXECUTE FUNCTION sistema.atualizar_coluna_atualizado_em();

-- 4. ÍNDICES DE PERFORMANCE E INTEGRIDADE
CREATE INDEX IF NOT EXISTS idx_obras_usuario_id ON biblioteca.obras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_obras_tipo ON biblioteca.obras(tipo);
CREATE INDEX IF NOT EXISTS idx_obras_natureza ON biblioteca.obras(natureza);
CREATE INDEX IF NOT EXISTS idx_obras_participa_cerebro ON biblioteca.obras(participa_cerebro);
CREATE INDEX IF NOT EXISTS idx_obras_criado_em ON biblioteca.obras(criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_versoes_obra_id ON biblioteca.versoes_obras(obra_id);
CREATE INDEX IF NOT EXISTS idx_versoes_usuario_id ON biblioteca.versoes_obras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_versoes_hash ON biblioteca.versoes_obras(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_versoes_estado ON biblioteca.versoes_obras(estado_processamento);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE biblioteca.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblioteca.versoes_obras ENABLE ROW LEVEL SECURITY;

-- Políticas de isolamento do usuário (RLS)
DROP POLICY IF EXISTS "Usuário gerencia suas próprias obras" ON biblioteca.obras;
CREATE POLICY "Usuário gerencia suas próprias obras"
    ON biblioteca.obras
    FOR ALL
    TO authenticated
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuário gerencia versões de suas próprias obras" ON biblioteca.versoes_obras;
CREATE POLICY "Usuário gerencia versões de suas próprias obras"
    ON biblioteca.versoes_obras
    FOR ALL
    TO authenticated
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- 6. CONFIGURAÇÃO DO BUCKET PRIVADO NO STORAGE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'originais-biblioteca',
    'originais-biblioteca',
    false,
    524288000, -- 500 MB
    ARRAY[
        'application/pdf',
        'application/epub+zip',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
    ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 524288000,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/epub+zip',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
    ]::text[];

-- Políticas de acesso ao Storage para originais-biblioteca
DROP POLICY IF EXISTS "Leitura de originais pelo proprietário" ON storage.objects;
CREATE POLICY "Leitura de originais pelo proprietário"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'originais-biblioteca'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Upload de originais pelo proprietário" ON storage.objects;
CREATE POLICY "Upload de originais pelo proprietário"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'originais-biblioteca'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Exclusão de originais pelo proprietário" ON storage.objects;
CREATE POLICY "Exclusão de originais pelo proprietário"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'originais-biblioteca'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 7. VIEWS NO SCHEMA aplicacao
DROP VIEW IF EXISTS aplicacao.v_obras_detalhadas CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_obras_detalhadas AS
WITH ultima_versao AS (
    SELECT DISTINCT ON (obra_id)
        id AS versao_id,
        obra_id,
        numero_versao,
        arquivo_caminho,
        arquivo_nome_original,
        arquivo_tamanho_bytes,
        arquivo_mime_type,
        hash_sha256,
        total_paginas,
        total_palavras_estimado,
        estado_processamento,
        erro_processamento,
        criado_em AS versao_criado_em
    FROM biblioteca.versoes_obras
    ORDER BY obra_id, numero_versao DESC
),
contagem_versoes AS (
    SELECT obra_id, COUNT(*) AS total_versoes
    FROM biblioteca.versoes_obras
    GROUP BY obra_id
)
SELECT
    o.id,
    o.usuario_id,
    o.titulo,
    o.subtitulo,
    o.autor_nome,
    o.tipo,
    o.natureza,
    o.ano_publicacao,
    o.descricao,
    o.metadados,
    o.participa_cerebro,
    o.peso_autoral,
    o.criado_em,
    o.atualizado_em,
    COALESCE(cv.total_versoes, 0)::INT AS total_versoes,
    uv.versao_id,
    uv.numero_versao,
    uv.arquivo_caminho,
    uv.arquivo_nome_original,
    uv.arquivo_tamanho_bytes,
    uv.arquivo_mime_type,
    uv.hash_sha256,
    COALESCE(uv.total_paginas, 0)::INT AS total_paginas,
    COALESCE(uv.total_palavras_estimado, 0)::INT AS total_palavras_estimado,
    COALESCE(uv.estado_processamento, 'pendente') AS estado_processamento,
    uv.erro_processamento
FROM biblioteca.obras o
LEFT JOIN ultima_versao uv ON uv.obra_id = o.id
LEFT JOIN contagem_versoes cv ON cv.obra_id = o.id;

COMMENT ON VIEW aplicacao.v_obras_detalhadas IS 'Visão canônica de obras com status e metadados de sua versão mais recente';

DROP VIEW IF EXISTS aplicacao.v_biblioteca_estatisticas CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_biblioteca_estatisticas AS
SELECT
    o.usuario_id,
    COUNT(DISTINCT o.id)::INT AS total_obras,
    COUNT(DISTINCT o.id) FILTER (WHERE o.natureza = 'autoral')::INT AS total_autorais,
    COUNT(DISTINCT o.id) FILTER (WHERE o.natureza = 'externa_aprovada')::INT AS total_influencias_externas,
    COUNT(DISTINCT o.id) FILTER (WHERE o.participa_cerebro = TRUE)::INT AS total_no_cerebro,
    COALESCE(SUM(v.total_paginas), 0)::INT AS total_paginas,
    COALESCE(SUM(v.total_palavras_estimado), 0)::INT AS total_palavras
FROM biblioteca.obras o
LEFT JOIN biblioteca.versoes_obras v ON v.obra_id = o.id
GROUP BY o.usuario_id;

COMMENT ON VIEW aplicacao.v_biblioteca_estatisticas IS 'Métricas consolidadas do acervo por usuário';

-- 8. RPCs NO SCHEMA aplicacao
CREATE OR REPLACE FUNCTION aplicacao.cadastrar_obra_com_versao(
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
DECLARE
    v_nova_obra_id UUID;
    v_nova_versao_id UUID;
    v_resultado JSONB;
BEGIN
    -- Validação de entrada
    IF p_titulo IS NULL OR trim(p_titulo) = '' THEN
        RAISE EXCEPTION 'O título da obra é obrigatório.';
    END IF;

    IF p_arquivo_caminho IS NULL OR trim(p_arquivo_caminho) = '' THEN
        RAISE EXCEPTION 'O caminho do arquivo no armazenamento é obrigatório.';
    END IF;

    -- Inserir obra
    INSERT INTO biblioteca.obras (
        usuario_id,
        titulo,
        subtitulo,
        autor_nome,
        tipo,
        natureza,
        ano_publicacao,
        descricao,
        metadados,
        participa_cerebro,
        peso_autoral
    ) VALUES (
        p_usuario_id,
        trim(p_titulo),
        nullif(trim(p_subtitulo), ''),
        COALESCE(nullif(trim(p_autor_nome), ''), 'Autor'),
        p_tipo,
        p_natureza,
        p_ano_publicacao,
        nullif(trim(p_descricao), ''),
        COALESCE(p_metadados, '{}'::jsonb),
        COALESCE(p_participa_cerebro, TRUE),
        COALESCE(p_peso_autoral, 1.00)
    ) RETURNING id INTO v_nova_obra_id;

    -- Inserir primeira versão da obra
    INSERT INTO biblioteca.versoes_obras (
        obra_id,
        usuario_id,
        numero_versao,
        arquivo_caminho,
        arquivo_nome_original,
        arquivo_tamanho_bytes,
        arquivo_mime_type,
        hash_sha256,
        estado_processamento
    ) VALUES (
        v_nova_obra_id,
        p_usuario_id,
        1,
        p_arquivo_caminho,
        p_arquivo_nome_original,
        p_arquivo_tamanho_bytes,
        p_arquivo_mime_type,
        p_hash_sha256,
        'pendente'
    ) RETURNING id INTO v_nova_versao_id;

    -- Retornar representação JSON da obra cadastrada
    SELECT to_jsonb(v) INTO v_resultado
    FROM aplicacao.v_obras_detalhadas v
    WHERE v.id = v_nova_obra_id;

    RETURN v_resultado;
END;
$$;

COMMENT ON FUNCTION aplicacao.cadastrar_obra_com_versao IS 'Cria atomicamente uma obra e registra sua versão inicial no acervo';
