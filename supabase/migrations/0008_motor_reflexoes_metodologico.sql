-- ============================================================================
-- MIGRATION 0008: MOTOR DE REFLEXÕES METODOLÓGICO & INCORPORAÇÃO ATÔMICA
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- 1. EXTENSÃO DE COLUNAS EM reflexoes.entradas
ALTER TABLE reflexoes.entradas
    ADD COLUMN IF NOT EXISTS reflexao_externa TEXT,
    ADD COLUMN IF NOT EXISTS tipo_origem_externa TEXT DEFAULT 'texto' 
        CHECK (tipo_origem_externa IN ('texto', 'artigo', 'mensagem', 'documento', 'audio_transcricao', 'observacao')),
    ADD COLUMN IF NOT EXISTS comentario_autor TEXT,
    ADD COLUMN IF NOT EXISTS dossie_contexto JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS conflitos_detectados JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS incorporado_biblioteca BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS obra_incorporada_id UUID REFERENCES biblioteca.obras(id) ON DELETE SET NULL;

COMMENT ON COLUMN reflexoes.entradas.reflexao_externa IS 'Conteúdo do estímulo / reflexão externa a analisar';
COMMENT ON COLUMN reflexoes.entradas.tipo_origem_externa IS 'Tipo de origem do conteúdo externo inserido';
COMMENT ON COLUMN reflexoes.entradas.comentario_autor IS 'O que o autor pensa atualmente sobre a provocação';
COMMENT ON COLUMN reflexoes.entradas.dossie_contexto IS 'Dossiê contextual consolidado: documentos relevantes, conceitos e memórias';
COMMENT ON COLUMN reflexoes.entradas.conflitos_detectados IS 'Tensões cognitivas e divergências mapeadas antes do planejamento';
COMMENT ON COLUMN reflexoes.entradas.incorporado_biblioteca IS 'Indica se a reflexão concluída foi promovida a obra na Biblioteca';
COMMENT ON COLUMN reflexoes.entradas.obra_incorporada_id IS 'Chave estrangeira para a obra autoral gerada na Biblioteca';

-- 2. RECRIAR A VIEW RESUMO DE REFLEXÕES
DROP VIEW IF EXISTS public.v_reflexoes_resumo CASCADE;

CREATE VIEW public.v_reflexoes_resumo AS
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

GRANT SELECT ON public.v_reflexoes_resumo TO anon, authenticated, service_role;

