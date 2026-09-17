-- 0040_fundacao_normalizacao_taxonomia
-- Fundação determinística da etapa normalizar_taxonomia.
--
-- Princípios:
-- 1. conceitos canônicos existentes são buscados antes de qualquer proposta;
-- 2. similaridade textual produz apenas candidatos, nunca cria conceito;
-- 3. conceitos novos ficam em staging revisável separado de taxonomia.conceitos;
-- 4. toda proposta preserva origem em elementos processados;
-- 5. superfícies internas permanecem backend-only.

create or replace function taxonomia.normalizar_termo_taxonomico(p_texto text)
returns text
language sql
stable
strict
set search_path = ''
as $$
  select trim(
    regexp_replace(
      lower(
        extensions.unaccent(
          regexp_replace(trim(p_texto), '[^[:alnum:][:space:]-]+', ' ', 'g')
        )
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  )
$$;

revoke all on function taxonomia.normalizar_termo_taxonomico(text)
  from public, anon, authenticated;

create index if not exists termos_normalizado_trgm_idx
  on taxonomia.termos
  using gin (termo_normalizado extensions.gin_trgm_ops);

create table taxonomia.propostas_conceitos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  versao_taxonomia_id uuid not null references taxonomia.versoes(id) on delete restrict,
  termo_preferencial text not null,
  termo_normalizado text not null,
  definicao_proposta text not null,
  dominio_proposto text not null,
  confianca numeric(5,4) not null,
  estado_revisao text not null default 'nao_revisado',
  modelo_ia_id uuid not null references sistema.modelos_ia(id) on delete restrict,
  versao_prompt_id uuid not null references sistema.versoes_prompts(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint propostas_conceitos_id_usuario_unique unique (id, usuario_id),
  constraint propostas_conceitos_por_usuario_versao_termo_unique
    unique (usuario_id, versao_taxonomia_id, termo_normalizado),
  constraint propostas_conceitos_termo_check
    check (length(trim(termo_preferencial)) > 0),
  constraint propostas_conceitos_termo_normalizado_check
    check (
      length(trim(termo_normalizado)) > 0
      and termo_normalizado = taxonomia.normalizar_termo_taxonomico(termo_preferencial)
    ),
  constraint propostas_conceitos_definicao_check
    check (length(trim(definicao_proposta)) > 0),
  constraint propostas_conceitos_dominio_check
    check (dominio_proposto in (
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
  constraint propostas_conceitos_confianca_check
    check (confianca >= 0 and confianca <= 1),
  constraint propostas_conceitos_estado_revisao_check
    check (estado_revisao in ('nao_revisado', 'confirmado', 'editado', 'rejeitado'))
);

comment on table taxonomia.propostas_conceitos is
  'Staging revisável para conceitos sugeridos durante normalização. Uma proposta nunca é um conceito canônico por si só.';
comment on column taxonomia.propostas_conceitos.termo_normalizado is
  'Forma determinística usada para deduplicar propostas dentro da versão da Taxonomia.';
comment on column taxonomia.propostas_conceitos.estado_revisao is
  'Estado de revisão da proposta; confirmação não promove automaticamente a linha a taxonomia.conceitos.';

create index propostas_conceitos_usuario_estado_idx
  on taxonomia.propostas_conceitos(usuario_id, estado_revisao, criado_em desc);
create index propostas_conceitos_versao_termo_idx
  on taxonomia.propostas_conceitos(versao_taxonomia_id, termo_normalizado);
create index propostas_conceitos_termo_trgm_idx
  on taxonomia.propostas_conceitos
  using gin (termo_normalizado extensions.gin_trgm_ops);

create table taxonomia.fontes_propostas_conceitos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  proposta_conceito_id uuid not null,
  elemento_id uuid not null,
  confianca numeric(5,4) not null,
  justificativa text,
  criado_em timestamptz not null default now(),
  constraint fontes_propostas_conceito_usuario_fk
    foreign key (proposta_conceito_id, usuario_id)
    references taxonomia.propostas_conceitos(id, usuario_id)
    on delete cascade,
  constraint fontes_propostas_elemento_usuario_fk
    foreign key (elemento_id, usuario_id)
    references processamento.elementos(id, usuario_id)
    on delete cascade,
  constraint fontes_propostas_confianca_check
    check (confianca >= 0 and confianca <= 1),
  constraint fontes_propostas_repeticao_unique
    unique (usuario_id, proposta_conceito_id, elemento_id)
);

comment on table taxonomia.fontes_propostas_conceitos is
  'Proveniência de propostas taxonômicas: registra quais elementos processados sustentaram cada sugestão.';

create index fontes_propostas_elemento_idx
  on taxonomia.fontes_propostas_conceitos(usuario_id, elemento_id);
create index fontes_propostas_proposta_idx
  on taxonomia.fontes_propostas_conceitos(proposta_conceito_id);

alter table taxonomia.propostas_conceitos enable row level security;
alter table taxonomia.fontes_propostas_conceitos enable row level security;

revoke all on taxonomia.propostas_conceitos from public, anon, authenticated, service_role;
revoke all on taxonomia.fontes_propostas_conceitos from public, anon, authenticated, service_role;

create function aplicacao.backend_listar_elementos_normalizacao(p_execucao_id uuid)
returns table (
  documento_processado_id uuid,
  elemento_id uuid,
  codigo text,
  tipo text,
  plano_analitico text,
  titulo text,
  descricao text,
  importancia numeric,
  confianca numeric,
  quantidade_classificacoes bigint,
  quantidade_propostas bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    d.id,
    el.id,
    el.codigo,
    el.tipo,
    el.plano_analitico,
    el.titulo,
    el.descricao,
    el.importancia,
    el.confianca,
    (
      select count(*)
      from taxonomia.classificacoes_elementos ce
      where ce.usuario_id = el.usuario_id
        and ce.elemento_id = el.id
    ),
    (
      select count(*)
      from taxonomia.fontes_propostas_conceitos fp
      where fp.usuario_id = el.usuario_id
        and fp.elemento_id = el.id
    )
  from processamento.documentos_processados d
  join processamento.elementos el
    on el.documento_processado_id = d.id
   and el.usuario_id = d.usuario_id
  where d.execucao_id = p_execucao_id
  order by el.codigo, el.id
$$;

revoke all on function aplicacao.backend_listar_elementos_normalizacao(uuid)
  from public, anon, authenticated;
grant execute on function aplicacao.backend_listar_elementos_normalizacao(uuid)
  to service_role;

create function aplicacao.backend_buscar_candidatos_taxonomia(
  p_execucao_id uuid,
  p_elemento_id uuid,
  p_limite integer default 8
)
returns table (
  conceito_id uuid,
  termo_preferencial text,
  definicao text,
  dominio text,
  termo_correspondente text,
  tipo_termo text,
  tipo_correspondencia text,
  similaridade real
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_versao_taxonomia_id uuid;
  v_titulo text;
  v_termo_busca text;
  v_limite integer;
begin
  v_limite := greatest(1, least(coalesce(p_limite, 8), 20));

  select e.usuario_id, e.versao_taxonomia_id, el.titulo
    into v_usuario_id, v_versao_taxonomia_id, v_titulo
  from processamento.execucoes e
  join processamento.documentos_processados d
    on d.execucao_id = e.id
   and d.usuario_id = e.usuario_id
  join processamento.elementos el
    on el.documento_processado_id = d.id
   and el.usuario_id = d.usuario_id
   and el.id = p_elemento_id
  where e.id = p_execucao_id;

  if v_usuario_id is null then
    raise exception 'elemento_normalizacao_nao_encontrado' using errcode = 'P0002';
  end if;

  v_termo_busca := taxonomia.normalizar_termo_taxonomico(v_titulo);
  if v_termo_busca is null or length(v_termo_busca) = 0 then
    raise exception 'elemento_normalizacao_titulo_vazio' using errcode = '22023';
  end if;

  return query
  with candidatos as (
    select
      c.id as conceito_id,
      c.termo_preferencial,
      c.definicao,
      c.dominio,
      t.termo as termo_correspondente,
      t.tipo as tipo_termo,
      case
        when t.termo_normalizado = v_termo_busca then 'exata'::text
        else 'similaridade'::text
      end as tipo_correspondencia,
      case
        when t.termo_normalizado = v_termo_busca then 1::real
        else extensions.similarity(t.termo_normalizado, v_termo_busca)
      end as similaridade,
      row_number() over (
        partition by c.id
        order by
          (t.termo_normalizado = v_termo_busca) desc,
          extensions.similarity(t.termo_normalizado, v_termo_busca) desc,
          case t.tipo
            when 'preferencial' then 1
            when 'sinonimo' then 2
            when 'alternativo' then 3
            when 'historico' then 4
            else 5
          end,
          t.termo
      ) as ordem_conceito
    from taxonomia.conceitos c
    join taxonomia.termos t on t.conceito_id = c.id
    where c.versao_taxonomia_id = v_versao_taxonomia_id
      and (
        t.termo_normalizado = v_termo_busca
        or t.termo_normalizado OPERATOR(extensions.%) v_termo_busca
      )
  )
  select
    candidatos.conceito_id,
    candidatos.termo_preferencial,
    candidatos.definicao,
    candidatos.dominio,
    candidatos.termo_correspondente,
    candidatos.tipo_termo,
    candidatos.tipo_correspondencia,
    candidatos.similaridade
  from candidatos
  where candidatos.ordem_conceito = 1
  order by
    (candidatos.tipo_correspondencia = 'exata') desc,
    candidatos.similaridade desc,
    candidatos.termo_preferencial,
    candidatos.conceito_id
  limit v_limite;
end;
$$;

revoke all on function aplicacao.backend_buscar_candidatos_taxonomia(uuid,uuid,integer)
  from public, anon, authenticated;
grant execute on function aplicacao.backend_buscar_candidatos_taxonomia(uuid,uuid,integer)
  to service_role;

-- Guardrails estruturais da migration.
do $$
declare
  v_rls_propostas boolean;
  v_rls_fontes boolean;
  v_exec_anon boolean;
  v_exec_auth boolean;
begin
  select c.relrowsecurity into v_rls_propostas
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'taxonomia' and c.relname = 'propostas_conceitos';

  select c.relrowsecurity into v_rls_fontes
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'taxonomia' and c.relname = 'fontes_propostas_conceitos';

  if v_rls_propostas is not true or v_rls_fontes is not true then
    raise exception 'rls_taxonomia_propostas_nao_ativo';
  end if;

  select has_function_privilege(
    'anon',
    'aplicacao.backend_buscar_candidatos_taxonomia(uuid,uuid,integer)',
    'EXECUTE'
  ) into v_exec_anon;

  select has_function_privilege(
    'authenticated',
    'aplicacao.backend_buscar_candidatos_taxonomia(uuid,uuid,integer)',
    'EXECUTE'
  ) into v_exec_auth;

  if v_exec_anon or v_exec_auth then
    raise exception 'rpc_candidatos_taxonomia_exposta_ao_cliente';
  end if;
end $$;
