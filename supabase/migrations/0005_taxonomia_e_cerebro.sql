-- ============================================================================
-- MIGRATION 0005: TAXONOMIA SEMÂNTICA INTELIGENTE & CÉREBRO AUTORAL (18 DIMENSÕES)
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- 1. EXTENSÃO DO SCHEMA TAXONOMIA: ASSOCIAÇÃO COM FRAGMENTOS
CREATE TABLE IF NOT EXISTS taxonomia.conceitos_fragmentos (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    conceito_id UUID NOT NULL REFERENCES taxonomia.conceitos(id) ON DELETE CASCADE,
    fragmento_id UUID NOT NULL REFERENCES processamento.fragmentos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relevancia NUMERIC(3,2) NOT NULL DEFAULT 0.85 CHECK (relevancia >= 0 AND relevancia <= 1),
    trecho_contextual TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_conceito_fragmento UNIQUE (conceito_id, fragmento_id)
);
COMMENT ON TABLE taxonomia.conceitos_fragmentos IS 'Ocorrências e vínculos semânticos entre conceitos ontológicos e fragmentos textuais';

-- 2. ENRIQUECIMENTO DAS 18 DIMENSÕES DO CÉREBRO COM OS 3 PLANOS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'cerebro_autoral' 
          AND table_name = 'dimensoes' 
          AND column_name = 'plano'
    ) THEN
        ALTER TABLE cerebro_autoral.dimensoes 
        ADD COLUMN plano TEXT NOT NULL DEFAULT 'metodo' 
        CHECK (plano IN ('conteudo', 'metodo', 'expressao'));
    END IF;
END $$;

COMMENT ON COLUMN cerebro_autoral.dimensoes.plano IS 'Divisão canônica em 3 Planos: Conteúdo (o que pensa), Método (como raciocina), Expressão (como escreve)';

-- Atualiza o plano de cada uma das 18 dimensões canônicas
UPDATE cerebro_autoral.dimensoes SET plano = 'conteudo' WHERE codigo IN ('universo_conceitual');

UPDATE cerebro_autoral.dimensoes SET plano = 'metodo' WHERE codigo IN (
    'metodologia_de_pensamento',
    'metodologia_de_interpretacao',
    'metodologia_de_associacao',
    'metodologia_argumentativa',
    'relacao_experiencia_conceito',
    'padroes_de_tensao',
    'padroes_de_sintese'
);

UPDATE cerebro_autoral.dimensoes SET plano = 'expressao' WHERE codigo IN (
    'metodologia_de_escrita',
    'metodologia_de_revisao',
    'arquitetura_narrativa',
    'arquitetura_de_paragrafo',
    'formas_de_abertura',
    'formas_de_transicao',
    'formas_de_conclusao',
    'recursos_retoricos',
    'identidade_linguistica',
    'evolucao_autoral'
);

