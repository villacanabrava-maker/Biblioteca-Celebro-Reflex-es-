-- 0014_indice_fk_taxonomia_elementos
-- Índice dedicado para a FK composta adicionada em 0013.

create index classificacoes_elementos_elemento_usuario_idx
  on taxonomia.classificacoes_elementos (elemento_id, usuario_id);
