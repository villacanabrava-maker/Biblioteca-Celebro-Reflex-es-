-- 0013_processamento_elementos_vetores_grafo
-- Fecha a representação intelectual do Documento Processado e a FK adiada da Taxonomia.

alter table processamento.fragmentos
  add constraint fragmentos_id_usuario_unique unique (id, usuario_id);

create table processamento.vetores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo_alvo text not null,
  alvo_id uuid not null,
  embedding extensions.vector(1536) not null,
  modelo_ia_id uuid not null references sistema.modelos_ia(id) on delete restrict,
  dimensoes integer not null default 1536,
  versao integer not null default 1,
  criado_em timestamptz not null default now(),
  constraint vetores_dimensoes_check check (dimensoes = 1536),
  constraint vetores_versao_check check (versao >= 1),
  constraint vetores_tipo_alvo_check check (length(trim(tipo_alvo)) > 0),
  constraint vetores_alvo_modelo_versao_unique unique (usuario_id, tipo_alvo, alvo_id, modelo_ia_id, versao)
);

create index vetores_usuario_idx on processamento.vetores (usuario_id);
create index vetores_alvo_idx on processamento.vetores (usuario_id, tipo_alvo, alvo_id);
create index vetores_modelo_idx on processamento.vetores (modelo_ia_id);
create index vetores_embedding_hnsw_cosine_idx
  on processamento.vetores using hnsw (embedding extensions.vector_cosine_ops);

create table processamento.elementos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  documento_processado_id uuid not null,
  codigo text not null,
  tipo text not null,
  titulo text not null,
  descricao text not null,
  conteudo_estruturado jsonb,
  importancia numeric(5,4) not null,
  confianca numeric(5,4) not null,
  estado_revisao text not null default 'nao_revisado',
  modelo_ia_id uuid not null references sistema.modelos_ia(id) on delete restrict,
  versao_prompt_id uuid not null references sistema.versoes_prompts(id) on delete restrict,
  criado_em timestamptz not null default now(),
  constraint elementos_documento_usuario_fk foreign key (documento_processado_id, usuario_id)
    references processamento.documentos_processados(id, usuario_id) on delete cascade,
  constraint elementos_id_usuario_unique unique (id, usuario_id),
  constraint elementos_codigo_documento_unique unique (documento_processado_id, codigo),
  constraint elementos_tipo_check check (tipo in (
    'tema','conceito','ideia','tese','argumento','valor','principio','pergunta',
    'tensao','contradicao','conclusao','historia','experiencia','pessoa','personagem',
    'lugar','evento','metafora','analogia','contraste','frase_relevante',
    'padrao_linguistico','recurso_narrativo','estrutura_argumentativa',
    'mudanca_de_pensamento','referencia'
  )),
  constraint elementos_importancia_check check (importancia >= 0 and importancia <= 1),
  constraint elementos_confianca_check check (confianca >= 0 and confianca <= 1),
  constraint elementos_estado_revisao_check check (estado_revisao in ('nao_revisado','confirmado','editado','rejeitado')),
  constraint elementos_titulo_check check (length(trim(titulo)) > 0),
  constraint elementos_descricao_check check (length(trim(descricao)) > 0),
  constraint elementos_conteudo_estruturado_check check (conteudo_estruturado is null or jsonb_typeof(conteudo_estruturado) = 'object')
);

create index elementos_usuario_idx on processamento.elementos (usuario_id);
create index elementos_documento_usuario_idx on processamento.elementos (documento_processado_id, usuario_id);
create index elementos_tipo_estado_idx on processamento.elementos (usuario_id, tipo, estado_revisao);
create index elementos_modelo_idx on processamento.elementos (modelo_ia_id);
create index elementos_prompt_idx on processamento.elementos (versao_prompt_id);

create table processamento.evidencias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  elemento_id uuid not null,
  fragmento_id uuid not null,
  pagina_inicial integer,
  pagina_final integer,
  trecho_referencia text not null,
  forca_evidencia numeric(5,4) not null,
  justificativa text,
  criado_em timestamptz not null default now(),
  constraint evidencias_elemento_usuario_fk foreign key (elemento_id, usuario_id)
    references processamento.elementos(id, usuario_id) on delete cascade,
  constraint evidencias_fragmento_usuario_fk foreign key (fragmento_id, usuario_id)
    references processamento.fragmentos(id, usuario_id) on delete restrict,
  constraint evidencias_forca_check check (forca_evidencia >= 0 and forca_evidencia <= 1),
  constraint evidencias_trecho_check check (length(trim(trecho_referencia)) > 0),
  constraint evidencias_paginas_check check (
    (pagina_inicial is null or pagina_inicial >= 1)
    and (pagina_final is null or pagina_final >= 1)
    and (pagina_inicial is null or pagina_final is null or pagina_final >= pagina_inicial)
  )
);

