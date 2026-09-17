-- ==============================================================================
-- MIGRATION 0011: MODELAGEM CANÔNICA DE FONTES EM DOIS EIXOS E PREVENÇÃO DE CONTAMINAÇÃO
-- Conforme Documento Mestre v2.0 (Seções 18, 25 e 26)
-- ==============================================================================

-- 1. Adicionar colunas dos dois eixos e metadados de influência deliberada
ALTER TABLE biblioteca.obras
  ADD COLUMN IF NOT EXISTS papel_fonte TEXT NOT NULL DEFAULT 'autoral' 
    CHECK (papel_fonte IN ('autoral', 'externa')),
  ADD COLUMN IF NOT EXISTS participacao_cerebro TEXT NOT NULL DEFAULT 'nucleo_autoral' 
    CHECK (participacao_cerebro IN ('nucleo_autoral', 'referencia', 'influencia_deliberada', 'excluida')),
  ADD COLUMN IF NOT EXISTS escopos_influencia TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS intensidade_influencia TEXT 
    CHECK (intensidade_influencia IS NULL OR intensidade_influencia IN ('leve', 'moderada', 'forte'));

-- 2. Migrar dados pré-existentes de acordo com as colunas natureza e participa_cerebro
UPDATE biblioteca.obras
SET 
  papel_fonte = CASE 
    WHEN natureza::text IN ('referencia', 'externa_aprovada') THEN 'externa'
    ELSE 'autoral'
  END,
  participacao_cerebro = CASE 
    WHEN participa_cerebro = false THEN 'excluida'
    WHEN natureza::text = 'externa_aprovada' THEN 'influencia_deliberada'
    WHEN natureza::text = 'referencia' THEN 'referencia'
    ELSE 'nucleo_autoral'
  END;

-- 3. Invariante Inegociável de Proteção do Cérebro (Constraint Anti-Contaminação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_fonte_nao_contaminada'
  ) THEN
    ALTER TABLE biblioteca.obras
      ADD CONSTRAINT chk_fonte_nao_contaminada
      CHECK (
        NOT (papel_fonte = 'externa' AND participacao_cerebro = 'nucleo_autoral') AND
        NOT (papel_fonte = 'autoral' AND participacao_cerebro = 'influencia_deliberada')
      );
  END IF;
END $$;

COMMENT ON COLUMN biblioteca.obras.papel_fonte IS 'Eixo 1: Define a autoria da fonte (autoral do usuário ou externa de terceiros).';
COMMENT ON COLUMN biblioteca.obras.participacao_cerebro IS 'Eixo 2: Papel estrito no Cérebro Autoral (núcleo autoral, referência teórica, influência deliberada ou excluída).';
COMMENT ON COLUMN biblioteca.obras.escopos_influencia IS 'Dimensões autorizadas para influência externa (pensamento, interpretação, retórica, escrita, etc).';
COMMENT ON COLUMN biblioteca.obras.intensidade_influencia IS 'Intensidade calibrada da influência (leve, moderada, forte).';
