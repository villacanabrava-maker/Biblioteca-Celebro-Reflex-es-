-- ==============================================================================
-- MIGRATION 0015: INCORPORAÇÃO CANÔNICA VIA STORAGE E PIPELINE DOCUMENTAL
-- Conforme Documento Mestre v2.0 (Seção 65)
-- ==============================================================================

CREATE OR REPLACE FUNCTION reflexoes.incorporar_reflexao_como_obra(
    p_entrada_id UUID,
    p_versao_id UUID,
    p_usuario_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, reflexoes, biblioteca
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
    -- 1. Validar posse e autorização do chamador
    IF p_usuario_id IS NULL OR p_usuario_id <> auth.uid() THEN
        RAISE EXCEPTION 'Acesso negado: você só pode incorporar suas próprias reflexões.';
    END IF;

    -- 2. Validar existência da entrada
    SELECT * INTO v_entrada
    FROM reflexoes.entradas
    WHERE id = p_entrada_id AND usuario_id = p_usuario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrada de reflexão não encontrada ou não pertence ao usuário.';
    END IF;

    -- 3. Invariante Inegociável: Apenas reflexão aprovada soberanamente pelo autor pode ser incorporada
    IF v_entrada.estado_autor <> 'aprovado_autor' AND v_entrada.estado <> 'concluida' AND v_entrada.estado <> 'aprovado' THEN
        RAISE EXCEPTION 'A reflexão precisa ser explicitamente aprovada pelo autor antes de ser incorporada ao acervo.';
    END IF;

    -- Se já foi incorporada anteriormente, retorna a obra existente
    IF v_entrada.incorporado_biblioteca AND v_entrada.obra_incorporada_id IS NOT NULL THEN
        RETURN v_entrada.obra_incorporada_id;
    END IF;

    -- 4. Validar existência da versão
    SELECT * INTO v_versao
    FROM reflexoes.versoes_reflexao
    WHERE id = p_versao_id AND entrada_id = p_entrada_id AND usuario_id = p_usuario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Versão de reflexão não encontrada.';
    END IF;

    -- Gerar hash sha256 do texto markdown
    v_hash_conteudo := encode(digest(v_versao.conteudo_markdown, 'sha256'), 'hex');

    -- 5. Criar nova Obra na Biblioteca com os dois eixos canônicos (autoral / nucleo_autoral)
    INSERT INTO biblioteca.obras (
        usuario_id,
        titulo,
        subtitulo,
        autor_nome,
        tipo,
        genero,
        idioma,
        descricao,
        papel_no_cerebro,
        papel_fonte,
        participacao_cerebro,
        status_processamento,
        metadados
    ) VALUES (
        p_usuario_id,
        COALESCE(v_versao.titulo_gerado, v_entrada.titulo, 'Reflexão Incorporada'),
        'Reflexão amadurecida no Cérebro Autoral a partir de provocação e comentário',
        'Autor da Memória Reflexiva',
        'artigo',
        'Ensaio Reflexivo',
        'pt-BR',
        'Obra autoral gerada pelo processo reflexivo dialético e aprovada soberanamente pelo autor.',
        'material_autoral',
        'autoral',
        'nucleo_autoral',
        'concluido',
        jsonb_build_object(
            'incorporado_de_reflexao_id', p_entrada_id,
            'versao_reflexao_id', p_versao_id,
            'data_incorporacao', NOW()
        )
    )
    RETURNING id INTO v_nova_obra_id;

    -- 6. Criar Versão 1 da Obra
    INSERT INTO biblioteca.versoes_obras (
        obra_id,
        usuario_id,
        numero_versao,
        nome_arquivo_original,
        formato,
        tamanho_bytes,
        hash_sha256,
        storage_caminho,
        status_processamento
    ) VALUES (
        v_nova_obra_id,
        p_usuario_id,
        1,
        'reflexao_' || p_entrada_id || '_v' || v_versao.numero_versao || '.md',
        'markdown',
        octet_length(v_versao.conteudo_markdown),
        v_hash_conteudo,
        'reflexoes/' || p_usuario_id || '/' || p_entrada_id || '.md',
        'concluido'
    )
    RETURNING id INTO v_nova_versao_obra_id;

    -- 7. Criar Registro de Documento Processado
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
        COALESCE(v_versao.titulo_gerado, v_entrada.titulo),
        1,
        1,
        COALESCE(v_versao.total_palavras, 0),
        ROUND(COALESCE(v_versao.total_palavras, 0) * 1.3),
        'ativo',
        NOW(),
        jsonb_build_object('origem_incorporacao', true, 'reflexao_id', p_entrada_id)
    )
    RETURNING id INTO v_doc_processado_id;

    -- 8. Criar Unidade de Conhecimento e Fragmento
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
    )
    RETURNING id INTO v_unidade_id;

    INSERT INTO processamento.fragmentos (
        id,
        documento_processado_id,
        ordem,
        conteudo,
        total_palavras,
        total_tokens_estimado
    ) VALUES (
        v_unidade_id,
        v_doc_processado_id,
        1,
        v_versao.conteudo_markdown,
        COALESCE(v_versao.total_palavras, 0),
        ROUND(COALESCE(v_versao.total_palavras, 0) * 1.3)
    );

    -- 9. Marcar Entrada como Incorporada à Biblioteca
    UPDATE reflexoes.entradas
    SET 
        incorporado_biblioteca = TRUE,
        obra_incorporada_id = v_nova_obra_id,
        estado = 'concluida',
        etapa_atual = 12,
        atualizado_em = NOW()
    WHERE id = p_entrada_id;

    RETURN v_nova_obra_id;
END;
$$;

COMMENT ON FUNCTION reflexoes.incorporar_reflexao_como_obra(UUID, UUID, UUID) 
IS 'Promove soberanamente uma reflexão aprovada a uma nova obra autoral no acervo, habilitando o pipeline documental.';
