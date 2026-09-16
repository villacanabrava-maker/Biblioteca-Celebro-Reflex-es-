-- 0004_biblioteca
-- Estrutura canônica da Biblioteca: obras lógicas e suas versões físicas.

create table biblioteca.obras (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  codigo text not null,
  titulo_original text not null,
  titulo_exibicao text not null,
  titulo_normalizado text not null,
  tipo_obra text not null,
  autoria text not null,
  participacao_cerebro text not null,
  autor_original text,
  idioma text not null,
  categoria text,
  descricao text,
  data_producao date,
  periodo_autoral_inicio date,
  periodo_autoral_fim date,
  precisao_data text,
  importancia smallint,
  estado text not null,
  metadados_auxiliares jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint obras_codigo_usuario_unique
    unique (usuario_id, codigo),
  constraint obras_id_usuario_unique
    unique (id, usuario_id),
  constraint obras_tipo_obra_check
    check (tipo_obra in (
      'livro',
      'capitulo',
      'artigo',
      'carta',
      'reflexao',
      'ensaio',
      'relato',
      'mensagem',
      'anotacao',
      'transcricao',
      'documento_profissional',
      'material_metodologico',
      'referencia_externa',
      'outro'
    )),
  constraint obras_autoria_check
    check (autoria in ('autoral', 'externa')),
  constraint obras_participacao_cerebro_check
    check (participacao_cerebro in (
      'autoral_prioritaria',
      'externa_referencia',
      'externa_influencia',
      'excluida_cerebro'
    )),
  constraint obras_estado_check
    check (estado in ('ativa', 'arquivada', 'excluida')),
  constraint obras_precisao_data_check
    check (
      precisao_data is null
      or precisao_data in ('exata', 'aproximada', 'periodo', 'desconhecida')
    ),
  constraint obras_importancia_check
    check (importancia is null or (importancia >= 1 and importancia <= 5)),
  constraint obras_metadados_auxiliares_objeto_check
    check (metadados_auxiliares is null or jsonb_typeof(metadados_auxiliares) = 'object'),
  constraint obras_autoral_prioritaria_check
    check (participacao_cerebro <> 'autoral_prioritaria' or autoria = 'autoral'),
  constraint obras_externa_influencia_autoria_check
    check (participacao_cerebro <> 'externa_influencia' or autoria = 'externa')
);

comment on table biblioteca.obras is
  'Obra intelectual ou documento lógico, independente do arquivo físico e de suas versões.';
comment on column biblioteca.obras.autoria is
  'Origem autoral da obra: autoral ou externa.';
comment on column biblioteca.obras.participacao_cerebro is
  'Papel da obra no Cérebro Autoral, separado da autoria.';
comment on column biblioteca.obras.metadados_auxiliares is
  'Metadados flexíveis não canônicos; dados importantes permanecem em colunas próprias.';

create index obras_usuario_estado_idx
  on biblioteca.obras (usuario_id, estado);

create index obras_usuario_autoria_participacao_idx
  on biblioteca.obras (usuario_id, autoria, participacao_cerebro);

create index obras_busca_textual_idx
  on biblioteca.obras
  using gin (
    to_tsvector(
      'simple'::regconfig,
      coalesce(titulo_normalizado, '') || ' ' || coalesce(descricao, '')
    )
  );

