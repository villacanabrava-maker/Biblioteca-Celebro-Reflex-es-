-- 0011_processamento_documentos_hierarquia
-- Representação computacional hierárquica: documento, seções, fragmentos e sínteses.

create table processamento.documentos_processados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null,
  versao_obra_id uuid not null,
  execucao_id uuid not null,
  codigo text not null,
  titulo text not null,
  resumo_global text,
  sintese_analitica text,
  quantidade_partes integer not null default 0,
  quantidade_capitulos integer not null default 0,
  quantidade_secoes integer not null default 0,
  quantidade_fragmentos integer not null default 0,
  quantidade_elementos integer not null default 0,
  versao_pipeline_id uuid not null references sistema.versoes_pipeline(id) on delete restrict,
  versao_taxonomia_id uuid not null references taxonomia.versoes(id) on delete restrict,
  estado text not null default 'candidato',
  publicado_em timestamptz,
  processado_em timestamptz not null default now(),

  constraint documentos_processados_obra_usuario_fk
    foreign key (obra_id, usuario_id)
    references biblioteca.obras(id, usuario_id) on delete restrict,
  constraint documentos_processados_versao_usuario_fk
    foreign key (versao_obra_id, usuario_id)
    references biblioteca.versoes_obras(id, usuario_id) on delete restrict,
  constraint documentos_processados_execucao_usuario_fk
    foreign key (execucao_id, usuario_id)
    references processamento.execucoes(id, usuario_id) on delete restrict,
  constraint documentos_processados_id_usuario_unique unique (id, usuario_id),
  constraint documentos_processados_codigo_usuario_unique unique (usuario_id, codigo),
  constraint documentos_processados_execucao_unique unique (execucao_id),
  constraint documentos_processados_quantidades_check check (
    quantidade_partes >= 0 and quantidade_capitulos >= 0 and quantidade_secoes >= 0
    and quantidade_fragmentos >= 0 and quantidade_elementos >= 0
  ),
  constraint documentos_processados_estado_check check (
    estado in ('candidato','ativo','substituido','invalidado')
  ),
  constraint documentos_processados_titulo_check check (length(trim(titulo)) > 0)
);

create unique index documentos_processados_ativo_por_obra_uidx
  on processamento.documentos_processados (usuario_id, obra_id)
  where estado = 'ativo';
create index documentos_processados_obra_usuario_idx
  on processamento.documentos_processados (obra_id, usuario_id);
create index documentos_processados_versao_usuario_idx
  on processamento.documentos_processados (versao_obra_id, usuario_id);
create index documentos_processados_execucao_usuario_idx
  on processamento.documentos_processados (execucao_id, usuario_id);
create index documentos_processados_pipeline_idx
  on processamento.documentos_processados (versao_pipeline_id);
create index documentos_processados_taxonomia_idx
  on processamento.documentos_processados (versao_taxonomia_id);
create index documentos_processados_estado_idx
  on processamento.documentos_processados (usuario_id, estado, processado_em desc);

create table processamento.secoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  documento_processado_id uuid not null,
  secao_pai_id uuid,
  codigo text not null,
  tipo text not null,
  titulo text,
  ordem integer not null,
  nivel_hierarquico smallint not null,
  pagina_inicial integer,
  pagina_final integer,
  conteudo text,
  criado_em timestamptz not null default now(),

  constraint secoes_documento_usuario_fk
    foreign key (documento_processado_id, usuario_id)
    references processamento.documentos_processados(id, usuario_id) on delete cascade,
  constraint secoes_id_documento_usuario_unique unique (id, documento_processado_id, usuario_id),
  constraint secoes_pai_mesmo_documento_fk
    foreign key (secao_pai_id, documento_processado_id, usuario_id)
    references processamento.secoes(id, documento_processado_id, usuario_id) on delete restrict,
  constraint secoes_codigo_documento_unique unique (documento_processado_id, codigo),
  constraint secoes_tipo_check check (
    tipo in ('obra','parte','capitulo','secao','subsecao','anexo','prefacio','posfacio','nota')
  ),
  constraint secoes_ordem_check check (ordem >= 1),
  constraint secoes_nivel_check check (nivel_hierarquico >= 0),
  constraint secoes_paginas_check check (
    (pagina_inicial is null or pagina_inicial >= 1)
    and (pagina_final is null or pagina_final >= 1)
    and (pagina_inicial is null or pagina_final is null or pagina_final >= pagina_inicial)
  )
);

create index secoes_documento_usuario_ordem_idx
  on processamento.secoes (documento_processado_id, usuario_id, ordem);
create index secoes_pai_documento_usuario_idx
  on processamento.secoes (secao_pai_id, documento_processado_id, usuario_id);

