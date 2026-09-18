-- ==============================================================================
-- MIGRATION 0025: ISOLAMENTO PESSOAL E RLS DA TAXONOMIA
-- Rflex01
-- Objetivo:
-- 1. tornar conceitos explicitamente pertencentes ao usuario;
-- 2. impedir mistura entre taxonomias pessoais;
-- 3. habilitar RLS nas tabelas fundacionais sem bloquear o backend service_role;
-- 4. reforcar o vinculo conceito <-> fragmento com ownership coerente.
-- ==============================================================================

-- 1. Ownership e proveniencia dos conceitos.
ALTER TABLE taxonomia.conceitos
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE taxonomia.conceitos
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'curadoria'
  CHECK (origem IN ('curadoria', 'ia', 'importacao'));

ALTER TABLE taxonomia.conceitos
  ADD COLUMN IF NOT EXISTS confianca NUMERIC(3,2) NOT NULL DEFAULT 1.00
  CHECK (confianca >= 0 AND confianca <= 1);

-- Nao assumir ownership de linhas preexistentes. O projeto canonico esta vazio
-- nesta tabela no momento desta migracao; se isso mudar, a migracao deve parar
-- para que o ownership seja resolvido explicitamente.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM taxonomia.conceitos
    WHERE usuario_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Existem conceitos sem usuario_id. Resolva o ownership antes de aplicar 0025.';
  END IF;
END $$;

ALTER TABLE taxonomia.conceitos
  ALTER COLUMN usuario_id SET NOT NULL;

-- O codigo deixa de ser global e passa a ser unico dentro da taxonomia do usuario.
ALTER TABLE taxonomia.conceitos
  DROP CONSTRAINT IF EXISTS conceitos_codigo_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_taxonomia_conceitos_usuario_codigo
  ON taxonomia.conceitos(usuario_id, codigo);

CREATE INDEX IF NOT EXISTS idx_taxonomia_conceitos_usuario_estado
  ON taxonomia.conceitos(usuario_id, estado);

CREATE INDEX IF NOT EXISTS idx_taxonomia_conceitos_usuario_dominio
  ON taxonomia.conceitos(usuario_id, dominio);

-- 2. RLS nas tabelas fundacionais.
ALTER TABLE taxonomia.versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomia.conceitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomia.termos ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomia.relacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura autenticada das versoes da taxonomia"
  ON taxonomia.versoes;
CREATE POLICY "Leitura autenticada das versoes da taxonomia"
  ON taxonomia.versoes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuario gerencia seus conceitos"
  ON taxonomia.conceitos;
CREATE POLICY "Usuario gerencia seus conceitos"
  ON taxonomia.conceitos
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = usuario_id)
  WITH CHECK ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "Usuario gerencia termos dos seus conceitos"
  ON taxonomia.termos;
CREATE POLICY "Usuario gerencia termos dos seus conceitos"
  ON taxonomia.termos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM taxonomia.conceitos c
      WHERE c.id = termos.conceito_id
        AND c.usuario_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM taxonomia.conceitos c
      WHERE c.id = termos.conceito_id
        AND c.usuario_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuario gerencia relacoes dos seus conceitos"
  ON taxonomia.relacoes;
CREATE POLICY "Usuario gerencia relacoes dos seus conceitos"
  ON taxonomia.relacoes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM taxonomia.conceitos origem
      JOIN taxonomia.conceitos destino
        ON destino.id = relacoes.conceito_destino_id
      WHERE origem.id = relacoes.conceito_origem_id
        AND origem.usuario_id = (select auth.uid())
        AND destino.usuario_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM taxonomia.conceitos origem
      JOIN taxonomia.conceitos destino
        ON destino.id = relacoes.conceito_destino_id
      WHERE origem.id = relacoes.conceito_origem_id
        AND origem.usuario_id = (select auth.uid())
        AND destino.usuario_id = (select auth.uid())
    )
  );

-- 3. Reforcar a policy do vinculo conceito-fragmento.
DROP POLICY IF EXISTS "Usuário gerencia conceitos de fragmentos"
  ON taxonomia.conceitos_fragmentos;

CREATE POLICY "Usuário gerencia conceitos de fragmentos"
  ON taxonomia.conceitos_fragmentos
  FOR ALL
  TO authenticated
  USING (
    (select auth.uid()) = usuario_id
    AND EXISTS (
      SELECT 1
      FROM taxonomia.conceitos c
      WHERE c.id = conceitos_fragmentos.conceito_id
        AND c.usuario_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM processamento.fragmentos f
      WHERE f.id = conceitos_fragmentos.fragmento_id
        AND f.usuario_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.uid()) = usuario_id
    AND EXISTS (
      SELECT 1
      FROM taxonomia.conceitos c
      WHERE c.id = conceitos_fragmentos.conceito_id
        AND c.usuario_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM processamento.fragmentos f
      WHERE f.id = conceitos_fragmentos.fragmento_id
        AND f.usuario_id = (select auth.uid())
    )
  );

-- 4. Views da Taxonomia com ownership explicito.
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
  c.confianca
FROM taxonomia.conceitos c
LEFT JOIN taxonomia.termos t
  ON t.conceito_id = c.id
LEFT JOIN taxonomia.conceitos_fragmentos cf
  ON cf.conceito_id = c.id
 AND cf.usuario_id = c.usuario_id
GROUP BY c.id;

ALTER VIEW aplicacao.v_taxonomia_conceitos
  SET (security_invoker = true);

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
  cd.dominio AS destino_dominio,
  co.usuario_id
FROM taxonomia.relacoes r
JOIN taxonomia.conceitos co
  ON co.id = r.conceito_origem_id
JOIN taxonomia.conceitos cd
  ON cd.id = r.conceito_destino_id
 AND cd.usuario_id = co.usuario_id;

ALTER VIEW aplicacao.v_taxonomia_grafo
  SET (security_invoker = true);

CREATE OR REPLACE VIEW public.v_taxonomia_conceitos AS
SELECT * FROM aplicacao.v_taxonomia_conceitos;

CREATE OR REPLACE VIEW public.v_taxonomia_grafo AS
SELECT * FROM aplicacao.v_taxonomia_grafo;

ALTER VIEW public.v_taxonomia_conceitos
  SET (security_invoker = true);

ALTER VIEW public.v_taxonomia_grafo
  SET (security_invoker = true);

REVOKE ALL ON
  public.v_taxonomia_conceitos,
  public.v_taxonomia_grafo
FROM anon, authenticated;

GRANT SELECT ON
  public.v_taxonomia_conceitos,
  public.v_taxonomia_grafo
TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
