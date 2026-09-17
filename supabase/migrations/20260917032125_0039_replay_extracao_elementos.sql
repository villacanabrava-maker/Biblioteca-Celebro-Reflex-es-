-- 0039_replay_extracao_elementos
-- Replay de etapa concluída deve somente verificar resultado já persistido.
-- Nunca cria uma nova reserva de IA quando a etapa não permite criação.

create function aplicacao.backend_obter_extracao_elementos_auditada(
  p_execucao_id uuid,
  p_fragmento_id uuid,
  p_modelo_ia_id uuid,
  p_versao_prompt_id uuid,
  p_hash_entrada text
)
returns table (
  auditoria_id uuid,
  quantidade_elementos integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_documento_id uuid;
  v_chave text;
  v_auditoria auditoria.execucoes_ia%rowtype;
  v_ids jsonb;
  v_quantidade integer;
begin
  if p_hash_entrada is null or p_hash_entrada !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'hash_entrada_extracao_elementos_invalido' using errcode = '22023';
  end if;

  select e.usuario_id, d.id
    into v_usuario_id, v_documento_id
  from processamento.execucoes e
  join processamento.documentos_processados d
    on d.execucao_id = e.id
   and d.usuario_id = e.usuario_id
  join processamento.fragmentos f
    on f.documento_processado_id = d.id
   and f.usuario_id = d.usuario_id
   and f.id = p_fragmento_id
  where e.id = p_execucao_id;

  if v_documento_id is null then
    raise exception 'fragmento_extracao_elementos_nao_encontrado' using errcode = 'P0002';
  end if;

  v_chave := encode(extensions.digest(
    concat_ws(
      '|',
      'extracao_elementos_documentais',
      p_execucao_id::text,
      p_fragmento_id::text,
      p_modelo_ia_id::text,
      p_versao_prompt_id::text,
      lower(p_hash_entrada)
    ),
    'sha256'
  ), 'hex');

  select * into v_auditoria
  from auditoria.execucoes_ia a
  where a.chave_idempotencia = v_chave
    and a.estado = 'concluida';

  if not found then
    return;
  end if;

  v_ids := v_auditoria.referencias_saida->'elementos_ids';
  if v_ids is null or jsonb_typeof(v_ids) <> 'array' then
    raise exception 'extracao_elementos_concluida_sem_ids' using errcode = '55000';
  end if;

  select count(*) into v_quantidade
  from processamento.elementos el
  where el.documento_processado_id = v_documento_id
    and el.usuario_id = v_usuario_id
    and el.id in (
      select value::uuid
      from jsonb_array_elements_text(v_ids) as ids(value)
    );

  if v_quantidade <> jsonb_array_length(v_ids) then
    raise exception 'extracao_elementos_concluida_resultado_ausente' using errcode = '55000';
  end if;

  if exists (
    select 1
    from processamento.elementos el
    where el.documento_processado_id = v_documento_id
      and el.usuario_id = v_usuario_id
      and el.id in (
        select value::uuid
        from jsonb_array_elements_text(v_ids) as ids(value)
      )
      and not exists (
        select 1
        from processamento.evidencias ev
        where ev.elemento_id = el.id
          and ev.usuario_id = v_usuario_id
          and ev.fragmento_id = p_fragmento_id
      )
  ) then
    raise exception 'extracao_elementos_concluida_evidencia_ausente' using errcode = '55000';
  end if;

  return query select v_auditoria.id, v_quantidade;
end;
$$;

revoke all on function aplicacao.backend_obter_extracao_elementos_auditada(uuid,uuid,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function aplicacao.backend_obter_extracao_elementos_auditada(uuid,uuid,uuid,uuid,text)
  to service_role;
