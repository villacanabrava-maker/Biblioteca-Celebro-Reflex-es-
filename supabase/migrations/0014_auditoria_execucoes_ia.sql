-- ==============================================================================
-- MIGRATION 0014: AUDITORIA DE EXECUÇÕES DE IA E OBSERVABILIDADE DE CUSTOS
-- Conforme Documento Mestre v2.0 (Seção 71)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS auditoria.execucoes_ia (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operacao TEXT NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID,
  modelo TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1.0',
  pipeline_version TEXT NOT NULL DEFAULT 'v2.0',
  taxonomy_version TEXT NOT NULL DEFAULT 'v1.0',
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  latencia_ms INTEGER NOT NULL DEFAULT 0,
  tentativas INTEGER NOT NULL DEFAULT 1,
  custo_estimado NUMERIC(8,6) NOT NULL DEFAULT 0.000000,
  status TEXT NOT NULL CHECK (status IN ('sucesso', 'falha', 'retentado')),
  erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE auditoria.execucoes_ia IS 'Registro detalhado de observabilidade para chamadas ao modelo de IA (tokens, latência, custo e conformidade sem vazamento de CoT).';

ALTER TABLE auditoria.execucoes_ia ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'execucoes_ia' AND policyname = 'politica_execucoes_ia_usuario'
  ) THEN
    CREATE POLICY politica_execucoes_ia_usuario ON auditoria.execucoes_ia
      FOR ALL TO authenticated
      USING (usuario_id = auth.uid())
      WITH CHECK (usuario_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_execucoes_ia_usuario_op ON auditoria.execucoes_ia(usuario_id, operacao);
CREATE INDEX IF NOT EXISTS idx_execucoes_ia_criado_em ON auditoria.execucoes_ia(criado_em DESC);
