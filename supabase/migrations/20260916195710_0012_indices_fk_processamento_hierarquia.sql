-- 0012_indices_fk_processamento_hierarquia
-- Índices dedicados para FKs simples de usuario_id detectadas pelo advisor.

create index secoes_usuario_idx
  on processamento.secoes (usuario_id);

create index fragmentos_usuario_idx
  on processamento.fragmentos (usuario_id);

create index sinteses_usuario_idx
  on processamento.sinteses (usuario_id);
