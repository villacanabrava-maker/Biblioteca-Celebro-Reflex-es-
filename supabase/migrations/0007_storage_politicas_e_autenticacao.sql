-- ============================================================================
-- MIGRATION 0007: POLÍTICAS DE STORAGE PARA PROTOCOLO TUS E TRIGGER DE AUTENTICAÇÃO
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- 1. POLÍTICAS RLS COMPLETAS PARA storage.objects (PROTOCOLO TUS / RESUMABLE)
-- O protocolo TUS exige INSERT (para criar o upload) e UPDATE (para gravar os blocos subsequentes via PATCH).

-- Política de UPDATE para authenticated
DROP POLICY IF EXISTS "Atualização de originais pelo proprietário" ON storage.objects;
CREATE POLICY "Atualização de originais pelo proprietário"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'originais-biblioteca' AND 
        (storage.foldername(name))[1] = (auth.uid())::text
    )
    WITH CHECK (
        bucket_id = 'originais-biblioteca' AND 
        (storage.foldername(name))[1] = (auth.uid())::text
    );

-- Política de INSERT para authenticated
DROP POLICY IF EXISTS "Upload de originais pelo proprietário" ON storage.objects;
CREATE POLICY "Upload de originais pelo proprietário"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'originais-biblioteca' AND 
        (storage.foldername(name))[1] = (auth.uid())::text
    );

-- Política de SELECT para authenticated
DROP POLICY IF EXISTS "Leitura de originais pelo proprietário" ON storage.objects;
CREATE POLICY "Leitura de originais pelo proprietário"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'originais-biblioteca' AND 
        (storage.foldername(name))[1] = (auth.uid())::text
    );

-- Política de DELETE para authenticated
DROP POLICY IF EXISTS "Exclusão de originais pelo proprietário" ON storage.objects;
CREATE POLICY "Exclusão de originais pelo proprietário"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'originais-biblioteca' AND 
        (storage.foldername(name))[1] = (auth.uid())::text
    );

-- Política permissiva para service_role em storage.objects
DROP POLICY IF EXISTS "Acesso total do service_role a originais" ON storage.objects;
CREATE POLICY "Acesso total do service_role a originais"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'originais-biblioteca')
    WITH CHECK (bucket_id = 'originais-biblioteca');


-- 2. TRIGGER AUTOMÁTICO DE CRIAÇÃO DE PERFIL QUANDO NOVO USUÁRIO CRIA CONTA (auth.users)
CREATE OR REPLACE FUNCTION sistema.manipular_novo_usuario_auth()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO sistema.usuarios (
        id,
        nome,
        email,
        papel,
        ativo,
        criado_em,
        atualizado_em
    ) VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'nome_completo',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.email,
        'autor',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nome = COALESCE(EXCLUDED.nome, sistema.usuarios.nome),
        atualizado_em = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado após INSERT em auth.users
DROP TRIGGER IF EXISTS trg_novo_usuario_auth ON auth.users;
CREATE TRIGGER trg_novo_usuario_auth
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sistema.manipular_novo_usuario_auth();

COMMENT ON FUNCTION sistema.manipular_novo_usuario_auth() IS 'Sincroniza automaticamente novos usuários cadastrados no Supabase Auth para a tabela sistema.usuarios com perfil de autor';
