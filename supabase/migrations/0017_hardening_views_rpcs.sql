-- ==============================================================================
-- MIGRATION 0017: HARDENING DE VIEWS PUBLICAS, RPCS PRIVILEGIADAS E _migrations
-- Rflex01
-- ==============================================================================

-- 1. Views expostas via public devem executar com os privilegios do chamador.
ALTER VIEW public.v_taxonomia_conceitos SET (security_invoker = true);
ALTER VIEW public.v_taxonomia_grafo SET (security_invoker = true);
ALTER VIEW public.v_cerebro_dimensoes SET (security_invoker = true);
ALTER VIEW public.v_cerebro_caracteristicas_detalhadas SET (security_invoker = true);
ALTER VIEW public.v_cerebro_regras_ativas SET (security_invoker = true);
ALTER VIEW public.v_cerebro_resumo SET (security_invoker = true);
ALTER VIEW public.v_biblioteca_estatisticas SET (security_invoker = true);
ALTER VIEW public.v_obras_detalhadas SET (security_invoker = true);
ALTER VIEW public.v_documentos_processados SET (security_invoker = true);
ALTER VIEW public.v_fragmentos_detalhados SET (security_invoker = true);
ALTER VIEW public.v_execucoes_processamento SET (security_invoker = true);
ALTER VIEW public.v_auditoria_detalhada SET (security_invoker = true);
ALTER VIEW public.v_reflexoes_resumo SET (security_invoker = true);

-- As views internas equivalentes tambem devem respeitar o chamador.
ALTER VIEW aplicacao.v_taxonomia_conceitos SET (security_invoker = true);
ALTER VIEW aplicacao.v_taxonomia_grafo SET (security_invoker = true);
ALTER VIEW aplicacao.v_cerebro_dimensoes SET (security_invoker = true);
ALTER VIEW aplicacao.v_cerebro_caracteristicas_detalhadas SET (security_invoker = true);
ALTER VIEW aplicacao.v_cerebro_regras_ativas SET (security_invoker = true);
ALTER VIEW aplicacao.v_cerebro_resumo SET (security_invoker = true);
ALTER VIEW aplicacao.v_biblioteca_estatisticas SET (security_invoker = true);
ALTER VIEW aplicacao.v_obras_detalhadas SET (security_invoker = true);
ALTER VIEW aplicacao.v_documentos_processados SET (security_invoker = true);
ALTER VIEW aplicacao.v_fragmentos_detalhados SET (security_invoker = true);
ALTER VIEW aplicacao.v_execucoes_processamento SET (security_invoker = true);
ALTER VIEW aplicacao.v_reflexoes_resumo SET (security_invoker = true);

-- 2. Remover privilegios excessivos das views internas.
REVOKE ALL ON ALL TABLES IN SCHEMA aplicacao FROM anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA aplicacao TO authenticated, service_role;

-- As fachadas public permanecem somente leitura para autenticados.
REVOKE ALL ON
  public.v_taxonomia_conceitos,
  public.v_taxonomia_grafo,
  public.v_cerebro_dimensoes,
  public.v_cerebro_caracteristicas_detalhadas,
  public.v_cerebro_regras_ativas,
  public.v_cerebro_resumo,
  public.v_biblioteca_estatisticas,
  public.v_obras_detalhadas,
  public.v_documentos_processados,
  public.v_fragmentos_detalhados,
  public.v_execucoes_processamento,
  public.v_auditoria_detalhada,
  public.v_reflexoes_resumo
FROM anon, authenticated;

GRANT SELECT ON
  public.v_taxonomia_conceitos,
  public.v_taxonomia_grafo,
  public.v_cerebro_dimensoes,
  public.v_cerebro_caracteristicas_detalhadas,
  public.v_cerebro_regras_ativas,
  public.v_cerebro_resumo,
  public.v_biblioteca_estatisticas,
  public.v_obras_detalhadas,
  public.v_documentos_processados,
  public.v_fragmentos_detalhados,
  public.v_execucoes_processamento,
  public.v_auditoria_detalhada,
  public.v_reflexoes_resumo
TO authenticated, service_role;

-- 3. RPCs SECURITY DEFINER aceitam usuario_id como argumento e, por isso,
-- devem ser exclusivas do backend administrativo.
REVOKE EXECUTE ON FUNCTION public.buscar_fragmentos_hibrido(
  uuid, text, extensions.vector, integer, numeric, numeric, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_fragmentos_hibrido(
  uuid, text, extensions.vector, integer, numeric, numeric, boolean
) TO service_role;

REVOKE EXECUTE ON FUNCTION aplicacao.buscar_fragmentos_hibrido(
  uuid, text, extensions.vector, integer, numeric, numeric, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION aplicacao.buscar_fragmentos_hibrido(
  uuid, text, extensions.vector, integer, numeric, numeric, boolean
) TO service_role;

REVOKE EXECUTE ON FUNCTION public.cadastrar_obra_com_versao(
  uuid, text, text, text, biblioteca.tipo_obra, biblioteca.natureza_obra,
  integer, text, boolean, numeric, text, text, bigint, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cadastrar_obra_com_versao(
  uuid, text, text, text, biblioteca.tipo_obra, biblioteca.natureza_obra,
  integer, text, boolean, numeric, text, text, bigint, text, text, jsonb
) TO service_role;

REVOKE EXECUTE ON FUNCTION aplicacao.cadastrar_obra_com_versao(
  uuid, text, text, text, biblioteca.tipo_obra, biblioteca.natureza_obra,
  integer, text, boolean, numeric, text, text, bigint, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION aplicacao.cadastrar_obra_com_versao(
  uuid, text, text, text, biblioteca.tipo_obra, biblioteca.natureza_obra,
  integer, text, boolean, numeric, text, text, bigint, text, text, jsonb
) TO service_role;

-- 4. Fixar search_path das funcoes apontadas pelo advisor.
ALTER FUNCTION public.buscar_fragmentos_hibrido(
  uuid, text, extensions.vector, integer, numeric, numeric, boolean
) SET search_path = pg_catalog, public, aplicacao, biblioteca, processamento, extensions;

ALTER FUNCTION aplicacao.buscar_fragmentos_hibrido(
  uuid, text, extensions.vector, integer, numeric, numeric, boolean
) SET search_path = pg_catalog, public, aplicacao, biblioteca, processamento, extensions;

ALTER FUNCTION public.cadastrar_obra_com_versao(
  uuid, text, text, text, biblioteca.tipo_obra, biblioteca.natureza_obra,
  integer, text, boolean, numeric, text, text, bigint, text, text, jsonb
) SET search_path = pg_catalog, public, aplicacao, biblioteca, processamento;

ALTER FUNCTION aplicacao.cadastrar_obra_com_versao(
  uuid, text, text, text, biblioteca.tipo_obra, biblioteca.natureza_obra,
  integer, text, boolean, numeric, text, text, bigint, text, text, jsonb
) SET search_path = pg_catalog, public, aplicacao, biblioteca, processamento;

ALTER FUNCTION sistema.atualizar_coluna_atualizado_em()
  SET search_path = pg_catalog, sistema;

-- 5. A tabela tecnica de migrations nao deve ser uma superficie publica.
ALTER TABLE public._migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public._migrations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public._migrations TO service_role;

NOTIFY pgrst, 'reload schema';
