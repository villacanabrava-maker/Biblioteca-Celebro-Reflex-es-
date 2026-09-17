-- 0033_hardening_auditoria_ia
-- Torna explícita a negação de acesso direto e cobre FKs da auditoria com índices.

create policy execucoes_ia_negacao_direta
  on auditoria.execucoes_ia
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index execucoes_ia_prompt_idx on auditoria.execucoes_ia(versao_prompt_id);
create index execucoes_ia_taxonomia_idx on auditoria.execucoes_ia(versao_taxonomia_id);
create index execucoes_ia_pipeline_idx on auditoria.execucoes_ia(versao_pipeline_id);
