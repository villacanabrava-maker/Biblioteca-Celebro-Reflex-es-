-- ==============================================================================
-- MIGRATION 0028: DIMENSOES CANONICAS SOMENTE LEITURA
-- Rflex01
--
-- Objetivo:
-- 1. proteger o catalogo global das 18 dimensoes canonicas;
-- 2. permitir leitura apenas a usuarios autenticados;
-- 3. impedir INSERT/UPDATE/DELETE por clientes autenticados;
-- 4. preservar escrita administrativa via service_role/migrations.
--
-- As views do Cerebro ja usam security_invoker=true e, portanto, respeitam
-- as politicas da tabela subjacente para anon/authenticated.
-- ==============================================================================

ALTER TABLE cerebro_autoral.dimensoes ENABLE ROW LEVEL SECURITY;

REVOKE ALL
  ON TABLE cerebro_autoral.dimensoes
  FROM anon;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE cerebro_autoral.dimensoes
  FROM authenticated;

GRANT SELECT
  ON TABLE cerebro_autoral.dimensoes
  TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE cerebro_autoral.dimensoes
  TO service_role;

DROP POLICY IF EXISTS "Usuarios autenticados leem dimensoes canonicas"
  ON cerebro_autoral.dimensoes;

CREATE POLICY "Usuarios autenticados leem dimensoes canonicas"
  ON cerebro_autoral.dimensoes
  FOR SELECT
  TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