-- 3. TABELA: cerebro_autoral.caracteristicas
CREATE TABLE IF NOT EXISTS cerebro_autoral.caracteristicas (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    dimensao_id UUID NOT NULL REFERENCES cerebro_autoral.dimensoes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    formula_metodologica TEXT,
    origem TEXT NOT NULL DEFAULT 'nucleo_autoral' CHECK (origem IN ('nucleo_autoral', 'influencia_externa', 'hibrido')),
    confianca_calculada NUMERIC(3,2) NOT NULL DEFAULT 0.85 CHECK (confianca_calculada >= 0 AND confianca_calculada <= 1),
    total_evidencias INTEGER NOT NULL DEFAULT 0,
    total_contraevidencias INTEGER NOT NULL DEFAULT 0,
    total_obras_distintas INTEGER NOT NULL DEFAULT 0,
    periodo_inicio INTEGER,
    periodo_fim INTEGER,
    estado_revisao sistema.estado_revisao NOT NULL DEFAULT 'confirmada',
    metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cerebro_autoral.caracteristicas IS 'Características e padrões metodológicos observados no corpus autoral com comprovação por evidências';

DROP TRIGGER IF EXISTS trg_cerebro_caracteristicas_atualizado_em ON cerebro_autoral.caracteristicas;
CREATE TRIGGER trg_cerebro_caracteristicas_atualizado_em
    BEFORE UPDATE ON cerebro_autoral.caracteristicas
    FOR EACH ROW
    EXECUTE FUNCTION sistema.atualizar_coluna_atualizado_em();

-- 4. TABELA: cerebro_autoral.regras (PRESCRIÇÕES E ANTI-REGRAS)
CREATE TABLE IF NOT EXISTS cerebro_autoral.regras (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dimensao_id UUID REFERENCES cerebro_autoral.dimensoes(id) ON DELETE CASCADE,
    caracteristica_id UUID REFERENCES cerebro_autoral.caracteristicas(id) ON DELETE CASCADE,
    tipo_regra TEXT NOT NULL CHECK (tipo_regra IN ('prescritiva', 'proscritiva', 'preferencia', 'restricao_estilo')),
    enunciado TEXT NOT NULL,
    explicacao TEXT,
    peso NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (peso >= 0 AND peso <= 1),
    ativa BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cerebro_autoral.regras IS 'Regras prescritivas (o que fazer) e proscritivas / anti-regras (o que nunca fazer) do método autoral';

-- 5. TABELA: cerebro_autoral.versoes_cerebro
CREATE TABLE IF NOT EXISTS cerebro_autoral.versoes_cerebro (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_versao TEXT NOT NULL,
    descricao TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ativa' CHECK (estado IN ('candidata', 'ativa', 'arquivada')),
    total_caracteristicas INTEGER NOT NULL DEFAULT 0,
    total_regras INTEGER NOT NULL DEFAULT 0,
    total_evidencias INTEGER NOT NULL DEFAULT 0,
    ativado_em TIMESTAMPTZ DEFAULT NOW(),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cerebro_autoral.versoes_cerebro IS 'Histórico versionado do Cérebro Autoral ativo';

-- 6. ÍNDICES DE BUSCA E INTEGRIDADE
CREATE INDEX IF NOT EXISTS idx_conceitos_frag_conc ON taxonomia.conceitos_fragmentos(conceito_id);
CREATE INDEX IF NOT EXISTS idx_conceitos_frag_frag ON taxonomia.conceitos_fragmentos(fragmento_id);

CREATE INDEX IF NOT EXISTS idx_caracteristicas_dim ON cerebro_autoral.caracteristicas(dimensao_id);
CREATE INDEX IF NOT EXISTS idx_caracteristicas_usuario ON cerebro_autoral.caracteristicas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_caracteristicas_origem ON cerebro_autoral.caracteristicas(origem);

CREATE INDEX IF NOT EXISTS idx_regras_dim ON cerebro_autoral.regras(dimensao_id);
CREATE INDEX IF NOT EXISTS idx_regras_caract ON cerebro_autoral.regras(caracteristica_id);
CREATE INDEX IF NOT EXISTS idx_regras_usuario_ativa ON cerebro_autoral.regras(usuario_id, ativa);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE taxonomia.conceitos_fragmentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cerebro_autoral.caracteristicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cerebro_autoral.regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE cerebro_autoral.versoes_cerebro ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Usuário gerencia conceitos de fragmentos" ON taxonomia.conceitos_fragmentos;
    CREATE POLICY "Usuário gerencia conceitos de fragmentos" ON taxonomia.conceitos_fragmentos FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

    DROP POLICY IF EXISTS "Usuário gerencia características do cérebro" ON cerebro_autoral.caracteristicas;
    CREATE POLICY "Usuário gerencia características do cérebro" ON cerebro_autoral.caracteristicas FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

    DROP POLICY IF EXISTS "Usuário gerencia regras do cérebro" ON cerebro_autoral.regras;
    CREATE POLICY "Usuário gerencia regras do cérebro" ON cerebro_autoral.regras FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

    DROP POLICY IF EXISTS "Usuário gerencia versões do cérebro" ON cerebro_autoral.versoes_cerebro;
    CREATE POLICY "Usuário gerencia versões do cérebro" ON cerebro_autoral.versoes_cerebro FOR ALL TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
END $$;

-- 8. VIEWS NO SCHEMA aplicacao
DROP VIEW IF EXISTS aplicacao.v_taxonomia_conceitos CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_taxonomia_conceitos AS
SELECT
    c.id,
    c.codigo,
    c.termo_preferencial,
    c.definicao,
    c.dominio,
    c.estado,
    c.criado_em,
    COUNT(DISTINCT cf.fragmento_id)::INT AS total_fragmentos,
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object('id', t.id, 'termo', t.termo, 'tipo', t.tipo)
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::jsonb
    ) AS termos_sinonimos
FROM taxonomia.conceitos c
LEFT JOIN taxonomia.termos t ON t.conceito_id = c.id
LEFT JOIN taxonomia.conceitos_fragmentos cf ON cf.conceito_id = c.id
GROUP BY c.id;

COMMENT ON VIEW aplicacao.v_taxonomia_conceitos IS 'Conceitos ontológicos com termos sinônimos agregados e ocorrências';

DROP VIEW IF EXISTS aplicacao.v_taxonomia_grafo CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_taxonomia_grafo AS
SELECT
    r.id AS relacao_id,
    r.tipo_relacao,
    r.confianca,
    co.id AS origem_id,
    co.termo_preferencial AS origem_termo,
    co.dominio AS origem_dominio,
    cd.id AS destino_id,
    cd.termo_preferencial AS destino_termo,
    cd.dominio AS destino_dominio
FROM taxonomia.relacoes r
JOIN taxonomia.conceitos co ON co.id = r.conceito_origem_id
JOIN taxonomia.conceitos cd ON cd.id = r.conceito_destino_id;

COMMENT ON VIEW aplicacao.v_taxonomia_grafo IS 'Arestas e nós para renderização do Grafo de Conhecimento Ontológico';

DROP VIEW IF EXISTS aplicacao.v_cerebro_dimensoes CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_cerebro_dimensoes AS
SELECT
    d.id,
    d.codigo,
    d.nome,
    d.descricao,
    d.ordem,
    d.plano,
    d.ativa,
    COUNT(DISTINCT c.id)::INT AS total_caracteristicas,
    COUNT(DISTINCT r.id)::INT AS total_regras,
    COALESCE(AVG(c.confianca_calculada), 0)::NUMERIC(3,2) AS confianca_media
FROM cerebro_autoral.dimensoes d
LEFT JOIN cerebro_autoral.caracteristicas c ON c.dimensao_id = d.id AND c.estado_revisao = 'confirmada'
LEFT JOIN cerebro_autoral.regras r ON r.dimensao_id = d.id AND r.ativa = true
GROUP BY d.id
ORDER BY d.ordem ASC;

COMMENT ON VIEW aplicacao.v_cerebro_dimensoes IS 'As 18 dimensões canônicas com agregação dos 3 Planos, características e regras';

DROP VIEW IF EXISTS aplicacao.v_cerebro_caracteristicas_detalhadas CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_cerebro_caracteristicas_detalhadas AS
SELECT
    c.id,
    c.dimensao_id,
    c.usuario_id,
    c.titulo,
    c.descricao,
    c.formula_metodologica,
    c.origem,
    c.confianca_calculada,
    c.total_evidencias,
    c.total_contraevidencias,
    c.total_obras_distintas,
    c.periodo_inicio,
    c.periodo_fim,
    c.estado_revisao,
    c.criado_em,
    c.atualizado_em,
    d.codigo AS dimensao_codigo,
    d.nome AS dimensao_nome,
    d.plano AS dimensao_plano,
    COUNT(DISTINCT r.id)::INT AS total_regras_associadas
FROM cerebro_autoral.caracteristicas c
JOIN cerebro_autoral.dimensoes d ON d.id = c.dimensao_id
LEFT JOIN cerebro_autoral.regras r ON r.caracteristica_id = c.id
GROUP BY c.id, d.codigo, d.nome, d.plano;

COMMENT ON VIEW aplicacao.v_cerebro_caracteristicas_detalhadas IS 'Visão enriquecida de características com dimensões e regras associadas';

DROP VIEW IF EXISTS aplicacao.v_cerebro_regras_ativas CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_cerebro_regras_ativas AS
SELECT
    r.id,
    r.usuario_id,
    r.dimensao_id,
    r.caracteristica_id,
    r.tipo_regra,
    r.enunciado,
    r.explicacao,
    r.peso,
    r.ativa,
    r.criado_em,
    d.codigo AS dimensao_codigo,
    d.nome AS dimensao_nome,
    d.plano AS dimensao_plano,
    c.titulo AS caracteristica_titulo
FROM cerebro_autoral.regras r
LEFT JOIN cerebro_autoral.dimensoes d ON d.id = r.dimensao_id
LEFT JOIN cerebro_autoral.caracteristicas c ON c.id = r.caracteristica_id
WHERE r.ativa = true;

COMMENT ON VIEW aplicacao.v_cerebro_regras_ativas IS 'Catálogo de regras prescritivas e anti-regras para auditoria e geração reflexiva';

DROP VIEW IF EXISTS aplicacao.v_cerebro_resumo CASCADE;
CREATE OR REPLACE VIEW aplicacao.v_cerebro_resumo AS
SELECT
    d.usuario_id,
    COUNT(DISTINCT c.id)::INT AS total_caracteristicas,
    COUNT(DISTINCT r.id)::INT AS total_regras,
    COUNT(DISTINCT r.id) FILTER (WHERE r.tipo_regra = 'proscritiva')::INT AS total_anti_regras,
    COUNT(DISTINCT c.id) FILTER (WHERE c.origem = 'nucleo_autoral')::INT AS total_nucleo_autoral,
    COUNT(DISTINCT c.id) FILTER (WHERE c.origem = 'influencia_externa')::INT AS total_influencias_externas,
    COALESCE(AVG(c.confianca_calculada), 0.90)::NUMERIC(3,2) AS confianca_media_geral
FROM cerebro_autoral.caracteristicas c
JOIN cerebro_autoral.dimensoes d_dim ON d_dim.id = c.dimensao_id
LEFT JOIN cerebro_autoral.regras r ON r.usuario_id = c.usuario_id AND r.ativa = true
CROSS JOIN (SELECT auth.uid() AS usuario_id) d
GROUP BY d.usuario_id;

-- 9. SEEDS FUNDACIONAIS DO CÉREBRO (CARACTERÍSTICAS E REGRAS METODOLÓGICAS EXEMPLARES)
-- Criamos versão inicial 1.0.0 do Cérebro
INSERT INTO cerebro_autoral.versoes_cerebro (usuario_id, numero_versao, descricao, estado)
SELECT 
    id AS usuario_id,
    '1.0.0',
    'Cérebro Autoral Canônico Inicial v1.0.0',
    'ativa'
FROM auth.users
ON CONFLICT DO NOTHING;

-- 10. PROJEÇÃO EM PUBLIC PARA POSTGREST & GRANTS
CREATE OR REPLACE VIEW public.v_taxonomia_conceitos AS SELECT * FROM aplicacao.v_taxonomia_conceitos;
CREATE OR REPLACE VIEW public.v_taxonomia_grafo AS SELECT * FROM aplicacao.v_taxonomia_grafo;
CREATE OR REPLACE VIEW public.v_cerebro_dimensoes AS SELECT * FROM aplicacao.v_cerebro_dimensoes;
CREATE OR REPLACE VIEW public.v_cerebro_caracteristicas_detalhadas AS SELECT * FROM aplicacao.v_cerebro_caracteristicas_detalhadas;
CREATE OR REPLACE VIEW public.v_cerebro_regras_ativas AS SELECT * FROM aplicacao.v_cerebro_regras_ativas;
CREATE OR REPLACE VIEW public.v_cerebro_resumo AS SELECT * FROM aplicacao.v_cerebro_resumo;

GRANT USAGE ON SCHEMA taxonomia, cerebro_autoral, aplicacao TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA taxonomia, cerebro_autoral TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA taxonomia, cerebro_autoral TO postgres, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA taxonomia, cerebro_autoral, aplicacao TO postgres, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