create table processamento.fragmentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  documento_processado_id uuid not null,
  secao_id uuid,
  codigo text not null,
  ordem integer not null,
  fragmento_anterior_id uuid,
  fragmento_seguinte_id uuid,
  pagina_inicial integer,
  pagina_final integer,
  conteudo text not null,
  conteudo_contextualizado text not null,
  quantidade_tokens integer not null,
  vetor_textual tsvector generated always as (
    to_tsvector('simple'::regconfig, coalesce(conteudo_contextualizado, ''))
  ) stored,
  criado_em timestamptz not null default now(),

  constraint fragmentos_documento_usuario_fk
    foreign key (documento_processado_id, usuario_id)
    references processamento.documentos_processados(id, usuario_id) on delete cascade,
  constraint fragmentos_secao_mesmo_documento_fk
    foreign key (secao_id, documento_processado_id, usuario_id)
    references processamento.secoes(id, documento_processado_id, usuario_id) on delete restrict,
  constraint fragmentos_id_documento_usuario_unique unique (id, documento_processado_id, usuario_id),
  constraint fragmentos_anterior_mesmo_documento_fk
    foreign key (fragmento_anterior_id, documento_processado_id, usuario_id)
    references processamento.fragmentos(id, documento_processado_id, usuario_id) on delete restrict,
  constraint fragmentos_seguinte_mesmo_documento_fk
    foreign key (fragmento_seguinte_id, documento_processado_id, usuario_id)
    references processamento.fragmentos(id, documento_processado_id, usuario_id) on delete restrict,
  constraint fragmentos_codigo_documento_unique unique (documento_processado_id, codigo),
  constraint fragmentos_ordem_documento_unique unique (documento_processado_id, ordem),
  constraint fragmentos_ordem_check check (ordem >= 1),
  constraint fragmentos_tokens_check check (quantidade_tokens >= 0),
  constraint fragmentos_conteudo_check check (length(trim(conteudo)) > 0),
  constraint fragmentos_contexto_check check (length(trim(conteudo_contextualizado)) > 0),
  constraint fragmentos_paginas_check check (
    (pagina_inicial is null or pagina_inicial >= 1)
    and (pagina_final is null or pagina_final >= 1)
    and (pagina_inicial is null or pagina_final is null or pagina_final >= pagina_inicial)
  ),
  constraint fragmentos_vizinhos_check check (
    id is distinct from fragmento_anterior_id and id is distinct from fragmento_seguinte_id
  )
);

create index fragmentos_documento_usuario_ordem_idx
  on processamento.fragmentos (documento_processado_id, usuario_id, ordem);
create index fragmentos_secao_documento_usuario_idx
  on processamento.fragmentos (secao_id, documento_processado_id, usuario_id);
create index fragmentos_anterior_documento_usuario_idx
  on processamento.fragmentos (fragmento_anterior_id, documento_processado_id, usuario_id);
create index fragmentos_seguinte_documento_usuario_idx
  on processamento.fragmentos (fragmento_seguinte_id, documento_processado_id, usuario_id);
create index fragmentos_vetor_textual_gin_idx
  on processamento.fragmentos using gin (vetor_textual);

create table processamento.sinteses (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  documento_processado_id uuid not null,
  tipo_alvo text not null,
  alvo_id uuid not null,
  nivel smallint not null,
  conteudo text not null,
  modelo_ia_id uuid not null references sistema.modelos_ia(id) on delete restrict,
  versao_prompt_id uuid not null references sistema.versoes_prompts(id) on delete restrict,
  criado_em timestamptz not null default now(),

  constraint sinteses_documento_usuario_fk
    foreign key (documento_processado_id, usuario_id)
    references processamento.documentos_processados(id, usuario_id) on delete cascade,
  constraint sinteses_tipo_alvo_check check (tipo_alvo in ('secao','capitulo','parte','obra')),
  constraint sinteses_nivel_check check (nivel >= 0),
  constraint sinteses_conteudo_check check (length(trim(conteudo)) > 0),
  constraint sinteses_alvo_unique unique (documento_processado_id, tipo_alvo, alvo_id, nivel)
);

create index sinteses_documento_usuario_idx
  on processamento.sinteses (documento_processado_id, usuario_id);
create index sinteses_alvo_idx
  on processamento.sinteses (tipo_alvo, alvo_id);
create index sinteses_modelo_idx on processamento.sinteses (modelo_ia_id);
create index sinteses_prompt_idx on processamento.sinteses (versao_prompt_id);

alter table processamento.documentos_processados enable row level security;
alter table processamento.secoes enable row level security;
alter table processamento.fragmentos enable row level security;
alter table processamento.sinteses enable row level security;

create policy documentos_processados_selecionar_proprios on processamento.documentos_processados for select to authenticated using ((select auth.uid()) = usuario_id);
create policy documentos_processados_inserir_proprios on processamento.documentos_processados for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy documentos_processados_atualizar_proprios on processamento.documentos_processados for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy documentos_processados_excluir_proprios on processamento.documentos_processados for delete to authenticated using ((select auth.uid()) = usuario_id);

create policy secoes_selecionar_proprias on processamento.secoes for select to authenticated using ((select auth.uid()) = usuario_id);
create policy secoes_inserir_proprias on processamento.secoes for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy secoes_atualizar_proprias on processamento.secoes for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy secoes_excluir_proprias on processamento.secoes for delete to authenticated using ((select auth.uid()) = usuario_id);

create policy fragmentos_selecionar_proprios on processamento.fragmentos for select to authenticated using ((select auth.uid()) = usuario_id);
create policy fragmentos_inserir_proprios on processamento.fragmentos for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy fragmentos_atualizar_proprios on processamento.fragmentos for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy fragmentos_excluir_proprios on processamento.fragmentos for delete to authenticated using ((select auth.uid()) = usuario_id);

create policy sinteses_selecionar_proprias on processamento.sinteses for select to authenticated using ((select auth.uid()) = usuario_id);
create policy sinteses_inserir_proprias on processamento.sinteses for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy sinteses_atualizar_proprias on processamento.sinteses for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy sinteses_excluir_proprias on processamento.sinteses for delete to authenticated using ((select auth.uid()) = usuario_id);

revoke all on all tables in schema processamento from public, anon, authenticated;
revoke all on all sequences in schema processamento from public, anon, authenticated;
revoke all on all functions in schema processamento from public, anon, authenticated;
