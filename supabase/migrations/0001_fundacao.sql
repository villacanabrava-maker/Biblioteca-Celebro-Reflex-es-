-- ============================================================================
-- MIGRATION 0001: FUNDAÇÃO TRANVERSAL MÍNIMA
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- 1. EXTENSÕES POSTGRESQL ESSENCIAIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- 2. SCHEMAS ARQUITETURAIS CANÔNICOS
CREATE SCHEMA IF NOT EXISTS aplicacao;
COMMENT ON SCHEMA aplicacao IS 'Superfície de API segura para o cliente (Views e RPCs com RLS)';

CREATE SCHEMA IF NOT EXISTS biblioteca;
COMMENT ON SCHEMA biblioteca IS 'Acervo de obras originais e arquivos preservados';

CREATE SCHEMA IF NOT EXISTS processamento;
COMMENT ON SCHEMA processamento IS 'Estruturas documentais, fragmentos, sínteses, vetores e execuções';

CREATE SCHEMA IF NOT EXISTS taxonomia;
COMMENT ON SCHEMA taxonomia IS 'Organização conceitual canônica, termos e relações semânticas';

CREATE SCHEMA IF NOT EXISTS cerebro_autoral;
COMMENT ON SCHEMA cerebro_autoral IS 'Núcleo autoral, 18 dimensões metodológicas, regras e evidências';

CREATE SCHEMA IF NOT EXISTS reflexoes;
COMMENT ON SCHEMA reflexoes IS 'Processamento de reflexões, planos, versões e revisões do autor';

CREATE SCHEMA IF NOT EXISTS auditoria;
COMMENT ON SCHEMA auditoria IS 'Rastreabilidade de execuções de IA, tokens, custos e eventos';

CREATE SCHEMA IF NOT EXISTS sistema;
COMMENT ON SCHEMA sistema IS 'Catálogo de modelos de IA, prompts, pipelines e configurações';

-- 3. FUNÇÕES UTILITÁRIAS TRANSVERSAIS
CREATE OR REPLACE FUNCTION sistema.atualizar_coluna_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION sistema.atualizar_coluna_atualizado_em IS 'Trigger automático para manter atualizado_em sincronizado com NOW()';

-- 4. TIPOS ENUM CANÔNICOS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'estado_revisao' AND n.nspname = 'sistema') THEN
        CREATE TYPE sistema.estado_revisao AS ENUM (
            'nao_revisado',
            'proposta',
            'confirmada',
            'editada',
            'rejeitada',
            'obsoleta'
        );
    END IF;
END $$;
COMMENT ON TYPE sistema.estado_revisao IS 'Vocabulário unificado para estados de validação intelectual';