create table biblioteca.versoes_obras (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null,
  codigo text not null,
  numero_versao integer not null,
  nome_arquivo text not null,
  caminho_arquivo text not null,
  tipo_mime text not null,
  extensao text,
  tamanho_bytes bigint not null,
  hash_sha256 text not null,
  quantidade_paginas integer,
  quantidade_palavras integer,
  estado_processamento text not null,
  criado_em timestamptz not null default now(),

  constraint versoes_obras_obra_usuario_fk
    foreign key (obra_id, usuario_id)
    references biblioteca.obras(id, usuario_id)
    on delete restrict,
  constraint versoes_obras_numero_unique
    unique (obra_id, numero_versao),
  constraint versoes_obras_numero_check
    check (numero_versao >= 1),
  constraint versoes_obras_tamanho_check
    check (tamanho_bytes >= 0),
  constraint versoes_obras_paginas_check
    check (quantidade_paginas is null or quantidade_paginas >= 0),
  constraint versoes_obras_palavras_check
    check (quantidade_palavras is null or quantidade_palavras >= 0),
  constraint versoes_obras_estado_processamento_check
    check (estado_processamento in (
      'recebido',
      'em_processamento',
      'concluido',
      'falhou'
    ))
);

comment on table biblioteca.versoes_obras is
  'Preserva cada versão física de uma obra sem sobrescrever as versões anteriores.';
comment on column biblioteca.versoes_obras.caminho_arquivo is
  'Caminho do arquivo original no Storage privado.';
comment on column biblioteca.versoes_obras.hash_sha256 is
  'Hash SHA-256 utilizado para integridade e deduplicação.';

create index versoes_obras_usuario_hash_idx
  on biblioteca.versoes_obras (usuario_id, hash_sha256);

create index versoes_obras_usuario_estado_idx
  on biblioteca.versoes_obras (usuario_id, estado_processamento);

alter table biblioteca.obras enable row level security;
alter table biblioteca.versoes_obras enable row level security;

create policy obras_selecionar_proprias
  on biblioteca.obras
  for select
  to authenticated
  using ((select auth.uid()) = usuario_id);

create policy obras_inserir_proprias
  on biblioteca.obras
  for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy obras_atualizar_proprias
  on biblioteca.obras
  for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy obras_excluir_proprias
  on biblioteca.obras
  for delete
  to authenticated
  using ((select auth.uid()) = usuario_id);

create policy versoes_obras_selecionar_proprias
  on biblioteca.versoes_obras
  for select
  to authenticated
  using ((select auth.uid()) = usuario_id);

create policy versoes_obras_inserir_proprias
  on biblioteca.versoes_obras
  for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy versoes_obras_atualizar_proprias
  on biblioteca.versoes_obras
  for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy versoes_obras_excluir_proprias
  on biblioteca.versoes_obras
  for delete
  to authenticated
  using ((select auth.uid()) = usuario_id);

-- O schema biblioteca permanece interno. A interface utilizará uma camada segura
-- em aplicacao e/ou endpoints do servidor.
revoke all on all tables in schema biblioteca from public, anon, authenticated;
revoke all on all sequences in schema biblioteca from public, anon, authenticated;
revoke all on all functions in schema biblioteca from public, anon, authenticated;

-- A regra de que externa_influencia precisa possuir registro ativo em
-- cerebro_autoral.influencias_externas será adicionada quando essa tabela existir.

-- Validação estrutural da própria migration.
do $$
declare
  tabela_count integer;
  policy_count integer;
  rls_obras boolean;
  rls_versoes boolean;
begin
  select count(*) into tabela_count
  from information_schema.tables
  where table_schema = 'biblioteca'
    and table_name in ('obras', 'versoes_obras');

  if tabela_count <> 2 then
    raise exception 'Esperadas 2 tabelas de biblioteca, encontradas %', tabela_count;
  end if;

  select relrowsecurity into rls_obras
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'biblioteca' and c.relname = 'obras';

  select relrowsecurity into rls_versoes
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'biblioteca' and c.relname = 'versoes_obras';

  if rls_obras is not true or rls_versoes is not true then
    raise exception 'RLS nao esta ativo em todas as tabelas da biblioteca';
  end if;

  select count(*) into policy_count
  from pg_policies
  where schemaname = 'biblioteca'
    and tablename in ('obras', 'versoes_obras');

  if policy_count <> 8 then
    raise exception 'Esperadas 8 policies na biblioteca, encontradas %', policy_count;
  end if;
end $$;