create index evidencias_usuario_idx on processamento.evidencias (usuario_id);
create index evidencias_elemento_usuario_idx on processamento.evidencias (elemento_id, usuario_id);
create index evidencias_fragmento_usuario_idx on processamento.evidencias (fragmento_id, usuario_id);

create table processamento.relacoes_elementos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  elemento_origem_id uuid not null,
  tipo_relacao text not null,
  elemento_destino_id uuid not null,
  confianca numeric(5,4) not null,
  justificativa text,
  criado_em timestamptz not null default now(),
  constraint relacoes_elementos_origem_usuario_fk foreign key (elemento_origem_id, usuario_id)
    references processamento.elementos(id, usuario_id) on delete cascade,
  constraint relacoes_elementos_destino_usuario_fk foreign key (elemento_destino_id, usuario_id)
    references processamento.elementos(id, usuario_id) on delete cascade,
  constraint relacoes_elementos_tipo_check check (tipo_relacao in (
    'sustenta','contradiz','expande','deriva_de','exemplifica','questiona',
    'responde_a','evolui_para','associa_se_a','reformula'
  )),
  constraint relacoes_elementos_confianca_check check (confianca >= 0 and confianca <= 1),
  constraint relacoes_elementos_nao_reflexiva_check check (elemento_origem_id <> elemento_destino_id),
  constraint relacoes_elementos_unique unique (usuario_id, elemento_origem_id, tipo_relacao, elemento_destino_id)
);

create index relacoes_elementos_usuario_idx on processamento.relacoes_elementos (usuario_id);
create index relacoes_elementos_origem_usuario_idx on processamento.relacoes_elementos (elemento_origem_id, usuario_id);
create index relacoes_elementos_destino_usuario_idx on processamento.relacoes_elementos (elemento_destino_id, usuario_id);
create index relacoes_elementos_tipo_idx on processamento.relacoes_elementos (usuario_id, tipo_relacao);

alter table taxonomia.classificacoes_elementos
  add constraint classificacoes_elementos_elemento_usuario_fk
  foreign key (elemento_id, usuario_id)
  references processamento.elementos(id, usuario_id)
  on delete cascade;

alter table processamento.vetores enable row level security;
alter table processamento.elementos enable row level security;
alter table processamento.evidencias enable row level security;
alter table processamento.relacoes_elementos enable row level security;

create policy vetores_selecionar_proprios on processamento.vetores for select to authenticated using ((select auth.uid()) = usuario_id);
create policy vetores_inserir_proprios on processamento.vetores for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy vetores_atualizar_proprios on processamento.vetores for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy vetores_excluir_proprios on processamento.vetores for delete to authenticated using ((select auth.uid()) = usuario_id);

create policy elementos_selecionar_proprios on processamento.elementos for select to authenticated using ((select auth.uid()) = usuario_id);
create policy elementos_inserir_proprios on processamento.elementos for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy elementos_atualizar_proprios on processamento.elementos for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy elementos_excluir_proprios on processamento.elementos for delete to authenticated using ((select auth.uid()) = usuario_id);

create policy evidencias_selecionar_proprias on processamento.evidencias for select to authenticated using ((select auth.uid()) = usuario_id);
create policy evidencias_inserir_proprias on processamento.evidencias for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy evidencias_atualizar_proprias on processamento.evidencias for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy evidencias_excluir_proprias on processamento.evidencias for delete to authenticated using ((select auth.uid()) = usuario_id);

create policy relacoes_elementos_selecionar_proprias on processamento.relacoes_elementos for select to authenticated using ((select auth.uid()) = usuario_id);
create policy relacoes_elementos_inserir_proprias on processamento.relacoes_elementos for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy relacoes_elementos_atualizar_proprias on processamento.relacoes_elementos for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy relacoes_elementos_excluir_proprias on processamento.relacoes_elementos for delete to authenticated using ((select auth.uid()) = usuario_id);

revoke all on all tables in schema processamento from public, anon, authenticated;
revoke all on all sequences in schema processamento from public, anon, authenticated;
revoke all on all functions in schema processamento from public, anon, authenticated;
