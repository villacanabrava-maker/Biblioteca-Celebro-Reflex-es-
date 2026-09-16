-- 0003_taxonomia
-- Taxonomia Mestre versionada do Cérebro Autoral.
--
-- Decisões importantes desta migration:
-- 1. Os estados de taxonomia.versoes possuem vocabulário explicitamente definido
--    pelo Dicionário Mestre e, portanto, usam CHECK.
-- 2. O Dicionário exige taxonomia.conceitos.estado, mas ainda não enumera seus
--    valores. A coluna nasce NOT NULL sem CHECK para não inventarmos vocabulário.
-- 3. taxonomia.classificacoes_elementos.elemento_id ainda não recebe FK porque
--    processamento.elementos será criado somente em migration posterior.
-- 4. O schema permanece interno: anon/authenticated não recebem acesso direto.

create table taxonomia.versoes (
  id uuid primary key default gen_random_uuid(),
  numero_versao text not null unique,
  descricao text not null,
  estado text not null,
  criado_em timestamptz not null default now(),
  ativado_em timestamptz,
  constraint versoes_taxonomia_estado_check
    check (estado in ('rascunho', 'ativa', 'arquivada'))
);

comment on table taxonomia.versoes is
  'Versões formais da Taxonomia Mestre que organiza o conhecimento intelectual do sistema.';
comment on column taxonomia.versoes.numero_versao is
  'Identificador humano/versionado da taxonomia, por exemplo 1.0.';
comment on column taxonomia.versoes.estado is
  'Estado técnico da versão: rascunho, ativa ou arquivada.';

create index versoes_taxonomia_estado_idx
  on taxonomia.versoes (estado);

create table taxonomia.conceitos (
  id uuid primary key default gen_random_uuid(),
  versao_taxonomia_id uuid not null
    references taxonomia.versoes(id) on delete restrict,
  codigo text not null,
  termo_preferencial text not null,
  definicao text not null,
  nota_escopo text,
  dominio text not null,
  estado text not null,
  criado_em timestamptz not null default now(),
  constraint conceitos_dominio_check
    check (dominio in (
      'intelectual',
      'axiologico',
      'reflexivo',
      'narrativo',
      'entidades',
      'temporal',
      'retorico',
      'linguistico',
      'estrutural',
      'autoral'
    )),
  constraint conceitos_codigo_por_versao_unique
    unique (versao_taxonomia_id, codigo)
);

comment on table taxonomia.conceitos is
  'Unidades canônicas de conhecimento da Taxonomia Mestre.';
comment on column taxonomia.conceitos.estado is
  'Estado obrigatório do conceito. O vocabulário de estados ainda não foi congelado no Dicionário Mestre v1.0.';
comment on column taxonomia.conceitos.dominio is
  'Domínio intelectual canônico ao qual o conceito pertence.';

create index conceitos_versao_idx
  on taxonomia.conceitos (versao_taxonomia_id);
create index conceitos_dominio_idx
  on taxonomia.conceitos (dominio);

create table taxonomia.termos (
  id uuid primary key default gen_random_uuid(),
  conceito_id uuid not null
    references taxonomia.conceitos(id) on delete cascade,
  termo text not null,
  termo_normalizado text not null,
  tipo text not null,
  idioma text not null,
  constraint termos_tipo_check
    check (tipo in (
      'preferencial',
      'alternativo',
      'sinonimo',
      'historico',
      'oculto_busca'
    )),
  constraint termos_repeticao_exata_unique
    unique (conceito_id, termo_normalizado, tipo, idioma)
);

comment on table taxonomia.termos is
  'Termos preferenciais, alternativos, sinônimos, históricos e termos ocultos de busca associados a conceitos.';
comment on column taxonomia.termos.termo_normalizado is
  'Forma normalizada usada para comparação e recuperação taxonômica.';

create index termos_normalizado_idx
  on taxonomia.termos (termo_normalizado);
create index termos_conceito_idx
  on taxonomia.termos (conceito_id);

