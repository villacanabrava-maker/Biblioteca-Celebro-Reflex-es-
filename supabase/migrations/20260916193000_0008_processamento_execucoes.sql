-- 0008_processamento_execucoes
-- Fundação operacional do Pipeline Documental.
-- Cria execuções completas e etapas idempotentes/reexecutáveis.

-- Permite FKs compostas (entidade + usuário) sem depender apenas do UUID.
alter table biblioteca.versoes_obras
  add constraint versoes_obras_id_usuario_unique unique (id, usuario_id);

create table processamento.execucoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  versao_obra_id uuid not null,
  codigo text not null,
  estado text not null default 'recebido',
  etapa_atual text,
  percentual numeric(5,2) not null default 0,
  versao_pipeline_id uuid not null references sistema.versoes_pipeline(id) on delete restrict,
  versao_taxonomia_id uuid not null references taxonomia.versoes(id) on delete restrict,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  codigo_erro text,
  mensagem_erro text,
  criado_em timestamptz not null default now(),

  constraint execucoes_versao_obra_usuario_fk
    foreign key (versao_obra_id, usuario_id)
    references biblioteca.versoes_obras(id, usuario_id)
    on delete restrict,
  constraint execucoes_codigo_usuario_unique
    unique (usuario_id, codigo),
  constraint execucoes_id_usuario_unique
    unique (id, usuario_id),
  constraint execucoes_percentual_check
    check (percentual >= 0 and percentual <= 100),
  constraint execucoes_estado_check
    check (estado in (
      'recebido',
      'validando',
      'extraindo',
      'normalizando',
      'estruturando',
      'segmentando',
      'sintetizando',
      'analisando',
      'classificando',
      'vetorizando',
      'relacionando',
      'validando_resultado',
      'finalizando',
      'concluido',
      'falhou',
      'cancelado'
    )),
  constraint execucoes_conclusao_coerente_check
    check (
      (estado in ('concluido', 'falhou', 'cancelado') and concluido_em is not null)
      or
      (estado not in ('concluido', 'falhou', 'cancelado') and concluido_em is null)
    )
);

comment on table processamento.execucoes is
  'Uma execução completa e rastreável do pipeline documental sobre uma versão de obra.';
comment on column processamento.execucoes.etapa_atual is
  'Nome técnico da etapa atualmente executada; não substitui o histórico detalhado de etapas.';
comment on column processamento.execucoes.mensagem_erro is
  'Resumo seguro do erro, sem conteúdo sensível desnecessário.';

create index execucoes_usuario_estado_idx
  on processamento.execucoes (usuario_id, estado, criado_em desc);

create index execucoes_versao_obra_usuario_idx
  on processamento.execucoes (versao_obra_id, usuario_id);

create index execucoes_versao_pipeline_idx
  on processamento.execucoes (versao_pipeline_id);

create index execucoes_versao_taxonomia_idx
  on processamento.execucoes (versao_taxonomia_id);

create table processamento.etapas_execucao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  execucao_id uuid not null,
  nome_etapa text not null,
  ordem integer not null,
  chave_idempotencia text not null,
  estado text not null default 'pendente',
  tentativas integer not null default 0,
  iniciado_em timestamptz,
  concluido_em timestamptz,
  duracao_ms bigint,
  detalhes_auxiliares jsonb,
  criado_em timestamptz not null default now(),

  constraint etapas_execucao_execucao_usuario_fk
    foreign key (execucao_id, usuario_id)
    references processamento.execucoes(id, usuario_id)
    on delete cascade,
  constraint etapas_execucao_idempotencia_unique
    unique (chave_idempotencia),
  constraint etapas_execucao_ordem_unique
    unique (execucao_id, ordem),
  constraint etapas_execucao_ordem_check
    check (ordem >= 1),
  constraint etapas_execucao_tentativas_check
    check (tentativas >= 0),
  constraint etapas_execucao_duracao_check
    check (duracao_ms is null or duracao_ms >= 0),
  constraint etapas_execucao_detalhes_objeto_check
    check (detalhes_auxiliares is null or jsonb_typeof(detalhes_auxiliares) = 'object'),
  constraint etapas_execucao_estado_check
    check (estado in (
      'pendente',
      'executando',
      'concluida',
      'falhou',
      'ignorada',
      'cancelada'
    )),
  constraint etapas_execucao_tempos_check
    check (
      (concluido_em is null or iniciado_em is not null)
      and
      (iniciado_em is null or concluido_em is null or concluido_em >= iniciado_em)
    )
);

comment on table processamento.etapas_execucao is
  'Histórico de etapas idempotentes de uma execução do pipeline; suporta retry, resume e observabilidade.';
comment on column processamento.etapas_execucao.chave_idempotencia is
  'Chave estável que impede duplicação de uma etapa cara quando uma execução é retomada ou repetida.';
comment on column processamento.etapas_execucao.detalhes_auxiliares is
  'Metadados operacionais auxiliares; dados primários do domínio permanecem normalizados.';

-- A constraint unique(execucao_id, ordem) já fornece o índice ordenado exigido
-- pelo Dicionário Mestre; não criamos um índice duplicado.
create index etapas_execucao_estado_criado_idx
  on processamento.etapas_execucao (estado, criado_em);

create index etapas_execucao_usuario_estado_idx
  on processamento.etapas_execucao (usuario_id, estado);

alter table processamento.execucoes enable row level security;
alter table processamento.etapas_execucao enable row level security;

create policy execucoes_selecionar_proprias
  on processamento.execucoes
  for select to authenticated
  using ((select auth.uid()) = usuario_id);

create policy execucoes_inserir_proprias
  on processamento.execucoes
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy execucoes_atualizar_proprias
  on processamento.execucoes
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy execucoes_excluir_proprias
  on processamento.execucoes
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

create policy etapas_execucao_selecionar_proprias
  on processamento.etapas_execucao
  for select to authenticated
  using ((select auth.uid()) = usuario_id);

create policy etapas_execucao_inserir_proprias
  on processamento.etapas_execucao
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy etapas_execucao_atualizar_proprias
  on processamento.etapas_execucao
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy etapas_execucao_excluir_proprias
  on processamento.etapas_execucao
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- Processamento é schema interno. O usuário verá estado/progresso por API controlada.
revoke all on all tables in schema processamento from public, anon, authenticated;
revoke all on all sequences in schema processamento from public, anon, authenticated;
revoke all on all functions in schema processamento from public, anon, authenticated;

-- Validação estrutural.
do $$
declare
  tabela_count integer;
  policy_count integer;
  rls_count integer;
begin
  select count(*) into tabela_count
  from information_schema.tables
  where table_schema = 'processamento'
    and table_name in ('execucoes', 'etapas_execucao');

  if tabela_count <> 2 then
    raise exception 'Esperadas 2 tabelas de execucao, encontradas %', tabela_count;
  end if;

  select count(*) into rls_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'processamento'
    and c.relname in ('execucoes', 'etapas_execucao')
    and c.relrowsecurity is true;

  if rls_count <> 2 then
    raise exception 'RLS nao esta ativo nas duas tabelas de execucao';
  end if;

  select count(*) into policy_count
  from pg_policies
  where schemaname = 'processamento'
    and tablename in ('execucoes', 'etapas_execucao');

  if policy_count <> 8 then
    raise exception 'Esperadas 8 policies nas tabelas de execucao, encontradas %', policy_count;
  end if;
end $$;
