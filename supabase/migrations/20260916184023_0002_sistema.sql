-- 0002_sistema
-- Catálogo técnico de modelos, prompts, pipelines e preferências não secretas.
-- Fonte funcional: Dicionário Mestre de Dados e Taxonomia v1.0, seção 9.

begin;

create table sistema.modelos_ia (
  id uuid primary key default gen_random_uuid(),
  provedor text not null,
  identificador_modelo text not null,
  apelido text,
  finalidade text not null,
  dimensoes_embedding integer,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint modelos_ia_finalidade_check check (
    finalidade in ('extracao', 'analise', 'taxonomia', 'cerebro', 'redacao', 'auditoria', 'embedding')
  ),
  constraint modelos_ia_dimensoes_embedding_check check (
    dimensoes_embedding is null or dimensoes_embedding > 0
  ),
  constraint modelos_ia_identidade_unica unique (provedor, identificador_modelo, finalidade)
);

comment on table sistema.modelos_ia is
  'Catálogo técnico de modelos disponíveis. Não contém chaves de API nem outros segredos.';
comment on column sistema.modelos_ia.finalidade is
  'Função lógica do modelo: extracao, analise, taxonomia, cerebro, redacao, auditoria ou embedding.';
comment on column sistema.modelos_ia.dimensoes_embedding is
  'Dimensionalidade quando a finalidade for embedding. Nula para modelos não vetoriais.';

create table sistema.prompts (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  finalidade text not null,
  ativo boolean not null default true
);

comment on table sistema.prompts is
  'Identidade lógica e estável de cada prompt. O conteúdo vive em versões imutáveis e também é versionado no GitHub.';

create table sistema.versoes_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references sistema.prompts(id) on delete restrict,
  numero_versao integer not null,
  conteudo text not null,
  schema_saida jsonb,
  hash_conteudo text not null,
  criado_em timestamptz not null default now(),
  ativado_em timestamptz,
  constraint versoes_prompts_numero_check check (numero_versao >= 1),
  constraint versoes_prompts_numero_unico unique (prompt_id, numero_versao),
  constraint versoes_prompts_hash_unico unique (prompt_id, hash_conteudo)
);

comment on table sistema.versoes_prompts is
  'Versões operacionais imutáveis de prompts, incluindo schema de saída quando aplicável e hash para rastreabilidade.';
comment on column sistema.versoes_prompts.schema_saida is
  'JSON Schema esperado quando o prompt produz dado estruturado; pode ser nulo quando não se aplica.';

create table sistema.versoes_pipeline (
  id uuid primary key default gen_random_uuid(),
  numero_versao text not null unique,
  descricao text,
  hash_configuracao text not null unique,
  estado text not null default 'rascunho',
  criado_em timestamptz not null default now(),
  ativado_em timestamptz,
  constraint versoes_pipeline_estado_check check (
    estado in ('rascunho', 'ativa', 'arquivada', 'invalidada')
  )
);

comment on table sistema.versoes_pipeline is
  'Versões rastreáveis da configuração do pipeline documental. numero_versao é texto para permitir versionamento semântico como 1.0 ou 2.1.';
comment on column sistema.versoes_pipeline.estado is
  'Estado técnico definido nesta implementação: rascunho, ativa, arquivada ou invalidada.';

create table sistema.configuracoes_usuario (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  idioma_preferencial text not null default 'pt-BR',
  comportamento_recuperacao text not null default 'adaptativo',
  nivel_detalhamento text not null default 'equilibrado',
  exigir_aprovacao_manual boolean not null default true,
  preferencias_visuais jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint configuracoes_usuario_preferencias_visuais_objeto_check check (
    jsonb_typeof(preferencias_visuais) = 'object'
  )
);

comment on table sistema.configuracoes_usuario is
  'Preferências seguras e não secretas do usuário. Segredos nunca devem ser persistidos nesta tabela.';
comment on column sistema.configuracoes_usuario.preferencias_visuais is
  'Metadados visuais flexíveis e auxiliares. Preferências comportamentais importantes permanecem em colunas próprias.';

alter table sistema.configuracoes_usuario enable row level security;

create policy configuracoes_usuario_selecionar_proprias
  on sistema.configuracoes_usuario
  for select
  to authenticated
  using ((select auth.uid()) = usuario_id);

create policy configuracoes_usuario_inserir_proprias
  on sistema.configuracoes_usuario
  for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy configuracoes_usuario_atualizar_proprias
  on sistema.configuracoes_usuario
  for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy configuracoes_usuario_excluir_proprias
  on sistema.configuracoes_usuario
  for delete
  to authenticated
  using ((select auth.uid()) = usuario_id);

-- Os schemas internos continuam fora da superfície direta da Data API.
-- As policies acima são uma segunda barreira e preparam acesso seguro futuro.
revoke all on all tables in schema sistema from public, anon, authenticated;
revoke all on all sequences in schema sistema from public, anon, authenticated;
revoke all on all functions in schema sistema from public, anon, authenticated;

commit;
