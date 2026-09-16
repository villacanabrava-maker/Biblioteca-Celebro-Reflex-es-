-- 0015_integridade_proveniencia_publicacao
-- Evidências só podem apontar para fragmentos do mesmo Documento Processado.
-- Documento Processado ativo exige timestamp de publicação.

alter table processamento.documentos_processados
  add constraint documentos_processados_publicacao_ativa_check
  check (estado <> 'ativo' or publicado_em is not null);

create function processamento.validar_evidencia_mesmo_documento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  documento_elemento uuid;
  documento_fragmento uuid;
begin
  select e.documento_processado_id
    into documento_elemento
  from processamento.elementos e
  where e.id = new.elemento_id
    and e.usuario_id = new.usuario_id;

  select f.documento_processado_id
    into documento_fragmento
  from processamento.fragmentos f
  where f.id = new.fragmento_id
    and f.usuario_id = new.usuario_id;

  if documento_elemento is null or documento_fragmento is null then
    raise exception using errcode = '23503', message = 'evidencia_referencia_invalida';
  end if;

  if documento_elemento <> documento_fragmento then
    raise exception using errcode = '23514', message = 'evidencia_deve_referenciar_fragmento_do_mesmo_documento';
  end if;

  return new;
end;
$$;

revoke all on function processamento.validar_evidencia_mesmo_documento()
  from public, anon, authenticated;

create trigger evidencias_mesmo_documento_trigger
before insert or update of usuario_id, elemento_id, fragmento_id
on processamento.evidencias
for each row
execute function processamento.validar_evidencia_mesmo_documento();
