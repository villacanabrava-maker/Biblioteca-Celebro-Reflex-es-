-- 0001_fundacao
-- Fundação mínima e reversível do Cérebro Autoral.
-- Não cria tabelas de domínio.

begin;

-- Extensões necessárias para busca e recuperação futura.
create extension if not exists vector with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Schemas canônicos da aplicação.
create schema if not exists sistema;
create schema if not exists taxonomia;
create schema if not exists biblioteca;
create schema if not exists processamento;
create schema if not exists cerebro_autoral;
create schema if not exists reflexoes;
create schema if not exists auditoria;
create schema if not exists aplicacao;

comment on schema sistema is 'Configuração, versões e metadados técnicos do sistema.';
comment on schema taxonomia is 'Vocabulários intelectuais versionados, conceitos, termos e relações.';
comment on schema biblioteca is 'Acervo original, obras e versões preservadas.';
comment on schema processamento is 'Representações processadas, fragmentos, evidências, vetores e relações.';
comment on schema cerebro_autoral is 'Versões, dimensões, características, metodologias, regras e evidências autorais.';
comment on schema reflexoes is 'Fluxo de criação, contexto, planos, versões, revisões e incorporações de reflexões.';
comment on schema auditoria is 'Execuções, eventos, observabilidade, custo e proveniência técnica.';
comment on schema aplicacao is 'Camada controlada de views e RPCs expostas à aplicação quando necessário.';

-- Negação explícita por padrão. Permissões serão concedidas por migration
-- específica, apenas quando existirem tabelas/views e políticas testadas.
revoke all on schema sistema from public, anon, authenticated;
revoke all on schema taxonomia from public, anon, authenticated;
revoke all on schema biblioteca from public, anon, authenticated;
revoke all on schema processamento from public, anon, authenticated;
revoke all on schema cerebro_autoral from public, anon, authenticated;
revoke all on schema reflexoes from public, anon, authenticated;
revoke all on schema auditoria from public, anon, authenticated;
revoke all on schema aplicacao from public, anon, authenticated;

commit;
