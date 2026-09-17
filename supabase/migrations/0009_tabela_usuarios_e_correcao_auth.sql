-- ============================================================================
-- MIGRATION 0009: CRIAÇÃO DA TABELA SISTEMA.USUARIOS E AJUSTE ROBUSTO DO TRIGGER DE AUTH
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- 1. CRIAÇÃO DA TABELA sistema.usuarios
CREATE TABLE IF NOT EXISTS sistema.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL DEFAULT 'Autor',
    email TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'autor' CHECK (papel IN ('autor', 'administrador', 'leitor')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    preferencias JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sistema.usuarios IS 'Perfis de usuários do sistema sincronizados com o Supabase Auth';

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON sistema.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_papel ON sistema.usuarios(papel);

-- 3. TRIGGER DE ATUALIZAÇÃO TEMPORAL
DROP TRIGGER IF EXISTS trg_atualizar_usuarios ON sistema.usuarios;
CREATE TRIGGER trg_atualizar_usuarios
    BEFORE UPDATE ON sistema.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION sistema.atualizar_coluna_atualizado_em();

-- 4. SEGURANÇA ROW LEVEL SECURITY (RLS)
ALTER TABLE sistema.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_usuarios_service ON sistema.usuarios;
CREATE POLICY p_usuarios_service ON sistema.usuarios
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS p_usuarios_proprio_perfil ON sistema.usuarios;
CREATE POLICY p_usuarios_proprio_perfil ON sistema.usuarios
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS p_usuarios_atualizar_proprio ON sistema.usuarios;
CREATE POLICY p_usuarios_atualizar_proprio ON sistema.usuarios
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 5. AJUSTE DO TRIGGER COM TRATAMENTO RESILIENTE DE ERRO
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
EXCEPTION WHEN OTHERS THEN
    -- Em caso de qualquer inconsistência, nunca bloquear a criação da conta no auth.users
    RAISE WARNING 'Aviso ao provisionar perfil em sistema.usuarios: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reassociar o trigger a auth.users
DROP TRIGGER IF EXISTS trg_novo_usuario_auth ON auth.users;
CREATE TRIGGER trg_novo_usuario_auth
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sistema.manipular_novo_usuario_auth();

-- 6. PERMISSÕES DE ACESSO
GRANT USAGE ON SCHEMA sistema TO anon, authenticated, service_role;
GRANT ALL ON TABLE sistema.usuarios TO service_role;
GRANT SELECT, UPDATE ON TABLE sistema.usuarios TO authenticated;
