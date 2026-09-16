-- 0021_politica_negacao_artefatos_processamento
-- Torna explícito que artefatos intermediários são backend-only.
-- A policy não concede privilégios; grants de tabela/schema continuam revogados.

create policy artefatos_execucao_sem_acesso_cliente
on processamento.artefatos_execucao
for all
to anon, authenticated
using (false)
with check (false);
