-- ==============================================================================
-- MIGRATION 0020: CORRIGIR RESUMO DO CEREBRO AUTORAL
-- Rflex01
-- A view anterior agregava usando auth.uid(), o que fazia consultas via
-- service_role não encontrarem a linha do usuário e retornarem métricas zeradas.
-- ==============================================================================

CREATE OR REPLACE VIEW aplicacao.v_cerebro_resumo
WITH (security_invoker = true)
AS
SELECT
  c.usuario_id,
  COUNT(DISTINCT c.id)::INT AS total_caracteristicas,
  COUNT(DISTINCT r.id)::INT AS total_regras,
  COUNT(DISTINCT r.id) FILTER (WHERE r.tipo_regra = 'proscritiva')::INT AS total_anti_regras,
  COUNT(DISTINCT c.id) FILTER (WHERE c.origem = 'nucleo_autoral')::INT AS total_nucleo_autoral,
  COUNT(DISTINCT c.id) FILTER (WHERE c.origem = 'influencia_externa')::INT AS total_influencias_externas,
  COALESCE(AVG(c.confianca_calculada), 0)::NUMERIC(3,2) AS confianca_media_geral
FROM cerebro_autoral.caracteristicas c
LEFT JOIN cerebro_autoral.regras r
  ON r.usuario_id = c.usuario_id
 AND r.ativa = true
GROUP BY c.usuario_id;

CREATE OR REPLACE VIEW public.v_cerebro_resumo
WITH (security_invoker = true)
AS
SELECT * FROM aplicacao.v_cerebro_resumo;

REVOKE ALL ON aplicacao.v_cerebro_resumo FROM anon, authenticated;
GRANT SELECT ON aplicacao.v_cerebro_resumo TO authenticated, service_role;

REVOKE ALL ON public.v_cerebro_resumo FROM anon, authenticated;
GRANT SELECT ON public.v_cerebro_resumo TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
