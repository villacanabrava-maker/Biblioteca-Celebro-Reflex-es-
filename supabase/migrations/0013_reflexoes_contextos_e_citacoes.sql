-- ==============================================================================
-- MIGRATION 0013: SNAPSHOT IMUTÁVEL DE CONTEXTO, ESTADOS DESACOPLADOS E VERIFICAÇÃO DE CITAÇÕES
-- Conforme Documento Mestre v2.0 (Seções 58, 60 e 61)
-- ==============================================================================

-- 1. Separar formalmente o estado do Auditor IA da soberania do Autor em reflexoes.entradas
ALTER TABLE reflexoes.entradas
  ADD COLUMN IF NOT EXISTS estado_auditor_ia TEXT NOT NULL DEFAULT 'nao_auditado' 
    CHECK (estado_auditor_ia IN ('nao_auditado', 'auditado_aprovado', 'auditado_com_ressalvas', 'auditado_rejeitado')),
  ADD COLUMN IF NOT EXISTS estado_autor TEXT NOT NULL DEFAULT 'rascunho' 
    CHECK (estado_autor IN ('rascunho', 'em_revisao', 'aprovado_autor', 'rejeitado_autor'));

-- 2. Tabela reflexoes.contextos (Snapshot reproduzível do dossiê cognitivo)
CREATE TABLE IF NOT EXISTS reflexoes.contextos (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  entrada_id UUID NOT NULL REFERENCES reflexoes.entradas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fragmentos JSONB NOT NULL DEFAULT '[]'::jsonb,
  conceitos JSONB NOT NULL DEFAULT '[]'::jsonb,
  caracteristicas JSONB NOT NULL DEFAULT '[]'::jsonb,
  regras JSONB NOT NULL DEFAULT '[]'::jsonb,
  metodologias JSONB NOT NULL DEFAULT '[]'::jsonb,
  influencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  snapshot_hash TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reflexoes.contextos IS 'Snapshot imutável e auditável dos elementos contextuais mobilizados para gerar uma reflexão específica.';

-- 3. Tabela reflexoes.citacoes_verificadas (Verificador automatizado de antialucinação)
CREATE TABLE IF NOT EXISTS reflexoes.citacoes_verificadas (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  entrada_id UUID NOT NULL REFERENCES reflexoes.entradas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redacao_versao INTEGER NOT NULL DEFAULT 1,
  fragmento_id UUID REFERENCES processamento.fragmentos(id) ON DELETE SET NULL,
  texto_citado TEXT NOT NULL,
  texto_original TEXT,
  alinhamento_valido BOOLEAN NOT NULL DEFAULT true,
  tipo_fonte TEXT NOT NULL CHECK (tipo_fonte IN ('autoral', 'referencia_externa', 'influencia')),
  verificado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reflexoes.citacoes_verificadas IS 'Registro determinístico de checagem de integridade e proveniência de trechos citados na redação.';

-- 4. Habilitar RLS e políticas de acesso
ALTER TABLE reflexoes.contextos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflexoes.citacoes_verificadas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contextos' AND policyname = 'politica_contextos_usuario'
  ) THEN
    CREATE POLICY politica_contextos_usuario ON reflexoes.contextos
      FOR ALL TO authenticated
      USING (usuario_id = auth.uid())
      WITH CHECK (usuario_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'citacoes_verificadas' AND policyname = 'politica_citacoes_usuario'
  ) THEN
    CREATE POLICY politica_citacoes_usuario ON reflexoes.citacoes_verificadas
      FOR ALL TO authenticated
      USING (usuario_id = auth.uid())
      WITH CHECK (usuario_id = auth.uid());
  END IF;
END $$;