create table taxonomia.relacoes (
  id uuid primary key default gen_random_uuid(),
  conceito_origem_id uuid not null
    references taxonomia.conceitos(id) on delete cascade,
  tipo_relacao text not null,
  conceito_destino_id uuid not null
    references taxonomia.conceitos(id) on delete cascade,
  confianca numeric(5,4) not null,
  origem text not null,
  criado_em timestamptz not null default now(),
  constraint relacoes_tipo_check
    check (tipo_relacao in (
      'mais_amplo',
      'mais_especifico',
      'relacionado',
      'contrasta_com',
      'deriva_de',
      'evolui_para',
      'associado_a'
    )),
  constraint relacoes_origem_check
    check (origem in ('curadoria', 'ia', 'importacao')),
  constraint relacoes_confianca_check
    check (confianca >= 0 and confianca <= 1),
  constraint relacoes_sem_auto_relacao_check
    check (conceito_origem_id <> conceito_destino_id),
  constraint relacoes_repeticao_exata_unique
    unique (conceito_origem_id, tipo_relacao, conceito_destino_id, origem)
);

comment on table taxonomia.relacoes is
  'Relações semânticas entre conceitos canônicos, com confiança e origem rastreáveis.';

create index relacoes_origem_idx
  on taxonomia.relacoes (conceito_origem_id, tipo_relacao);
create index relacoes_destino_idx
  on taxonomia.relacoes (conceito_destino_id, tipo_relacao);

create table taxonomia.classificacoes_elementos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  elemento_id uuid not null,
  conceito_id uuid not null
    references taxonomia.conceitos(id) on delete restrict,
  papel text not null,
  confianca numeric(5,4) not null,
  criado_em timestamptz not null default now(),
  constraint classificacoes_elementos_papel_check
    check (papel in ('principal', 'secundario', 'contextual', 'oposicao')),
  constraint classificacoes_elementos_confianca_check
    check (confianca >= 0 and confianca <= 1),
  constraint classificacoes_elementos_repeticao_unique
    unique (usuario_id, elemento_id, conceito_id, papel)
);

comment on table taxonomia.classificacoes_elementos is
  'Classificações de elementos processados em conceitos canônicos. A FK de elemento_id será adicionada quando processamento.elementos existir.';
comment on column taxonomia.classificacoes_elementos.elemento_id is
  'Referência lógica futura a processamento.elementos.id; FK deliberadamente adiada pela ordem canônica das migrations.';

create index classificacoes_elementos_usuario_idx
  on taxonomia.classificacoes_elementos (usuario_id);
create index classificacoes_elementos_elemento_idx
  on taxonomia.classificacoes_elementos (elemento_id);
create index classificacoes_elementos_conceito_idx
  on taxonomia.classificacoes_elementos (conceito_id);

alter table taxonomia.classificacoes_elementos enable row level security;

create policy classificacoes_elementos_selecionar_proprias
  on taxonomia.classificacoes_elementos
  for select
  to authenticated
  using ((select auth.uid()) = usuario_id);

create policy classificacoes_elementos_inserir_proprias
  on taxonomia.classificacoes_elementos
  for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy classificacoes_elementos_atualizar_proprias
  on taxonomia.classificacoes_elementos
  for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy classificacoes_elementos_excluir_proprias
  on taxonomia.classificacoes_elementos
  for delete
  to authenticated
  using ((select auth.uid()) = usuario_id);

-- O schema taxonomia é interno. Views/RPCs seguras serão expostas futuramente
-- pelo schema aplicacao quando a interface necessitar desses dados.
revoke all on all tables in schema taxonomia from public, anon, authenticated;
revoke all on all sequences in schema taxonomia from public, anon, authenticated;
revoke all on all functions in schema taxonomia from public, anon, authenticated;

-- Validação estrutural da própria migration.
do $$
declare
  tabela_count integer;
  policy_count integer;
  rls_ativo boolean;
begin
  select count(*) into tabela_count
  from information_schema.tables
  where table_schema = 'taxonomia'
    and table_name in (
      'versoes',
      'conceitos',
      'termos',
      'relacoes',
      'classificacoes_elementos'
    );

  if tabela_count <> 5 then
    raise exception 'Esperadas 5 tabelas de taxonomia, encontradas %', tabela_count;
  end if;

  select relrowsecurity into rls_ativo
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'taxonomia'
    and c.relname = 'classificacoes_elementos';

  if rls_ativo is not true then
    raise exception 'RLS nao esta ativo em taxonomia.classificacoes_elementos';
  end if;

  select count(*) into policy_count
  from pg_policies
  where schemaname = 'taxonomia'
    and tablename = 'classificacoes_elementos';

  if policy_count <> 4 then
    raise exception 'Esperadas 4 policies em classificacoes_elementos, encontradas %', policy_count;
  end if;
end $$;
