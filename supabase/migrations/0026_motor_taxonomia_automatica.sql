-- ==============================================================================
-- MIGRATION 0026: MOTOR TAXONOMICO AUTOMATICO E PROVENIENCIA DE REFLEXOES
-- Rflex01
-- ==============================================================================

-- 1. Estado explicito para propostas rejeitadas pelo autor.
ALTER TABLE taxonomia.conceitos
  DROP CONSTRAINT IF EXISTS conceitos_estado_check;

ALTER TABLE taxonomia.conceitos
  ADD CONSTRAINT conceitos_estado_check
  CHECK (estado IN ('ativo', 'obsoleto', 'revisao', 'rejeitado'));

-- 2. Vinculo entre conceitos e versoes finais de Reflexoes.
CREATE TABLE IF NOT EXISTS taxonomia.conceitos_reflexoes (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  conceito_id UUID NOT NULL REFERENCES taxonomia.conceitos(id) ON DELETE CASCADE,
  versao_reflexao_id UUID NOT NULL REFERENCES reflexoes.versoes_reflexao(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relevancia NUMERIC(3,2) NOT NULL DEFAULT 0.85
    CHECK (relevancia >= 0 AND relevancia <= 1),
  trecho_contextual TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_conceito_reflexao UNIQUE (conceito_id, versao_reflexao_id)
);

CREATE INDEX IF NOT EXISTS idx_conceitos_reflexoes_conceito
  ON taxonomia.conceitos_reflexoes(conceito_id);

CREATE INDEX IF NOT EXISTS idx_conceitos_reflexoes_versao
  ON taxonomia.conceitos_reflexoes(versao_reflexao_id);

CREATE INDEX IF NOT EXISTS idx_conceitos_reflexoes_usuario
  ON taxonomia.conceitos_reflexoes(usuario_id);

ALTER TABLE taxonomia.conceitos_reflexoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario gerencia conceitos das suas reflexoes"
  ON taxonomia.conceitos_reflexoes;

CREATE POLICY "Usuario gerencia conceitos das suas reflexoes"
  ON taxonomia.conceitos_reflexoes
  FOR ALL
  TO authenticated
  USING (
    (select auth.uid()) = usuario_id
    AND EXISTS (
      SELECT 1
      FROM taxonomia.conceitos c
      WHERE c.id = conceitos_reflexoes.conceito_id
        AND c.usuario_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM reflexoes.versoes_reflexao v
      WHERE v.id = conceitos_reflexoes.versao_reflexao_id
        AND v.usuario_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.uid()) = usuario_id
    AND EXISTS (
      SELECT 1
      FROM taxonomia.conceitos c
      WHERE c.id = conceitos_reflexoes.conceito_id
        AND c.usuario_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM reflexoes.versoes_reflexao v
      WHERE v.id = conceitos_reflexoes.versao_reflexao_id
        AND v.usuario_id = (select auth.uid())
    )
  );

-- 3. Registro auditavel e idempotente de analises taxonomicas.
CREATE TABLE IF NOT EXISTS taxonomia.analises (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_origem TEXT NOT NULL CHECK (tipo_origem IN ('documento', 'reflexao')),
  documento_processado_id UUID REFERENCES processamento.documentos_processados(id) ON DELETE CASCADE,
  versao_reflexao_id UUID REFERENCES reflexoes.versoes_reflexao(id) ON DELETE CASCADE,
  pipeline_versao TEXT NOT NULL DEFAULT 'taxonomia_v1',
  estado TEXT NOT NULL DEFAULT 'em_execucao'
    CHECK (estado IN ('em_execucao', 'concluida', 'falha')),
  total_conceitos_propostos INTEGER NOT NULL DEFAULT 0,
  total_conceitos_reutilizados INTEGER NOT NULL DEFAULT 0,
  resultado JSONB NOT NULL DEFAULT '{}'::jsonb,
  erro_mensagem TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  concluido_em TIMESTAMPTZ,
  CHECK (
    (tipo_origem = 'documento' AND documento_processado_id IS NOT NULL AND versao_reflexao_id IS NULL)
    OR
    (tipo_origem = 'reflexao' AND versao_reflexao_id IS NOT NULL AND documento_processado_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_taxonomia_analise_documento
  ON taxonomia.analises(usuario_id, documento_processado_id)
  WHERE documento_processado_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_taxonomia_analise_reflexao
  ON taxonomia.analises(usuario_id, versao_reflexao_id)
  WHERE versao_reflexao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_taxonomia_analises_usuario_estado
  ON taxonomia.analises(usuario_id, estado, criado_em DESC);

ALTER TABLE taxonomia.analises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario consulta suas analises taxonomicas"
  ON taxonomia.analises;

CREATE POLICY "Usuario consulta suas analises taxonomicas"
  ON taxonomia.analises
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = usuario_id);

-- Escrita das analises permanece exclusiva do backend service_role.

-- 4. View enriquecida: preservar colunas existentes e acrescentar ocorrencias em Reflexoes.
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
      DISTINCT jsonb_build_object(
        'id', t.id,
        'termo', t.termo,
        'tipo', t.tipo
      )
    ) FILTER (WHERE t.id IS NOT NULL),
    '[]'::jsonb
  ) AS termos_sinonimos,
  c.usuario_id,
  c.origem,
  c.confianca,
  COUNT(DISTINCT cr.versao_reflexao_id)::INT AS total_reflexoes
FROM taxonomia.conceitos c
LEFT JOIN taxonomia.termos t
  ON t.conceito_id = c.id
LEFT JOIN taxonomia.conceitos_fragmentos cf
  ON cf.conceito_id = c.id
 AND cf.usuario_id = c.usuario_id
LEFT JOIN taxonomia.conceitos_reflexoes cr
  ON cr.conceito_id = c.id
 AND cr.usuario_id = c.usuario_id
GROUP BY c.id;

ALTER VIEW aplicacao.v_taxonomia_conceitos
  SET (security_invoker = true);

CREATE OR REPLACE VIEW public.v_taxonomia_conceitos AS
SELECT * FROM aplicacao.v_taxonomia_conceitos;

ALTER VIEW public.v_taxonomia_conceitos
  SET (security_invoker = true);

REVOKE ALL ON public.v_taxonomia_conceitos FROM anon, authenticated;
GRANT SELECT ON public.v_taxonomia_conceitos TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON taxonomia.conceitos_reflexoes TO authenticated;
GRANT SELECT ON taxonomia.analises TO authenticated;
GRANT ALL ON taxonomia.conceitos_reflexoes TO service_role;
GRANT ALL ON taxonomia.analises TO service_role;

NOTIFY pgrst, 'reload schema';
