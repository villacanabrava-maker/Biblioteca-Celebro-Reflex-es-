-- ============================================================================
-- MIGRATION 0004: PROCESSAMENTO DOCUMENTAL, HIERARQUIA & VETORES HNSW
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- 1. PERFIS DE EMBEDDING VERSIONADOS (SISTEMA)
CREATE TABLE IF NOT EXISTS sistema.perfis_embedding (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    provedor TEXT NOT NULL DEFAULT 'openai',
    modelo TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    dimensoes INTEGER NOT NULL DEFAULT 1536,
    metrica TEXT NOT NULL DEFAULT 'cosine',
    normalizado BOOLEAN NOT NULL DEFAULT true,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE sistema.perfis_embedding IS 'Perfis versionados de modelos de embedding para garantir compatibilidade vetorial';

-- Seed do perfil padrão canônico 1536d
INSERT INTO sistema.perfis_embedding (nome, provedor, modelo, dimensoes, metrica, normalizado, ativo)
VALUES ('openai_text_embedding_3_small_1536', 'openai', 'text-embedding-3-small', 1536, 'cosine', true, true)
ON CONFLICT (nome) DO NOTHING;

-- 2. UNIDADES DE CONHECIMENTO (INTEGRIDADE REFERENCIAL POLIMÓRFICA REAL)
CREATE TABLE IF NOT EXISTS processamento.unidades_conhecimento (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES biblioteca.obras(id) ON DELETE CASCADE,
    versao_obra_id UUID NOT NULL REFERENCES biblioteca.versoes_obras(id) ON DELETE CASCADE,
    tipo_unidade TEXT NOT NULL CHECK (tipo_unidade IN ('fragmento', 'secao', 'sintese', 'documento')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE processamento.unidades_conhecimento IS 'Entidade raiz de unidades recuperáveis garantindo integridade referencial física por FK';

-- 3. DOCUMENTOS PROCESSADOS
CREATE TABLE IF NOT EXISTS processamento.documentos_processados (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    versao_obra_id UUID NOT NULL UNIQUE REFERENCES biblioteca.versoes_obras(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo_processado TEXT NOT NULL,
    total_secoes INTEGER NOT NULL DEFAULT 0,
    total_fragmentos INTEGER NOT NULL DEFAULT 0,
    total_palavras INTEGER NOT NULL DEFAULT 0,
    total_tokens_estimado INTEGER NOT NULL DEFAULT 0,
    estado_publicacao TEXT NOT NULL DEFAULT 'candidato' CHECK (estado_publicacao IN ('candidato', 'ativo', 'arquivado', 'rejeitado')),
    publicado_em TIMESTAMPTZ,
    metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE processamento.documentos_processados IS 'Registro de publicação atômica e metadados agregados do documento estruturado';

-- 4. SEÇÕES DOCUMENTAIS HIERÁRQUICAS
CREATE TABLE IF NOT EXISTS processamento.secoes (
    id UUID PRIMARY KEY REFERENCES processamento.unidades_conhecimento(id) ON DELETE CASCADE,
    documento_processado_id UUID NOT NULL REFERENCES processamento.documentos_processados(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secao_pai_id UUID REFERENCES processamento.secoes(id) ON DELETE CASCADE,
    nivel INTEGER NOT NULL DEFAULT 1,
    ordem INTEGER NOT NULL DEFAULT 1,
    titulo TEXT NOT NULL,
    tipo_secao TEXT NOT NULL DEFAULT 'capitulo',
    resumo_secao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE processamento.secoes IS 'Estrutura hierárquica do livro ou texto (partes, capítulos, subseções, ensaios)';

-- 5. FRAGMENTOS TEXTUAIS ATÔMICOS (COM BUSCA TEXTUAL FTS)
CREATE TABLE IF NOT EXISTS processamento.fragmentos (
    id UUID PRIMARY KEY REFERENCES processamento.unidades_conhecimento(id) ON DELETE CASCADE,
    documento_processado_id UUID NOT NULL REFERENCES processamento.documentos_processados(id) ON DELETE CASCADE,
    secao_id UUID REFERENCES processamento.secoes(id) ON DELETE SET NULL,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    conteudo TEXT NOT NULL,
    total_palavras INTEGER NOT NULL DEFAULT 0,
    total_caracteres INTEGER NOT NULL DEFAULT 0,
    total_tokens_estimado INTEGER NOT NULL DEFAULT 0,
    posicao_inicio_char INTEGER,
    posicao_fim_char INTEGER,
    pagina_inicio INTEGER,
    pagina_fim INTEGER,
    tsv_conteudo tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', conteudo)) STORED,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE processamento.fragmentos IS 'Unidades textuais de raciocínio contínuo com coluna FTS pré-computada em português';

-- 6. SÍNTESES REFLEXIVAS MULTINÍVEL
CREATE TABLE IF NOT EXISTS processamento.sinteses (
    id UUID PRIMARY KEY REFERENCES processamento.unidades_conhecimento(id) ON DELETE CASCADE,
    unidade_origem_id UUID NOT NULL REFERENCES processamento.unidades_conhecimento(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nivel_abstracao TEXT NOT NULL DEFAULT 'executivo' CHECK (nivel_abstracao IN ('micro', 'secao', 'executivo', 'tese_central')),
    conteudo_sintese TEXT NOT NULL,
    pontos_chave JSONB NOT NULL DEFAULT '[]'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE processamento.sinteses IS 'Sínteses em diferentes níveis de abstração preservando teses e conceitos';

-- 7. VETORES DE ALTA PERFORMANCE (PGVECTOR HNSW 1536D)
CREATE TABLE IF NOT EXISTS processamento.vetores (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    unidade_conhecimento_id UUID NOT NULL REFERENCES processamento.unidades_conhecimento(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    perfil_embedding_id UUID NOT NULL REFERENCES sistema.perfis_embedding(id),
    embedding extensions.vector(1536) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_unidade_perfil UNIQUE (unidade_conhecimento_id, perfil_embedding_id)
);
COMMENT ON TABLE processamento.vetores IS 'Embeddings vetoriais vinculados a perfis controlados e indexados com HNSW';

-- 8. ELEMENTOS CONCEITUAIS E ARGUMENTATIVOS
CREATE TABLE IF NOT EXISTS processamento.elementos (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    fragmento_id UUID NOT NULL REFERENCES processamento.fragmentos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_elemento TEXT NOT NULL CHECK (tipo_elemento IN ('argumento', 'conceito', 'metafora', 'citacao', 'tensao', 'pergunta_retorica', 'conclusao')),
    conteudo TEXT NOT NULL,
    confianca NUMERIC(3,2) NOT NULL DEFAULT 0.85,
    metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE processamento.elementos IS 'Elementos de método, estilo e argumentação extraídos dos fragmentos';

-- 9. EVIDÊNCIAS DAS 18 DIMENSÕES DO CÉREBRO
CREATE TABLE IF NOT EXISTS processamento.evidencias (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fragmento_id UUID NOT NULL REFERENCES processamento.fragmentos(id) ON DELETE CASCADE,
    dimensao_id UUID NOT NULL REFERENCES cerebro_autoral.dimensoes(id) ON DELETE CASCADE,
    trecho_citado TEXT NOT NULL,
    explicacao TEXT NOT NULL,
    forca_evidencia NUMERIC(3,2) NOT NULL DEFAULT 0.90,
    eh_contraevidencia BOOLEAN NOT NULL DEFAULT FALSE,
    estado_revisao sistema.estado_revisao NOT NULL DEFAULT 'proposta',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE processamento.evidencias IS 'Vínculos comprobatórios entre trechos textuais exatos e as 18 dimensões metodológicas';

-- 10. MÁQUINA DE ESTADOS DO PIPELINE (EXECUÇÕES & ETAPAS COM IDEMPOTÊNCIA)
CREATE TABLE IF NOT EXISTS processamento.execucoes (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    versao_obra_id UUID NOT NULL REFERENCES biblioteca.versoes_obras(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pipeline_versao TEXT NOT NULL DEFAULT 'v1.0',
    estado TEXT NOT NULL DEFAULT 'iniciado' CHECK (estado IN ('iniciado', 'em_execucao', 'concluido', 'falha', 'cancelado')),
    correlacao_id TEXT NOT NULL,
    iniciado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    concluido_em TIMESTAMPTZ,
    erro_mensagem TEXT,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    custo_estimado_usd NUMERIC(8,4) NOT NULL DEFAULT 0
);
COMMENT ON TABLE processamento.execucoes IS 'Instâncias de processamento com observabilidade e rastreabilidade total de custos';

CREATE TABLE IF NOT EXISTS processamento.etapas_execucao (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    execucao_id UUID NOT NULL REFERENCES processamento.execucoes(id) ON DELETE CASCADE,
    nome_etapa TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'em_execucao', 'concluido', 'falha', 'ignorado')),
    chave_idempotencia TEXT NOT NULL UNIQUE,
    payload_entrada JSONB NOT NULL DEFAULT '{}'::jsonb,
    resultado JSONB NOT NULL DEFAULT '{}'::jsonb,
    erro_detalhe TEXT,
    duracao_ms INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    concluido_em TIMESTAMPTZ
);
COMMENT ON TABLE processamento.etapas_execucao IS 'Etapas duráveis do workflow protegidas por chaves únicas de idempotência SHA-256';

-- 11. ÍNDICES DE ALTA PERFORMANCE (HNSW, GIN, B-TREE)
CREATE INDEX IF NOT EXISTS idx_vetores_hnsw ON processamento.vetores USING hnsw (embedding extensions.vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_fragmentos_tsv ON processamento.fragmentos USING gin (tsv_conteudo);

CREATE INDEX IF NOT EXISTS idx_unidades_usuario_obra ON processamento.unidades_conhecimento(usuario_id, obra_id);
CREATE INDEX IF NOT EXISTS idx_secoes_doc ON processamento.secoes(documento_processado_id, ordem);
CREATE INDEX IF NOT EXISTS idx_fragmentos_doc_secao ON processamento.fragmentos(documento_processado_id, secao_id, ordem);
CREATE INDEX IF NOT EXISTS idx_elementos_fragmento ON processamento.elementos(fragmento_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_dimensao ON processamento.evidencias(dimensao_id);
CREATE INDEX IF NOT EXISTS idx_etapas_execucao_chave ON processamento.etapas_execucao(chave_idempotencia);

-- 12. ROW LEVEL SECURITY (RLS)
ALTER TABLE processamento.unidades_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.documentos_processados ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.fragmentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.sinteses ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.vetores ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.elementos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamento.etapas_execucao ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Políticas de isolamento por usuário
    DROP POLICY IF EXISTS "Usuário gerencia suas unidades" ON processamento.unidades_conhecimento;
    CREATE POLICY "Usuário gerencia suas unidades" ON processamento.unidades_conhecimento FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

    DROP POLICY IF EXISTS "Usuário gerencia seus documentos processados" ON processamento.documentos_processados;
    CREATE POLICY "Usuário gerencia seus documentos processados" ON processamento.documentos_processados FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

    DROP POLICY IF EXISTS "Usuário gerencia suas seções" ON processamento.secoes;
    CREATE POLICY "Usuário gerencia suas seções" ON processamento.secoes FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

    DROP POLICY IF EXISTS "Usuário gerencia seus fragmentos" ON processamento.fragmentos;
    CREATE POLICY "Usuário gerencia seus fragmentos" ON processamento.fragmentos FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

    DROP POLICY IF EXISTS "Usuário gerencia seus vetores" ON processamento.vetores;
    CREATE POLICY "Usuário gerencia seus vetores" ON processamento.vetores FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

    DROP POLICY IF EXISTS "Usuário gerencia suas execuções" ON processamento.execucoes;
    CREATE POLICY "Usuário gerencia suas execuções" ON processamento.execucoes FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
END $$;

-- 13. VIEWS NO SCHEMA aplicacao
DROP VIEW IF EXISTS aplicacao.v_documentos_processados CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_documentos_processados AS
SELECT
    dp.id,
    dp.versao_obra_id,
    dp.usuario_id,
    dp.titulo_processado,
    dp.total_secoes,
    dp.total_fragmentos,
    dp.total_palavras,
    dp.total_tokens_estimado,
    dp.estado_publicacao,
    dp.publicado_em,
    dp.criado_em,
    dp.atualizado_em,
    o.id AS obra_id,
    o.titulo AS obra_titulo,
    o.autor_nome,
    o.tipo AS obra_tipo,
    o.natureza AS obra_natureza,
    o.participa_cerebro
FROM processamento.documentos_processados dp
JOIN biblioteca.versoes_obras vo ON vo.id = dp.versao_obra_id
JOIN biblioteca.obras o ON o.id = vo.obra_id;

DROP VIEW IF EXISTS aplicacao.v_fragmentos_detalhados CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_fragmentos_detalhados AS
SELECT
    f.id,
    f.documento_processado_id,
    f.secao_id,
    f.usuario_id,
    f.ordem,
    f.conteudo,
    f.total_palavras,
    f.total_tokens_estimado,
    f.pagina_inicio,
    f.pagina_fim,
    s.titulo AS secao_titulo,
    s.nivel AS secao_nivel,
    o.id AS obra_id,
    o.titulo AS obra_titulo,
    o.natureza AS obra_natureza,
    o.participa_cerebro
FROM processamento.fragmentos f
LEFT JOIN processamento.secoes s ON s.id = f.secao_id
JOIN processamento.documentos_processados dp ON dp.id = f.documento_processado_id
JOIN biblioteca.versoes_obras vo ON vo.id = dp.versao_obra_id
JOIN biblioteca.obras o ON o.id = vo.obra_id;

DROP VIEW IF EXISTS aplicacao.v_execucoes_processamento CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_execucoes_processamento AS
SELECT
    e.id,
    e.versao_obra_id,
    e.usuario_id,
    e.pipeline_versao,
    e.estado,
    e.correlacao_id,
    e.iniciado_em,
    e.concluido_em,
    e.erro_mensagem,
    e.total_tokens,
    e.custo_estimado_usd,
    COUNT(ee.id)::INT AS total_etapas,
    COUNT(ee.id) FILTER (WHERE ee.estado = 'concluido')::INT AS etapas_concluidas
FROM processamento.execucoes e
LEFT JOIN processamento.etapas_execucao ee ON ee.execucao_id = e.id
GROUP BY e.id;

-- 14. FUNÇÃO RPC DE BUSCA HÍBRIDA (FTS + VETORIAL COM PESOS E FILTRO DE AUTORIA)
CREATE OR REPLACE FUNCTION aplicacao.buscar_fragmentos_hibrido(
    p_usuario_id UUID,
    p_termo_busca TEXT,
    p_vetor extensions.vector(1536),
    p_limite INTEGER DEFAULT 10,
    p_peso_vetorial NUMERIC DEFAULT 0.65,
    p_peso_textual NUMERIC DEFAULT 0.35,
    p_apenas_autorais BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    fragmento_id UUID,
    obra_id UUID,
    obra_titulo TEXT,
    obra_natureza biblioteca.natureza_obra,
    secao_titulo TEXT,
    conteudo TEXT,
    score_similaridade NUMERIC,
    score_vetorial NUMERIC,
    score_textual NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH busca_vetorial AS (
        SELECT
            v.unidade_conhecimento_id AS id,
            (1 - (v.embedding <=> p_vetor))::NUMERIC AS sim_vetorial
        FROM processamento.vetores v
        WHERE v.usuario_id = p_usuario_id
        ORDER BY v.embedding <=> p_vetor
        LIMIT (p_limite * 3)
    ),
    busca_textual AS (
        SELECT
            f.id,
            ts_rank_cd(f.tsv_conteudo, plainto_tsquery('portuguese', p_termo_busca))::NUMERIC AS sim_textual
        FROM processamento.fragmentos f
        WHERE f.usuario_id = p_usuario_id
          AND (p_termo_busca IS NULL OR p_termo_busca = '' OR f.tsv_conteudo @@ plainto_tsquery('portuguese', p_termo_busca))
        ORDER BY sim_textual DESC
        LIMIT (p_limite * 3)
    )
    SELECT
        f.id AS fragmento_id,
        o.id AS obra_id,
        o.titulo AS obra_titulo,
        o.natureza AS obra_natureza,
        s.titulo AS secao_titulo,
        f.conteudo,
        ROUND(
            (COALESCE(bv.sim_vetorial, 0) * p_peso_vetorial + 
             COALESCE(bt.sim_textual, 0) * p_peso_textual)::NUMERIC, 4
        ) AS score_similaridade,
        ROUND(COALESCE(bv.sim_vetorial, 0)::NUMERIC, 4) AS score_vetorial,
        ROUND(COALESCE(bt.sim_textual, 0)::NUMERIC, 4) AS score_textual
    FROM processamento.fragmentos f
    LEFT JOIN busca_vetorial bv ON bv.id = f.id
    LEFT JOIN busca_textual bt ON bt.id = f.id
    LEFT JOIN processamento.secoes s ON s.id = f.secao_id
    JOIN processamento.documentos_processados dp ON dp.id = f.documento_processado_id
    JOIN biblioteca.versoes_obras vo ON vo.id = dp.versao_obra_id
    JOIN biblioteca.obras o ON o.id = vo.obra_id
    WHERE f.usuario_id = p_usuario_id
      AND dp.estado_publicacao = 'ativo'
      AND (NOT p_apenas_autorais OR o.natureza = 'autoral')
      AND (bv.sim_vetorial IS NOT NULL OR bt.sim_textual IS NOT NULL)
    ORDER BY score_similaridade DESC
    LIMIT p_limite;
END;
$$;

-- 15. PROJEÇÃO EM PUBLIC PARA POSTGREST & GRANTS
CREATE OR REPLACE VIEW public.v_documentos_processados AS SELECT * FROM aplicacao.v_documentos_processados;
CREATE OR REPLACE VIEW public.v_fragmentos_detalhados AS SELECT * FROM aplicacao.v_fragmentos_detalhados;
CREATE OR REPLACE VIEW public.v_execucoes_processamento AS SELECT * FROM aplicacao.v_execucoes_processamento;

CREATE OR REPLACE FUNCTION public.buscar_fragmentos_hibrido(
    p_usuario_id UUID,
    p_termo_busca TEXT,
    p_vetor extensions.vector(1536),
    p_limite INTEGER DEFAULT 10,
    p_peso_vetorial NUMERIC DEFAULT 0.65,
    p_peso_textual NUMERIC DEFAULT 0.35,
    p_apenas_autorais BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    fragmento_id UUID,
    obra_id UUID,
    obra_titulo TEXT,
    obra_natureza biblioteca.natureza_obra,
    secao_titulo TEXT,
    conteudo TEXT,
    score_similaridade NUMERIC,
    score_vetorial NUMERIC,
    score_textual NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM aplicacao.buscar_fragmentos_hibrido(
        p_usuario_id, p_termo_busca, p_vetor, p_limite, p_peso_vetorial, p_peso_textual, p_apenas_autorais
    );
END;
$$;

GRANT USAGE ON SCHEMA aplicacao, processamento, sistema, biblioteca, taxonomia, cerebro_autoral TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA processamento, sistema TO postgres, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA aplicacao, processamento TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA processamento, sistema TO postgres, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
