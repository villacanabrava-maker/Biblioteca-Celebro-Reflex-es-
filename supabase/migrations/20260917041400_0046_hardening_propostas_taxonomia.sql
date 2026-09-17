-- 0046_hardening_propostas_taxonomia
-- Torna explícita a negação de acesso direto às tabelas internas de propostas
-- e cobre integralmente as FKs adicionadas pela fundação taxonômica.

create policy propostas_conceitos_negacao_direta
  on taxonomia.propostas_conceitos
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy fontes_propostas_conceitos_negacao_direta
  on taxonomia.fontes_propostas_conceitos
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index fontes_propostas_conceito_usuario_cobertura_idx
  on taxonomia.fontes_propostas_conceitos(proposta_conceito_id, usuario_id);

create index fontes_propostas_elemento_usuario_cobertura_idx
  on taxonomia.fontes_propostas_conceitos(elemento_id, usuario_id);

create index propostas_conceitos_modelo_ia_idx
  on taxonomia.propostas_conceitos(modelo_ia_id);

create index propostas_conceitos_prompt_idx
  on taxonomia.propostas_conceitos(versao_prompt_id);

-- Guardrails: as tabelas continuam fechadas ao cliente e as policies de negação
-- ficam registradas explicitamente para auditoria.
do $$
declare
  v_policies integer;
begin
  select count(*) into v_policies
  from pg_policies
  where schemaname = 'taxonomia'
    and tablename in ('propostas_conceitos', 'fontes_propostas_conceitos')
    and policyname in (
      'propostas_conceitos_negacao_direta',
      'fontes_propostas_conceitos_negacao_direta'
    );

  if v_policies <> 2 then
    raise exception 'politicas_negacao_propostas_taxonomia_ausentes';
  end if;

  if has_table_privilege('anon', 'taxonomia.propostas_conceitos', 'SELECT')
     or has_table_privilege('authenticated', 'taxonomia.propostas_conceitos', 'SELECT')
     or has_table_privilege('anon', 'taxonomia.fontes_propostas_conceitos', 'SELECT')
     or has_table_privilege('authenticated', 'taxonomia.fontes_propostas_conceitos', 'SELECT') then
    raise exception 'tabelas_propostas_taxonomia_expostas_ao_cliente';
  end if;
end $$;
