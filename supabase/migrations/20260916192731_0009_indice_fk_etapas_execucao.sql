-- 0009_indice_fk_etapas_execucao
-- Corrige o alerta do advisor de performance após 0008_processamento_execucoes.

create index etapas_execucao_execucao_usuario_idx
  on processamento.etapas_execucao (execucao_id, usuario_id);

comment on index processamento.etapas_execucao_execucao_usuario_idx is
  'Índice de suporte à FK composta entre etapa e execução, preservando integridade multiusuário.';

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'processamento'
      and tablename = 'etapas_execucao'
      and indexname = 'etapas_execucao_execucao_usuario_idx'
  ) then
    raise exception 'Indice de suporte a FK das etapas nao foi criado';
  end if;
end $$;
