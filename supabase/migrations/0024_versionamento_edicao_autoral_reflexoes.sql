-- ==============================================================================
-- MIGRATION 0024: VERSIONAMENTO DE EDICAO AUTORAL DE REFLEXOES
-- Rflex01
-- Preserva a versao gerada pela IA e registra a edicao do autor como nova versao.
-- ==============================================================================

ALTER TABLE reflexoes.versoes_reflexao
  ADD COLUMN IF NOT EXISTS origem_versao text NOT NULL DEFAULT 'ia'
    CHECK (origem_versao IN ('ia', 'edicao_autor')),
  ADD COLUMN IF NOT EXISTS versao_base_id uuid
    REFERENCES reflexoes.versoes_reflexao(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_versoes_reflexao_base
  ON reflexoes.versoes_reflexao(versao_base_id)
  WHERE versao_base_id IS NOT NULL;

COMMENT ON COLUMN reflexoes.versoes_reflexao.origem_versao
  IS 'Origem editorial da versao: gerada por IA ou edicao posterior do autor';

COMMENT ON COLUMN reflexoes.versoes_reflexao.versao_base_id
  IS 'Versao preservada que serviu de base para a edicao autoral';

UPDATE reflexoes.versoes_reflexao
SET origem_versao = 'ia'
WHERE origem_versao IS NULL;

NOTIFY pgrst, 'reload schema';
