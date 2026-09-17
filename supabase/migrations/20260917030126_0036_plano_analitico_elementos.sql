-- 0036_plano_analitico_elementos
-- Materializa como coluna de primeira classe a separação canônica obrigatória
-- entre CONTEÚDO, MÉTODO e EXPRESSÃO. JSONB continua apenas para metadados
-- auxiliares, não para regras essenciais de identidade analítica.

alter table processamento.elementos
  add column plano_analitico text not null;

alter table processamento.elementos
  add constraint elementos_plano_analitico_check
  check (plano_analitico in ('conteudo', 'metodo', 'expressao'));

comment on column processamento.elementos.plano_analitico is
  'Plano analitico obrigatorio do elemento: conteudo (sobre o que se pensa), metodo (como o pensamento se desenvolve) ou expressao (como aparece linguisticamente).';

create index elementos_plano_tipo_idx
  on processamento.elementos (usuario_id, plano_analitico, tipo);
