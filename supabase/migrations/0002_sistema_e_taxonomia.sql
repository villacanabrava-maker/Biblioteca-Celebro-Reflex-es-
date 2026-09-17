-- ============================================================================
-- MIGRATION 0002: SISTEMA, TAXONOMIA FUNDACIONAL E DIMENSÕES DO CÉREBRO
-- Projeto: Cérebro Autoral / Memória Reflexiva
-- Idioma canônico: Português do Brasil
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SCHEMA SISTEMA
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sistema.modelos_ia (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    provedor TEXT NOT NULL DEFAULT 'openai',
    identificador_modelo TEXT NOT NULL,
    apelido TEXT NOT NULL,
    finalidade TEXT NOT NULL CHECK (
        finalidade IN (
            'extracao',
            'analise',
            'taxonomia',
            'cerebro',
            'recuperacao',
            'planejamento',
            'redacao',
            'auditoria',
            'embedding'
        )
    ),
    dimensoes_embedding INTEGER,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE sistema.modelos_ia IS 'Catálogo central de modelos de IA roteados por finalidade';

CREATE TABLE IF NOT EXISTS sistema.prompts (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    finalidade TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE sistema.prompts IS 'Identidade lógica e finalidade dos prompts do sistema';

CREATE TABLE IF NOT EXISTS sistema.versoes_prompts (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES sistema.prompts(id) ON DELETE CASCADE,
    numero_versao TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    schema_saida JSONB,
    hash_conteudo TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ativado_em TIMESTAMPTZ,
    UNIQUE (prompt_id, numero_versao)
);
COMMENT ON TABLE sistema.versoes_prompts IS 'Histórico imutável e versionado de prompts de IA';

CREATE TABLE IF NOT EXISTS sistema.versoes_pipeline (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    numero_versao TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    hash_configuracao TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ativa' CHECK (estado IN ('rascunho', 'ativa', 'arquivada')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ativado_em TIMESTAMPTZ
);
COMMENT ON TABLE sistema.versoes_pipeline IS 'Versão rastreável do pipeline documental';

CREATE TABLE IF NOT EXISTS sistema.configuracoes_usuario (
    usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    idioma_preferencial TEXT NOT NULL DEFAULT 'pt-BR',
    nivel_detalhamento TEXT NOT NULL DEFAULT 'padrao',
    aprovacao_manual_obrigatoria BOOLEAN NOT NULL DEFAULT true,
    preferencias_visuais JSONB NOT NULL DEFAULT '{}'::JSONB,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE sistema.configuracoes_usuario IS 'Preferências e parâmetros do autor sem dados sensíveis';

-- Trigger para configuracoes_usuario
CREATE OR REPLACE TRIGGER trigger_configuracoes_usuario_atualizado_em
    BEFORE UPDATE ON sistema.configuracoes_usuario
    FOR EACH ROW
    EXECUTE FUNCTION sistema.atualizar_coluna_atualizado_em();

-- ----------------------------------------------------------------------------
-- 2. SCHEMA TAXONOMIA
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS taxonomia.versoes (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    numero_versao TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ativa' CHECK (estado IN ('rascunho', 'ativa', 'arquivada')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ativado_em TIMESTAMPTZ
);
COMMENT ON TABLE taxonomia.versoes IS 'Versões canônicas da organização de conhecimento do sistema';

CREATE TABLE IF NOT EXISTS taxonomia.conceitos (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    versao_taxonomia_id UUID NOT NULL REFERENCES taxonomia.versoes(id) ON DELETE CASCADE,
    codigo TEXT UNIQUE NOT NULL,
    termo_preferencial TEXT NOT NULL,
    definicao TEXT NOT NULL,
    nota_escopo TEXT,
    dominio TEXT NOT NULL CHECK (
        dominio IN (
            'intelectual',
            'axiologico',
            'reflexivo',
            'narrativo',
            'entidades',
            'temporal',
            'retorico',
            'linguistico',
            'estrutural',
            'autoral'
        )
    ),
    estado TEXT NOT NULL DEFAULT 'ativo' CHECK (estado IN ('ativo', 'obsoleto', 'revisao')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE taxonomia.conceitos IS 'Unidades semânticas canônicas de conhecimento';

CREATE TABLE IF NOT EXISTS taxonomia.termos (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    conceito_id UUID NOT NULL REFERENCES taxonomia.conceitos(id) ON DELETE CASCADE,
    termo TEXT NOT NULL,
    termo_normalizado TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('preferencial', 'alternativo', 'sinonimo', 'historico', 'oculto_busca')),
    idioma TEXT NOT NULL DEFAULT 'pt-BR',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE taxonomia.termos IS 'Termos preferenciais, sinônimos e alternativas lexicais';
CREATE INDEX IF NOT EXISTS idx_taxonomia_termos_normalizado ON taxonomia.termos (termo_normalizado);

CREATE TABLE IF NOT EXISTS taxonomia.relacoes (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    conceito_origem_id UUID NOT NULL REFERENCES taxonomia.conceitos(id) ON DELETE CASCADE,
    tipo_relacao TEXT NOT NULL CHECK (
        tipo_relacao IN (
            'mais_amplo',
            'mais_especifico',
            'relacionado',
            'contrasta_com',
            'deriva_de',
            'evolui_para',
            'associado_a'
        )
    ),
    conceito_destino_id UUID NOT NULL REFERENCES taxonomia.conceitos(id) ON DELETE CASCADE,
    confianca NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (confianca >= 0 AND confianca <= 1),
    origem TEXT NOT NULL DEFAULT 'curadoria' CHECK (origem IN ('curadoria', 'ia', 'importacao')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (conceito_origem_id <> conceito_destino_id),
    UNIQUE (conceito_origem_id, tipo_relacao, conceito_destino_id)
);
COMMENT ON TABLE taxonomia.relacoes IS 'Grafo de relações semânticas e ontológicas entre conceitos';

-- ----------------------------------------------------------------------------
-- 3. SCHEMA CEREBRO AUTORAL: AS 18 DIMENSÕES CANÔNICAS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cerebro_autoral.dimensoes (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    ordem INTEGER NOT NULL UNIQUE,
    ativa BOOLEAN NOT NULL DEFAULT true
);
COMMENT ON TABLE cerebro_autoral.dimensoes IS 'As 18 dimensões metodológicas canônicas do Cérebro Autoral';

-- ----------------------------------------------------------------------------
-- 4. SEEDS INICIAIS CANÔNICOS
-- ----------------------------------------------------------------------------

-- Versão 1.0 da Taxonomia e Pipeline
INSERT INTO taxonomia.versoes (numero_versao, descricao, estado, ativado_em)
VALUES ('1.0.0', 'Taxonomia Canônica Inicial v1.0', 'ativa', NOW())
ON CONFLICT (numero_versao) DO NOTHING;

INSERT INTO sistema.versoes_pipeline (numero_versao, descricao, hash_configuracao, estado, ativado_em)
VALUES ('1.0.0', 'Pipeline Documental Canônico v1.0', 'sha256_hash_padrao_pipeline_v1', 'ativa', NOW())
ON CONFLICT (numero_versao) DO NOTHING;

-- Seeds dos Modelos de IA
INSERT INTO sistema.modelos_ia (provedor, identificador_modelo, apelido, finalidade, dimensoes_embedding, ativo)
VALUES
    ('openai', 'text-embedding-3-small', 'Embedding v1', 'embedding', 1536, true),
    ('openai', 'gpt-4o-mini', 'Extração Documental Rápida', 'extracao', NULL, true),
    ('openai', 'gpt-4o-mini', 'Taxonomia e Sinônimos', 'taxonomia', NULL, true),
    ('openai', 'gpt-4o', 'Análise Profunda e Cérebro', 'cerebro', NULL, true),
    ('openai', 'gpt-4o', 'Redação Autoral', 'redacao', NULL, true),
    ('openai', 'gpt-4o', 'Auditor Crítico Independente', 'auditoria', NULL, true)
ON CONFLICT DO NOTHING;

-- Seeds das 18 Dimensões Autorais
INSERT INTO cerebro_autoral.dimensoes (codigo, nome, descricao, ordem, ativa)
VALUES
    ('metodologia_de_pensamento', 'Metodologia de Pensamento', 'Como o autor formula problemas, progride do concreto ao abstrato e sintetiza', 1, true),
    ('metodologia_de_interpretacao', 'Metodologia de Interpretação', 'Como lê acontecimentos cotidianos e atribui significado a experiências', 2, true),
    ('metodologia_de_associacao', 'Metodologia de Associação', 'Como conecta experiências a conceitos, autores, imagens e memórias', 3, true),
    ('metodologia_argumentativa', 'Metodologia Argumentativa', 'Construção de teses, sustentações, contrastes, objeções e contrapontos', 4, true),
    ('metodologia_de_escrita', 'Metodologia de Escrita', 'Organização textual, ritmo, cadência, parágrafos e densidade literária', 5, true),
    ('metodologia_de_revisao', 'Metodologia de Revisão', 'Padrões de cortes, acréscimos e substituições entre rascunho e versão final', 6, true),
    ('arquitetura_narrativa', 'Arquitetura Narrativa', 'Construção de cenas, histórias, viradas temporais e desenvolvimento de personagens', 7, true),
    ('arquitetura_de_paragrafo', 'Arquitetura de Parágrafo', 'Função e extensão de frases de abertura, desenvolvimento interno e transição', 8, true),
    ('formas_de_abertura', 'Formas de Abertura', 'Padrões de início de reflexões (experiência concreta, provocação, imagem, paradoxo)', 9, true),
    ('formas_de_transicao', 'Formas de Transição', 'Movimentos cognitivos de passagem (contraste, aprofundamento, salto temporal)', 10, true),
    ('formas_de_conclusao', 'Formas de Conclusão', 'Fechamentos (síntese, pergunta aberta, retorno ao início, consequência prática)', 11, true),
    ('recursos_retoricos', 'Recursos Retóricos', 'Uso recorrente de metáforas, analogias, repetições, paralelismos e contrastes', 12, true),
    ('identidade_linguistica', 'Identidade Linguística', 'Vocabulário preferencial, formalidade, comprimento de frases e conectores', 13, true),
    ('relacao_experiencia_conceito', 'Relação Experiência-Conceito', 'Como vivências concretas são transmutadas em elaborações conceituais', 14, true),
    ('padroes_de_tensao', 'Padrões de Tensão', 'Como estabelece e sustenta conflitos intelectuais sem resoluções simplistas', 15, true),
    ('padroes_de_sintese', 'Padrões de Síntese', 'Como reconcilia ideias divergentes ou as mantém em tensão produtiva', 16, true),
    ('universo_conceitual', 'Universo Conceitual', 'Constelação de temas nucleares persistentes na obra do autor', 17, true),
    ('evolucao_autoral', 'Evolução Autoral', 'Transformações e amadurecimento metodológico ao longo do tempo', 18, true)
ON CONFLICT (codigo) DO UPDATE
SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    ordem = EXCLUDED.ordem,
    ativa = EXCLUDED.ativa;
