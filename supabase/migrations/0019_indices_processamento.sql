-- ==============================================================================
-- MIGRATION 0019: INDICES DOS CAMINHOS QUENTES DE PROCESSAMENTO
-- Rflex01
-- Adiciona somente indices confirmados por filtros/joins do pipeline atual.
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_fragmentos_usuario
  ON processamento.fragmentos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_secoes_usuario
  ON processamento.secoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_vetores_usuario
  ON processamento.vetores(usuario_id);

CREATE INDEX IF NOT EXISTS idx_execucoes_usuario
  ON processamento.execucoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_execucoes_versao_obra
  ON processamento.execucoes(versao_obra_id);

CREATE INDEX IF NOT EXISTS idx_etapas_execucao_execucao
  ON processamento.etapas_execucao(execucao_id);

CREATE INDEX IF NOT EXISTS idx_evidencias_usuario
  ON processamento.evidencias(usuario_id);

CREATE INDEX IF NOT EXISTS idx_evidencias_fragmento
  ON processamento.evidencias(fragmento_id);

-- A constraint UNIQUE em chave_idempotencia ja cria um indice util.
DROP INDEX IF EXISTS processamento.idx_etapas_execucao_chave;