-- 3. FUNÇÃO RPC ATÔMICA: INCORPORAR REFLEXÃO À BIBLIOTECA COMO OBRA AUTORAL
CREATE OR REPLACE FUNCTION reflexoes.incorporar_reflexao_como_obra(
    p_entrada_id UUID,
    p_versao_id UUID,
    p_usuario_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entrada RECORD;
    v_versao RECORD;
    v_nova_obra_id UUID;
    v_nova_versao_obra_id UUID;
    v_doc_processado_id UUID;
    v_unidade_id UUID;
    v_hash_conteudo TEXT;
BEGIN
    -- 1. Validar posse e existência da entrada
    SELECT * INTO v_entrada
    FROM reflexoes.entradas
    WHERE id = p_entrada_id AND usuario_id = p_usuario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrada de reflexão não encontrada ou não pertence ao usuário.';
    END IF;

    -- 2. Validar posse e existência da versão
    SELECT * INTO v_versao
    FROM reflexoes.versoes_reflexao
    WHERE id = p_versao_id AND entrada_id = p_entrada_id AND usuario_id = p_usuario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Versão de reflexão não encontrada.';
    END IF;

    -- Se já foi incorporada anteriormente, retorna a obra existente
    IF v_entrada.incorporado_biblioteca AND v_entrada.obra_incorporada_id IS NOT NULL THEN
        RETURN v_entrada.obra_incorporada_id;
    END IF;

    -- Gerar hash sha256 do texto markdown
    v_hash_conteudo := encode(digest(v_versao.conteudo_markdown, 'sha256'), 'hex');

    -- 3. Criar nova Obra na Biblioteca
    INSERT INTO biblioteca.obras (
        usuario_id,
        titulo,
        subtitulo,
        autor_nome,
        tipo,
        natureza,
        participa_cerebro,
        peso_autoral,
        descricao,
        metadados
    ) VALUES (
        p_usuario_id,
        v_versao.titulo_gerado,
        COALESCE(v_versao.sumario_executivo, 'Reflexão autoral concebida e aprovada'),
        'Autor',
        'reflexao'::biblioteca.tipo_obra,
        'autoral'::biblioteca.natureza_obra,
        TRUE,
        1.00,
        v_entrada.tema_central,
        jsonb_build_object(
            'origem', 'motor_reflexoes',
            'entrada_id', p_entrada_id,
            'versao_id', p_versao_id,
            'provocacao_inicial', v_entrada.provocacao_inicial
        )
    ) RETURNING id INTO v_nova_obra_id;

    -- 4. Criar versão do arquivo na Biblioteca
    INSERT INTO biblioteca.versoes_obras (
        obra_id,
        usuario_id,
        numero_versao,
        arquivo_caminho,
        arquivo_nome_original,
        arquivo_tamanho_bytes,
        arquivo_mime_type,
        hash_sha256,
        total_paginas,
        total_palavras_estimado,
        estado_processamento
    ) VALUES (
        v_nova_obra_id,
        p_usuario_id,
        1,
        'reflexoes/' || p_entrada_id::text || '/' || p_versao_id::text || '.md',
        'reflexao-' || substring(p_entrada_id::text from 1 for 8) || '.md',
        octet_length(v_versao.conteudo_markdown),
        'text/markdown',
        v_hash_conteudo,
        1,
        v_versao.total_palavras,
        'processado'
    ) RETURNING id INTO v_nova_versao_obra_id;

    -- 5. Criar Documento Processado (estado 'ativo' para alimentar imediatamente o Cérebro Autoral)
    INSERT INTO processamento.documentos_processados (
        versao_obra_id,
        usuario_id,
        titulo_processado,
        total_secoes,
        total_fragmentos,
        total_palavras,
        total_tokens_estimado,
        estado_publicacao,
        publicado_em,
        metadados
    ) VALUES (
        v_nova_versao_obra_id,
        p_usuario_id,
        v_versao.titulo_gerado,
        1,
        1,
        v_versao.total_palavras,
        ROUND(v_versao.total_palavras * 1.35),
        'ativo',
        NOW(),
        jsonb_build_object(
            'incorporado_de_reflexao', TRUE,
            'versao_reflexao_id', p_versao_id
        )
    ) RETURNING id INTO v_doc_processado_id;

    -- 6. Criar Unidade de Conhecimento polimórfica
    INSERT INTO processamento.unidades_conhecimento (
        usuario_id,
        obra_id,
        versao_obra_id,
        tipo_unidade
    ) VALUES (
        p_usuario_id,
        v_nova_obra_id,
        v_nova_versao_obra_id,
        'fragmento'
    ) RETURNING id INTO v_unidade_id;

    -- 7. Criar Fragmento textual ativo para busca semântica e Cérebro
    INSERT INTO processamento.fragmentos (
        id,
        documento_processado_id,
        usuario_id,
        ordem_sequencial,
        conteudo,
        total_palavras,
        total_tokens_estimado,
        densidade_autoral,
        tipo_fragmento,
        metadados
    ) VALUES (
        v_unidade_id,
        v_doc_processado_id,
        p_usuario_id,
        1,
        v_versao.conteudo_markdown,
        v_versao.total_palavras,
        ROUND(v_versao.total_palavras * 1.35),
        1.00,
        'reflexao',
        jsonb_build_object(
            'origem', 'reflexao_incorporada',
            'versao_id', p_versao_id
        )
    );

    -- 8. Atualizar a Entrada de Reflexão e a Versão
    UPDATE reflexoes.entradas
    SET 
        incorporado_biblioteca = TRUE,
        obra_incorporada_id = v_nova_obra_id,
        estado = 'concluida'
    WHERE id = p_entrada_id;

    UPDATE reflexoes.versoes_reflexao
    SET estado = 'aprovado'
    WHERE id = p_versao_id;

    -- 9. Registrar Auditoria do Sistema
    INSERT INTO auditoria.logs_seguranca (
        usuario_id,
        acao,
        recurso,
        recurso_id,
        detalhes
    ) VALUES (
        p_usuario_id,
        'INCORPORAR_REFLEXAO_MEMORIA',
        'reflexoes.entradas',
        p_entrada_id,
        jsonb_build_object(
            'obra_id', v_nova_obra_id,
            'versao_id', p_versao_id,
            'titulo', v_versao.titulo_gerado
        )
    );

    RETURN v_nova_obra_id;
END;
$$;

-- 4. PERMISSÕES
GRANT EXECUTE ON FUNCTION reflexoes.incorporar_reflexao_como_obra(UUID, UUID, UUID) TO authenticated, service_role;
