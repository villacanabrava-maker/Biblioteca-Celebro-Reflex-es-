-- ==============================================================================
-- MIGRATION 0012: VERSIONAMENTO REAL DO CÉREBRO, PROPOSTAS E METODOLOGIAS
-- Conforme Documento Mestre v2.0 (Seções 44, 45, 47, 48 e 49)
-- ==============================================================================

-- 1. Garantir que apenas UMA versão do Cérebro esteja ATIVA por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_uma_versao_ativa_por_usuario 
  ON cerebro_autoral.versoes_cerebro (usuario_id) 
  WHERE (estado = 'ativa');

-- 2. Associar características e regras explicitamente à versão do Cérebro
ALTER TABLE cerebro_autoral.caracteristicas
  ADD COLUMN IF NOT EXISTS versao_cerebro_id UUID REFERENCES cerebro_autoral.versoes_cerebro(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estado_proposta TEXT NOT NULL DEFAULT 'confirmada' 
    CHECK (estado_proposta IN ('proposta', 'confirmada', 'editada', 'rejeitada')),
  ADD COLUMN IF NOT EXISTS componentes_confianca JSONB NOT NULL DEFAULT '{
    "evidencias": 0,
    "contraevidencias": 0,
    "obras_distintas": 0,
    "periodos_distintos": 0,
    "consistencia": 1.0,
    "confirmacao_humana": true
  }'::jsonb;

ALTER TABLE cerebro_autoral.regras
  ADD COLUMN IF NOT EXISTS versao_cerebro_id UUID REFERENCES cerebro_autoral.versoes_cerebro(id) ON DELETE SET NULL;

-- 3. Tabela de Propostas de Atualização do Cérebro (Humano como autoridade final)
CREATE TABLE IF NOT EXISTS cerebro_autoral.propostas_atualizacao (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  versao_cerebro_id UUID REFERENCES cerebro_autoral.versoes_cerebro(id) ON DELETE CASCADE,
  tipo_proposta TEXT NOT NULL CHECK (tipo_proposta IN ('nova_caracteristica', 'atualizacao_regra', 'nova_metodologia', 'depreciacao')),
  estado_decisao TEXT NOT NULL DEFAULT 'pendente' CHECK (estado_decisao IN ('pendente', 'confirmada', 'editada', 'rejeitada')),
  dados_propostos JSONB NOT NULL,
  justificativa_ia TEXT NOT NULL,
  confianca_calculada NUMERIC(3,2) NOT NULL DEFAULT 0.85 CHECK (confianca_calculada >= 0 AND confianca_calculada <= 1),
  decidido_em TIMESTAMPTZ,
  notas_autor TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cerebro_autoral.propostas_atualizacao IS 'Propostas geradas por IA para evolução do Cérebro, exigindo confirmação soberana do autor.';

-- 4. Tabela de Metodologias e Etapas de Raciocínio (Mais do que uma frase)
CREATE TABLE IF NOT EXISTS cerebro_autoral.metodologias (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  versao_cerebro_id UUID REFERENCES cerebro_autoral.versoes_cerebro(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  contexto_aplicacao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cerebro_autoral.etapas_metodologia (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  metodologia_id UUID NOT NULL REFERENCES cerebro_autoral.metodologias(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  nome_etapa TEXT NOT NULL,
  descricao_etapa TEXT,
  CONSTRAINT uq_metodologia_ordem UNIQUE(metodologia_id, ordem)
);

-- 5. Habilitar RLS e criar políticas de isolamento multiusuário
ALTER TABLE cerebro_autoral.propostas_atualizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE cerebro_autoral.metodologias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cerebro_autoral.etapas_metodologia ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'propostas_atualizacao' AND policyname = 'politica_propostas_usuario'
  ) THEN
    CREATE POLICY politica_propostas_usuario ON cerebro_autoral.propostas_atualizacao
      FOR ALL TO authenticated
      USING (usuario_id = auth.uid())
      WITH CHECK (usuario_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'metodologias' AND policyname = 'politica_metodologias_usuario'
  ) THEN
    CREATE POLICY politica_metodologias_usuario ON cerebro_autoral.metodologias
      FOR ALL TO authenticated
      USING (usuario_id = auth.uid())
      WITH CHECK (usuario_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'etapas_metodologia' AND policyname = 'politica_etapas_metodologia'
  ) THEN
    CREATE POLICY politica_etapas_metodologia ON cerebro_autoral.etapas_metodologia
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM cerebro_autoral.metodologias m 
          WHERE m.id = etapas_metodologia.metodologia_id AND m.usuario_id = auth.uid()
        )
      );
  END IF;
END $$;
