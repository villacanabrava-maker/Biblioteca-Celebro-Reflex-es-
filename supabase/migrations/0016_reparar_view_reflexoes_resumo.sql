-- MIGRATION 0016: REPARO DO ALIAS PUBLIC DE RESUMO DE REFLEXOES
-- Restaura a view prevista pela migration 0006 e ausente no banco canônico.

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
GROUP BY
    e.id,
    e.usuario_id,
    e.titulo,
    e.tema_central,
    e.formato_desejado,
    e.estado,
    e.criado_em,
    e.atualizado_em;

GRANT SELECT ON public.v_reflexoes_resumo TO anon, authenticated, service_role;

COMMENT ON VIEW public.v_reflexoes_resumo
IS 'Alias publico do resumo de reflexoes usado pela aplicacao Rflex01.';
