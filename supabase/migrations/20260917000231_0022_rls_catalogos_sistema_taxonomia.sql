-- 0022_rls_catalogos_sistema_taxonomia
-- Habilita RLS nas tabelas de catálogo global (sistema/taxonomia) apontadas
-- pelo advisor de segurança do Supabase como "RLS disabled".
--
-- Contexto: essas 8 tabelas não possuem usuario_id (são catálogos globais,
-- não dados pessoais) e desde a 0001_fundacao o schema já nega todo acesso
-- a anon/authenticated por REVOKE. Portanto o advisor descreve um cenário
-- que hoje não é alcançável via Data API. Mesmo assim, RLS é habilitado
-- aqui como segunda camada independente (defesa em profundidade): se um dia
-- um GRANT de schema for concedido por engano, a policy ainda impede
-- escrita e limita leitura a authenticated, coerente com a seção 14 do
-- Dicionário Mestre ("tabelas globais do sistema... somente leitura para
-- usuários autenticados"). Nenhum GRANT de schema/tabela é concedido nesta
-- migration: a exposição real continuará ocorrendo apenas por view/RPC
-- controlada em aplicacao (ADR-017), quando houver necessidade de produto.

begin;

alter table sistema.modelos_ia enable row level security;
alter table sistema.prompts enable row level security;
alter table sistema.versoes_prompts enable row level security;
alter table sistema.versoes_pipeline enable row level security;
alter table taxonomia.versoes enable row level security;
alter table taxonomia.conceitos enable row level security;
alter table taxonomia.termos enable row level security;
alter table taxonomia.relacoes enable row level security;

-- Somente leitura para authenticated; nenhuma policy de insert/update/delete
-- é criada, portanto essas operações permanecem bloqueadas para anon e
-- authenticated. anon não recebe nenhuma policy, portanto também não lê.
-- service_role continua sem restrição de RLS (comportamento padrão do Postgres/Supabase).

create policy modelos_ia_leitura_autenticada
  on sistema.modelos_ia
  for select
  to authenticated
  using (true);

create policy prompts_leitura_autenticada
  on sistema.prompts
  for select
  to authenticated
  using (true);

create policy versoes_prompts_leitura_autenticada
  on sistema.versoes_prompts
  for select
  to authenticated
  using (true);

create policy versoes_pipeline_leitura_autenticada
  on sistema.versoes_pipeline
  for select
  to authenticated
  using (true);

create policy taxonomia_versoes_leitura_autenticada
  on taxonomia.versoes
  for select
  to authenticated
  using (true);

create policy taxonomia_conceitos_leitura_autenticada
  on taxonomia.conceitos
  for select
  to authenticated
  using (true);

create policy taxonomia_termos_leitura_autenticada
  on taxonomia.termos
  for select
  to authenticated
  using (true);

create policy taxonomia_relacoes_leitura_autenticada
  on taxonomia.relacoes
  for select
  to authenticated
  using (true);

comment on policy modelos_ia_leitura_autenticada on sistema.modelos_ia is
  'Segunda camada de defesa; exposição real via Data API continua fechada pelo REVOKE de schema (0001) até existir view/RPC própria em aplicacao.';

-- Validação estrutural da própria migration.
do $$
declare
  v_sem_rls integer;
  v_policies integer;
begin
  select count(*) into v_sem_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where (n.nspname, c.relname) in (
    ('sistema', 'modelos_ia'),
    ('sistema', 'prompts'),
    ('sistema', 'versoes_prompts'),
    ('sistema', 'versoes_pipeline'),
    ('taxonomia', 'versoes'),
    ('taxonomia', 'conceitos'),
    ('taxonomia', 'termos'),
    ('taxonomia', 'relacoes')
  )
  and c.relrowsecurity is not true;

  if v_sem_rls <> 0 then
    raise exception 'Esperado RLS ativo nas 8 tabelas de catálogo, % ainda sem RLS', v_sem_rls;
  end if;

  select count(*) into v_policies
  from pg_policies
  where (schemaname, tablename) in (
    ('sistema', 'modelos_ia'),
    ('sistema', 'prompts'),
    ('sistema', 'versoes_prompts'),
    ('sistema', 'versoes_pipeline'),
    ('taxonomia', 'versoes'),
    ('taxonomia', 'conceitos'),
    ('taxonomia', 'termos'),
    ('taxonomia', 'relacoes')
  );

  if v_policies <> 8 then
    raise exception 'Esperadas 8 policies de leitura autenticada, encontradas %', v_policies;
  end if;
end $$;

commit;
