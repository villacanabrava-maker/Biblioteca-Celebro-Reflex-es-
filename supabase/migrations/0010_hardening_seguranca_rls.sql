-- ==============================================================================
-- MIGRATION 0010: HARDENING DE SEGURANÇA, RLS, SCHEMA APLICACAO E VIEWS
-- Conforme Documento Mestre v2.0 (Seções 11, 12 e 17)
-- ==============================================================================

-- 1. Remoção de views indevidas no schema public
DROP VIEW IF EXISTS public.v_reflexoes_resumo CASCADE;

-- 2. Garantir schema aplicacao
CREATE SCHEMA IF NOT EXISTS aplicacao;

-- 3. Criar view canônica em aplicacao com security_invoker = true
CREATE OR REPLACE VIEW aplicacao.v_reflexoes_resumo
WITH (security_invoker = true) AS
SELECT 
    e.id AS entrada_id,
    e.usuario_id,
    e.titulo,
    e.tema_central,
    e.provocacao_inicial,
    e.reflexao_externa,
    e.tipo_origem_externa,
    e.comentario_autor,
    e.formato_desejado,
    e.estado AS estado_entrada,
    e.incorporado_biblioteca,
    e.obra_incorporada_id,
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
GROUP BY 
    e.id, 
    e.usuario_id, 
    e.titulo, 
    e.tema_central, 
    e.provocacao_inicial,
    e.reflexao_externa,
    e.tipo_origem_externa,
    e.comentario_autor,
    e.formato_desejado, 
    e.estado, 
    e.incorporado_biblioteca,
    e.obra_incorporada_id,
    e.criado_em, 
    e.atualizado_em;

COMMENT ON VIEW aplicacao.v_reflexoes_resumo IS 'View canônica e segura para consulta de reflexões, respeitando estritamente o RLS do usuário autenticado (security_invoker = true).';

-- 4. Hardening de funções SECURITY DEFINER com search_path imutável
ALTER FUNCTION sistema.manipular_novo_usuario_auth() 
  SET search_path = pg_catalog, public, sistema;

-- 5. Revogação de acesso de PUBLIC e anon a schemas e funções internas
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA sistema, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA sistema, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria FROM anon;

-- Conceder apenas o necessário para autenticados e service_role
GRANT USAGE ON SCHEMA aplicacao TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA aplicacao TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA sistema, biblioteca, processamento, taxonomia, cerebro_autoral, reflexoes, auditoria TO authenticated, service_role;

-- 6. Índices de alta performance para colunas RLS (usuario_id)
CREATE INDEX IF NOT EXISTS idx_obras_usuario_id ON biblioteca.obras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_proc_usuario_id ON processamento.documentos_processados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_unidades_usuario_id ON processamento.unidades_conhecimento(usuario_id);
CREATE INDEX IF NOT EXISTS idx_elementos_usuario_id ON processamento.elementos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_entradas_reflexoes_usuario_id ON reflexoes.entradas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria.relatorios_auditoria(usuario_id);
