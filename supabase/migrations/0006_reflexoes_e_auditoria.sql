-- ============================================================================
-- MIGRATION 0006: MOTOR DE REFLEXÕES E AUDITOR CRÍTICO INDEPENDENTE
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- 1. ENTRADAS DE REFLEXÃO (Provocações e Temas do Autor)
CREATE TABLE IF NOT EXISTS reflexoes.entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    tema_central TEXT NOT NULL,
    provocacao_inicial TEXT NOT NULL,
    objetivo_comunicativo TEXT,
    publico_alvo TEXT,
    formato_desejado TEXT NOT NULL DEFAULT 'ensaio'
        CHECK (formato_desejado IN ('ensaio', 'artigo', 'aforismo', 'newsletter', 'dialogo', 'tese')),
    restricoes_especificas TEXT,
    estado TEXT NOT NULL DEFAULT 'criada'
        CHECK (estado IN ('criada', 'planejada', 'em_redacao', 'em_auditoria', 'concluida', 'arquivada')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reflexoes_entradas_usuario ON reflexoes.entradas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reflexoes_entradas_estado ON reflexoes.entradas(estado);

COMMENT ON TABLE reflexoes.entradas IS 'Registros de provocações e intenções comunicativas do autor';

-- Trigger de atualização temporal
DROP TRIGGER IF EXISTS trg_atualizar_entradas ON reflexoes.entradas;
CREATE TRIGGER trg_atualizar_entradas
    BEFORE UPDATE ON reflexoes.entradas
    FOR EACH ROW
    EXECUTE FUNCTION sistema.atualizar_coluna_atualizado_em();

-- 2. PLANOS DE REFLEXÃO (Estrutura Cognitiva Prévia)
CREATE TABLE IF NOT EXISTS reflexoes.planos_reflexao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrada_id UUID NOT NULL REFERENCES reflexoes.entradas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tese_central TEXT NOT NULL,
    movimentos_argumentativos JSONB NOT NULL DEFAULT '[]'::jsonb,
    conceitos_mobilizados JSONB NOT NULL DEFAULT '[]'::jsonb,
    fontes_mobilizadas JSONB NOT NULL DEFAULT '[]'::jsonb,
    regras_acionadas JSONB NOT NULL DEFAULT '[]'::jsonb,
    contra_argumentos_antecipados JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado TEXT NOT NULL DEFAULT 'proposto'
        CHECK (estado IN ('proposto', 'aprovado_pelo_autor', 'rejeitado')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planos_reflexao_entrada ON reflexoes.planos_reflexao(entrada_id);
CREATE INDEX IF NOT EXISTS idx_planos_reflexao_usuario ON reflexoes.planos_reflexao(usuario_id);

COMMENT ON TABLE reflexoes.planos_reflexao IS 'Arquitetura de raciocínio prévia gerada pelo Cérebro antes da redação';

-- 3. VERSÕES GERADAS DA REFLEXÃO
CREATE TABLE IF NOT EXISTS reflexoes.versoes_reflexao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrada_id UUID NOT NULL REFERENCES reflexoes.entradas(id) ON DELETE CASCADE,
    plano_id UUID REFERENCES reflexoes.planos_reflexao(id) ON DELETE SET NULL,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_versao INT NOT NULL DEFAULT 1,
    titulo_gerado TEXT NOT NULL,
    conteudo_markdown TEXT NOT NULL,
    sumario_executivo TEXT,
    total_palavras INT NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'rascunho'
        CHECK (estado IN ('rascunho', 'em_auditoria', 'auditado', 'aprovado', 'publicado')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_versoes_reflexao_entrada ON reflexoes.versoes_reflexao(entrada_id);
CREATE INDEX IF NOT EXISTS idx_versoes_reflexao_usuario ON reflexoes.versoes_reflexao(usuario_id);

COMMENT ON TABLE reflexoes.versoes_reflexao IS 'Rascunhos e versões textuais completas da reflexão com histórico';

-- Trigger de atualização temporal de versões
DROP TRIGGER IF EXISTS trg_atualizar_versoes_reflexao ON reflexoes.versoes_reflexao;
CREATE TRIGGER trg_atualizar_versoes_reflexao
    BEFORE UPDATE ON reflexoes.versoes_reflexao
    FOR EACH ROW
    EXECUTE FUNCTION sistema.atualizar_coluna_atualizado_em();

-- 4. CITAÇÕES E EVIDÊNCIAS DE VERIFICABILIDADE (Proveniência estrita)
CREATE TABLE IF NOT EXISTS reflexoes.citacoes_evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    versao_reflexao_id UUID NOT NULL REFERENCES reflexoes.versoes_reflexao(id) ON DELETE CASCADE,
    fragmento_id UUID REFERENCES processamento.fragmentos(id) ON DELETE SET NULL,
    tipo_fonte TEXT NOT NULL CHECK (tipo_fonte IN ('nucleo_autoral', 'influencia_externa')),
    trecho_afirmacao_gerada TEXT NOT NULL,
    trecho_original_citado TEXT NOT NULL,
    obra_titulo TEXT,
    grau_aderencia NUMERIC(4,3) CHECK (grau_aderencia BETWEEN 0 AND 1),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citacoes_evidencias_versao ON reflexoes.citacoes_evidencias(versao_reflexao_id);

COMMENT ON TABLE reflexoes.citacoes_evidencias IS 'Rastreabilidade direta entre afirmações geradas e fragmentos autorais originais';

-- 5. REVISÕES E FEEDBACK DO AUTOR
CREATE TABLE IF NOT EXISTS reflexoes.revisoes_autor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    versao_reflexao_id UUID NOT NULL REFERENCES reflexoes.versoes_reflexao(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comentario_geral TEXT,
    ajustes_solicitados JSONB NOT NULL DEFAULT '[]'::jsonb,
    aprovado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revisoes_autor_versao ON reflexoes.revisoes_autor(versao_reflexao_id);

-- 6. RELATÓRIOS DO AUDITOR CRÍTICO INDEPENDENTE
CREATE TABLE IF NOT EXISTS auditoria.relatorios_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    versao_reflexao_id UUID NOT NULL REFERENCES reflexoes.versoes_reflexao(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    veredito TEXT NOT NULL CHECK (veredito IN ('aprovado', 'ressalvas', 'rejeitado')),
    pontuacao_geral NUMERIC(4,3) NOT NULL CHECK (pontuacao_geral BETWEEN 0 AND 1),
    pontuacao_fidelidade_ontologica NUMERIC(4,3) CHECK (pontuacao_fidelidade_ontologica BETWEEN 0 AND 1),
    pontuacao_fidelidade_metodologica NUMERIC(4,3) CHECK (pontuacao_fidelidade_metodologica BETWEEN 0 AND 1),
    pontuacao_precisao_evidencias NUMERIC(4,3) CHECK (pontuacao_precisao_evidencias BETWEEN 0 AND 1),
    pontuacao_expressao_estilo NUMERIC(4,3) CHECK (pontuacao_expressao_estilo BETWEEN 0 AND 1),
    pontuacao_anti_regras NUMERIC(4,3) CHECK (pontuacao_anti_regras BETWEEN 0 AND 1),
    regras_violadas JSONB NOT NULL DEFAULT '[]'::jsonb,
    riscos_alucinacao JSONB NOT NULL DEFAULT '[]'::jsonb,
    recomendacoes_melhoria JSONB NOT NULL DEFAULT '[]'::jsonb,
    analise_critica_completa TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_relatorios_auditoria_versao ON auditoria.relatorios_auditoria(versao_reflexao_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_auditoria_veredito ON auditoria.relatorios_auditoria(veredito);

COMMENT ON TABLE auditoria.relatorios_auditoria IS 'Avaliação rigorosa de fidelidade metodológica e ausência de alucinações';

-- 7. SEGURANÇA RLS
ALTER TABLE reflexoes.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflexoes.planos_reflexao ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflexoes.versoes_reflexao ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflexoes.citacoes_evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflexoes.revisoes_autor ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria.relatorios_auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para entradas
DROP POLICY IF EXISTS p_entradas_service ON reflexoes.entradas;
CREATE POLICY p_entradas_service ON reflexoes.entradas FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_entradas_usuario ON reflexoes.entradas;
CREATE POLICY p_entradas_usuario ON reflexoes.entradas FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

-- Políticas de RLS para planos
DROP POLICY IF EXISTS p_planos_service ON reflexoes.planos_reflexao;
CREATE POLICY p_planos_service ON reflexoes.planos_reflexao FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_planos_usuario ON reflexoes.planos_reflexao;
CREATE POLICY p_planos_usuario ON reflexoes.planos_reflexao FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

-- Políticas de RLS para versões
DROP POLICY IF EXISTS p_versoes_service ON reflexoes.versoes_reflexao;
CREATE POLICY p_versoes_service ON reflexoes.versoes_reflexao FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_versoes_usuario ON reflexoes.versoes_reflexao;
CREATE POLICY p_versoes_usuario ON reflexoes.versoes_reflexao FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

-- Políticas de RLS para citações
DROP POLICY IF EXISTS p_citacoes_service ON reflexoes.citacoes_evidencias;
CREATE POLICY p_citacoes_service ON reflexoes.citacoes_evidencias FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_citacoes_usuario ON reflexoes.citacoes_evidencias;
CREATE POLICY p_citacoes_usuario ON reflexoes.citacoes_evidencias FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM reflexoes.versoes_reflexao v
        WHERE v.id = versao_reflexao_id AND v.usuario_id = auth.uid()
    )
);

-- Políticas de RLS para revisões do autor
DROP POLICY IF EXISTS p_revisoes_service ON reflexoes.revisoes_autor;
CREATE POLICY p_revisoes_service ON reflexoes.revisoes_autor FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_revisoes_usuario ON reflexoes.revisoes_autor;
CREATE POLICY p_revisoes_usuario ON reflexoes.revisoes_autor FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

-- Políticas de RLS para auditoria
DROP POLICY IF EXISTS p_auditoria_service ON auditoria.relatorios_auditoria;
CREATE POLICY p_auditoria_service ON auditoria.relatorios_auditoria FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS p_auditoria_usuario ON auditoria.relatorios_auditoria;
CREATE POLICY p_auditoria_usuario ON auditoria.relatorios_auditoria FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

-- 8. VIEWS DE CONVENIÊNCIA EM PUBLIC
CREATE OR REPLACE VIEW public.v_reflexoes_resumo AS
SELECT 
    e.id AS entrada_id,
    e.usuario_id,
    e.titulo,
    e.tema_central,
    e.formato_desejado,
    e.estado AS estado_entrada,
    e.criado_em,
    e.atualizado_em,
    COUNT(DISTINCT v.id) AS total_versoes,
    MAX(v.numero_versao) AS ultima_versao_numero,
    (
        SELECT v2.id 
        FROM reflexoes.versoes_reflexao v2 
        WHERE v2.entrada_id = e.id 
        ORDER BY v2.numero_versao DESC 
        LIMIT 1
    ) AS ultima_versao_id,
    (
        SELECT v2.titulo_gerado 
        FROM reflexoes.versoes_reflexao v2 
        WHERE v2.entrada_id = e.id 
        ORDER BY v2.numero_versao DESC 
        LIMIT 1
    ) AS ultimo_titulo_gerado,
    (
        SELECT v2.estado 
        FROM reflexoes.versoes_reflexao v2 
        WHERE v2.entrada_id = e.id 
        ORDER BY v2.numero_versao DESC 
        LIMIT 1
    ) AS ultimo_estado_versao,
    (
        SELECT ra.veredito 
        FROM reflexoes.versoes_reflexao v2
        JOIN auditoria.relatorios_auditoria ra ON ra.versao_reflexao_id = v2.id
        WHERE v2.entrada_id = e.id
        ORDER BY ra.criado_em DESC
        LIMIT 1
    ) AS ultimo_veredito_auditoria,
    (
        SELECT ra.pontuacao_geral 
        FROM reflexoes.versoes_reflexao v2
        JOIN auditoria.relatorios_auditoria ra ON ra.versao_reflexao_id = v2.id
        WHERE v2.entrada_id = e.id
        ORDER BY ra.criado_em DESC
        LIMIT 1
    ) AS ultima_pontuacao_auditoria
FROM reflexoes.entradas e
LEFT JOIN reflexoes.versoes_reflexao v ON v.entrada_id = e.id
GROUP BY e.id, e.usuario_id, e.titulo, e.tema_central, e.formato_desejado, e.estado, e.criado_em, e.atualizado_em;

CREATE OR REPLACE VIEW public.v_auditoria_detalhada AS
SELECT
    ra.id AS relatorio_id,
    ra.versao_reflexao_id,
    ra.usuario_id,
    ra.veredito,
    ra.pontuacao_geral,
    ra.pontuacao_fidelidade_ontologica,
    ra.pontuacao_fidelidade_metodologica,
    ra.pontuacao_precisao_evidencias,
    ra.pontuacao_expressao_estilo,
    ra.pontuacao_anti_regras,
    ra.regras_violadas,
    ra.riscos_alucinacao,
    ra.recomendacoes_melhoria,
    ra.analise_critica_completa,
    ra.criado_em,
    vr.numero_versao,
    vr.titulo_gerado,
    vr.entrada_id,
    e.titulo AS entrada_titulo
FROM auditoria.relatorios_auditoria ra
JOIN reflexoes.versoes_reflexao vr ON vr.id = ra.versao_reflexao_id
JOIN reflexoes.entradas e ON e.id = vr.entrada_id;

-- 9. PERMISSÕES DE ACESSO
GRANT USAGE ON SCHEMA reflexoes TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auditoria TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA reflexoes TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auditoria TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA reflexoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auditoria TO authenticated;

GRANT SELECT ON public.v_reflexoes_resumo TO anon, authenticated, service_role;
GRANT SELECT ON public.v_auditoria_detalhada TO anon, authenticated, service_role;
