-- 0048_auditoria_persistencia_relacoes_elementos
-- Auditoria/idempotência da criação de relações locais por fragmento.
-- A lista de elementos é congelada na reserva e a conclusão revalida tudo no
-- PostgreSQL antes de persistir em processamento.relacoes_elementos.

alter table auditoria.execucoes_ia
  drop constraint if exists execucoes_ia_operacao_check;

alter table auditoria.execucoes_ia
  add constraint execucoes_ia_operacao_check
  check (operacao in (
    'sintese_documental',
    'extracao_elementos_documentais',
    'normalizacao_taxonomica_elemento',
    'relacoes_elementos_locais'
  ));

create function aplicacao.backend_preparar_relacoes_elementos_ia(
  p_execucao_id uuid,
  p_fragmento_id uuid,
  p_modelo_ia_id uuid,
  p_versao_prompt_id uuid,
  p_hash_entrada text,
  p_elementos_ids uuid[]
)
returns table (
  auditoria_id uuid,
  estado text,
  tentativa integer,
  deve_chamar boolean,
  quantidade_relacoes integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_documento_id uuid;
  v_versao_pipeline_id uuid;
  v_versao_taxonomia_id uuid;
  v_fragmento_codigo text;
  v_chave text;
  v_auditoria auditoria.execucoes_ia%rowtype;
  v_ids_saida jsonb;
  v_quantidade integer;
begin
  if p_hash_entrada is null or p_hash_entrada !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'hash_entrada_relacoes_invalido' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_elementos_ids, '{}'::uuid[])) < 2 then
    raise exception 'relacoes_ia_exigem_ao_menos_dois_elementos' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_elementos_ids, '{}'::uuid[])) > 40 then
    raise exception 'relacoes_ia_elementos_excessivos' using errcode = '22023';
  end if;

  if (
    select count(*) <> count(distinct elemento_id)
    from unnest(coalesce(p_elementos_ids, '{}'::uuid[])) as elementos(elemento_id)
  ) then
    raise exception 'relacoes_ia_elementos_duplicados' using errcode = '22023';
  end if;

  select e.usuario_id, d.id, e.versao_pipeline_id, e.versao_taxonomia_id, f.codigo
    into v_usuario_id, v_documento_id, v_versao_pipeline_id, v_versao_taxonomia_id, v_fragmento_codigo
  from processamento.execucoes e
  join processamento.documentos_processados d
    on d.execucao_id = e.id
   and d.usuario_id = e.usuario_id
  join processamento.fragmentos f
    on f.documento_processado_id = d.id
   and f.usuario_id = d.usuario_id
   and f.id = p_fragmento_id
  where e.id = p_execucao_id;

  if v_usuario_id is null then
    raise exception 'fragmento_relacoes_nao_encontrado' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from sistema.modelos_ia m
    where m.id = p_modelo_ia_id
      and m.provedor = 'openai'
      and m.finalidade = 'analise'
      and m.ativo = true
  ) then
    raise exception 'modelo_ia_relacoes_invalido' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from sistema.versoes_prompts vp
    join sistema.prompts p on p.id = vp.prompt_id
    where vp.id = p_versao_prompt_id
      and vp.ativado_em is not null
      and p.codigo = 'relacoes_elementos_locais'
      and p.ativo = true
  ) then
    raise exception 'versao_prompt_relacoes_invalida' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(p_elementos_ids) as elementos(elemento_id)
    where not exists (
      select 1
      from processamento.elementos el
      join processamento.evidencias ev
        on ev.elemento_id = el.id
       and ev.usuario_id = el.usuario_id
       and ev.fragmento_id = p_fragmento_id
      where el.id = elementos.elemento_id
        and el.usuario_id = v_usuario_id
        and el.documento_processado_id = v_documento_id
    )
  ) then
    raise exception 'relacoes_ia_elemento_fora_do_fragmento' using errcode = '22023';
  end if;

  v_chave := encode(extensions.digest(
    concat_ws(
      '|',
      'relacoes_elementos_locais',
      p_execucao_id::text,
      p_fragmento_id::text,
      p_modelo_ia_id::text,
      p_versao_prompt_id::text,
      lower(p_hash_entrada)
    ),
    'sha256'
  ), 'hex');

  perform pg_advisory_xact_lock(hashtextextended(v_chave, 0));

  select * into v_auditoria
  from auditoria.execucoes_ia a
  where a.chave_idempotencia = v_chave
  for update;

  if found then
    if v_auditoria.referencias_entrada->'elementos_ids'
       is distinct from to_jsonb(p_elementos_ids) then
      raise exception 'relacoes_elementos_divergentes_da_reserva' using errcode = '55000';
    end if;

    if v_auditoria.estado = 'concluida' then
      v_ids_saida := v_auditoria.referencias_saida->'relacoes_ids';
      if v_ids_saida is null or jsonb_typeof(v_ids_saida) <> 'array' then
        raise exception 'relacoes_concluidas_sem_ids' using errcode = '55000';
      end if;

      select count(*) into v_quantidade
      from processamento.relacoes_elementos re
      where re.usuario_id = v_usuario_id
        and re.id in (
          select value::uuid
          from jsonb_array_elements_text(v_ids_saida) as ids(value)
        );

      if v_quantidade <> jsonb_array_length(v_ids_saida) then
        raise exception 'relacoes_concluidas_resultado_ausente' using errcode = '55000';
      end if;

      return query
      select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false, v_quantidade;
      return;
    end if;

    if v_auditoria.estado = 'reservada' then
      if v_auditoria.reservado_em < now() - interval '2 minutes' then
        update auditoria.execucoes_ia as a
        set reservado_em = now(), tentativa = a.tentativa + 1
        where a.id = v_auditoria.id
        returning a.* into v_auditoria;

        return query
        select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true, null::integer;
        return;
      end if;

      return query
      select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false, null::integer;
      return;
    end if;

    if v_auditoria.estado = 'em_execucao' then
      if v_auditoria.iniciado_em is not null
         and v_auditoria.iniciado_em < now() - interval '15 minutes' then
        update auditoria.execucoes_ia as a
        set estado = 'incerta',
            erro = 'execucao_interrompida_estado_incerto',
            concluido_em = now()
        where a.id = v_auditoria.id;

        return query
        select v_auditoria.id, 'incerta'::text, v_auditoria.tentativa, false, null::integer;
        return;
      end if;

      return query
      select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false, null::integer;
      return;
    end if;

    if v_auditoria.estado = 'falhou' and v_auditoria.tentativa < 3 then
      update auditoria.execucoes_ia as a
      set estado = 'reservada',
          reservado_em = now(),
          tentativa = a.tentativa + 1,
          tokens_entrada = null,
          tokens_saida = null,
          duracao_ms = null,
          custo_estimado = null,
          referencias_saida = '{}'::jsonb,
          erro = null,
          iniciado_em = null,
          concluido_em = null
      where a.id = v_auditoria.id
      returning a.* into v_auditoria;

      return query
      select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true, null::integer;
      return;
    end if;

    return query
    select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false, null::integer;
    return;
  end if;

  insert into auditoria.execucoes_ia (
    usuario_id,
    operacao,
    modelo_ia_id,
    versao_prompt_id,
    versao_taxonomia_id,
    versao_pipeline_id,
    estado,
    referencias_entrada,
    chave_idempotencia,
    reservado_em
  ) values (
    v_usuario_id,
    'relacoes_elementos_locais',
    p_modelo_ia_id,
    p_versao_prompt_id,
    v_versao_taxonomia_id,
    v_versao_pipeline_id,
    'reservada',
    jsonb_build_object(
      'execucao_id', p_execucao_id,
      'documento_processado_id', v_documento_id,
      'fragmento_id', p_fragmento_id,
      'fragmento_codigo', v_fragmento_codigo,
      'hash_entrada', lower(p_hash_entrada),
      'elementos_ids', to_jsonb(p_elementos_ids)
    ),
    v_chave,
    now()
  ) returning * into v_auditoria;

  return query
  select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true, null::integer;
end;
$$;

revoke all on function aplicacao.backend_preparar_relacoes_elementos_ia(uuid,uuid,uuid,uuid,text,uuid[])
  from public, anon, authenticated;
grant execute on function aplicacao.backend_preparar_relacoes_elementos_ia(uuid,uuid,uuid,uuid,text,uuid[])
  to service_role;

create function aplicacao.backend_concluir_relacoes_elementos_ia(
  p_auditoria_id uuid,
  p_relacoes jsonb,
  p_tokens_entrada integer,
  p_tokens_saida integer,
  p_duracao_ms bigint,
  p_custo_estimado numeric,
  p_response_id text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auditoria auditoria.execucoes_ia%rowtype;
  v_documento_id uuid;
  v_fragmento_id uuid;
  v_elementos_ids jsonb;
  v_item jsonb;
  v_origem_id uuid;
  v_destino_id uuid;
  v_tipo text;
  v_confianca numeric;
  v_justificativa text;
  v_relacao_id uuid;
  v_relacoes_ids jsonb := '[]'::jsonb;
  v_chaves text[] := '{}'::text[];
  v_chave_local text;
  v_quantidade integer := 0;
begin
  if p_relacoes is null or jsonb_typeof(p_relacoes) <> 'array' then
    raise exception 'relacoes_formato_invalido' using errcode = '22023';
  end if;
  if jsonb_array_length(p_relacoes) > 80 then
    raise exception 'relacoes_quantidade_excessiva' using errcode = '22023';
  end if;
  if p_tokens_entrada is not null and p_tokens_entrada < 0 then
    raise exception 'tokens_entrada_invalidos' using errcode = '22023';
  end if;
  if p_tokens_saida is not null and p_tokens_saida < 0 then
    raise exception 'tokens_saida_invalidos' using errcode = '22023';
  end if;
  if p_duracao_ms is not null and p_duracao_ms < 0 then
    raise exception 'duracao_ia_invalida' using errcode = '22023';
  end if;
  if p_custo_estimado is not null and p_custo_estimado < 0 then
    raise exception 'custo_ia_invalido' using errcode = '22023';
  end if;

  select * into v_auditoria
  from auditoria.execucoes_ia
  where id = p_auditoria_id
  for update;

  if not found then
    raise exception 'execucao_ia_nao_encontrada' using errcode = 'P0002';
  end if;

  if v_auditoria.operacao <> 'relacoes_elementos_locais' then
    raise exception 'execucao_ia_operacao_invalida_para_relacoes' using errcode = '55000';
  end if;

  if v_auditoria.estado = 'concluida' then
    return coalesce((v_auditoria.referencias_saida->>'quantidade_relacoes')::integer, 0);
  end if;

  if v_auditoria.estado <> 'em_execucao' then
    raise exception 'execucao_ia_estado_invalido_para_conclusao' using errcode = '55000';
  end if;

  v_documento_id := (v_auditoria.referencias_entrada->>'documento_processado_id')::uuid;
  v_fragmento_id := (v_auditoria.referencias_entrada->>'fragmento_id')::uuid;
  v_elementos_ids := v_auditoria.referencias_entrada->'elementos_ids';

  if v_elementos_ids is null or jsonb_typeof(v_elementos_ids) <> 'array' then
    raise exception 'relacoes_elementos_auditados_invalidos' using errcode = '55000';
  end if;

  for v_item in
    select value from jsonb_array_elements(p_relacoes)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'relacao_formato_invalido' using errcode = '22023';
    end if;

    if exists (
      select 1
      from jsonb_object_keys(v_item) as k(chave)
      where k.chave not in (
        'elemento_origem_id', 'tipo_relacao', 'elemento_destino_id',
        'confianca', 'justificativa'
      )
    ) then
      raise exception 'relacao_campos_inesperados' using errcode = '22023';
    end if;

    begin
      v_origem_id := (v_item->>'elemento_origem_id')::uuid;
      v_destino_id := (v_item->>'elemento_destino_id')::uuid;
    exception when invalid_text_representation then
      raise exception 'relacao_elemento_id_invalido' using errcode = '22023';
    end;

    v_tipo := v_item->>'tipo_relacao';
    v_confianca := (v_item->>'confianca')::numeric;
    v_justificativa := trim(v_item->>'justificativa');

    if v_origem_id = v_destino_id then
      raise exception 'relacao_reflexiva' using errcode = '22023';
    end if;

    if v_tipo not in (
      'sustenta', 'contradiz', 'expande', 'deriva_de', 'exemplifica',
      'questiona', 'responde_a', 'evolui_para', 'associa_se_a', 'reformula'
    ) then
      raise exception 'tipo_relacao_invalido' using errcode = '22023';
    end if;

    if v_confianca is null or v_confianca < 0 or v_confianca > 1 then
      raise exception 'confianca_relacao_invalida' using errcode = '22023';
    end if;

    if v_justificativa is null or length(v_justificativa) = 0 or length(v_justificativa) > 1200 then
      raise exception 'justificativa_relacao_invalida' using errcode = '22023';
    end if;

    if not exists (
      select 1 from jsonb_array_elements_text(v_elementos_ids) as ids(valor)
      where ids.valor::uuid = v_origem_id
    ) or not exists (
      select 1 from jsonb_array_elements_text(v_elementos_ids) as ids(valor)
      where ids.valor::uuid = v_destino_id
    ) then
      raise exception 'relacao_elemento_fora_da_lista_auditada' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from processamento.elementos el
      join processamento.evidencias ev
        on ev.elemento_id = el.id
       and ev.usuario_id = el.usuario_id
       and ev.fragmento_id = v_fragmento_id
      where el.id = v_origem_id
        and el.usuario_id = v_auditoria.usuario_id
        and el.documento_processado_id = v_documento_id
    ) or not exists (
      select 1
      from processamento.elementos el
      join processamento.evidencias ev
        on ev.elemento_id = el.id
       and ev.usuario_id = el.usuario_id
       and ev.fragmento_id = v_fragmento_id
      where el.id = v_destino_id
        and el.usuario_id = v_auditoria.usuario_id
        and el.documento_processado_id = v_documento_id
    ) then
      raise exception 'relacao_elemento_sem_evidencia_no_fragmento' using errcode = '22023';
    end if;

    v_chave_local := v_origem_id::text || '|' || v_tipo || '|' || v_destino_id::text;
    if v_chave_local = any(v_chaves) then
      raise exception 'relacao_duplicada_no_payload' using errcode = '22023';
    end if;
    v_chaves := array_append(v_chaves, v_chave_local);

    v_relacao_id := null;
    insert into processamento.relacoes_elementos (
      usuario_id,
      elemento_origem_id,
      tipo_relacao,
      elemento_destino_id,
      confianca,
      justificativa
    ) values (
      v_auditoria.usuario_id,
      v_origem_id,
      v_tipo,
      v_destino_id,
      v_confianca,
      v_justificativa
    ) on conflict (usuario_id, elemento_origem_id, tipo_relacao, elemento_destino_id)
      do nothing
    returning id into v_relacao_id;

    if v_relacao_id is null then
      select re.id into v_relacao_id
      from processamento.relacoes_elementos re
      where re.usuario_id = v_auditoria.usuario_id
        and re.elemento_origem_id = v_origem_id
        and re.tipo_relacao = v_tipo
        and re.elemento_destino_id = v_destino_id;
    end if;

    if v_relacao_id is null then
      raise exception 'relacao_nao_persistida' using errcode = '55000';
    end if;

    v_relacoes_ids := v_relacoes_ids || jsonb_build_array(v_relacao_id);
    v_quantidade := v_quantidade + 1;
  end loop;

  update auditoria.execucoes_ia
  set estado = 'concluida',
      tokens_entrada = p_tokens_entrada,
      tokens_saida = p_tokens_saida,
      duracao_ms = p_duracao_ms,
      custo_estimado = p_custo_estimado,
      referencias_saida = jsonb_build_object(
        'fragmento_id', v_fragmento_id,
        'relacoes_ids', v_relacoes_ids,
        'quantidade_relacoes', v_quantidade,
        'response_id', p_response_id
      ),
      concluido_em = now(),
      erro = null
  where id = p_auditoria_id;

  return v_quantidade;
end;
$$;

revoke all on function aplicacao.backend_concluir_relacoes_elementos_ia(
  uuid,jsonb,integer,integer,bigint,numeric,text
) from public, anon, authenticated;
grant execute on function aplicacao.backend_concluir_relacoes_elementos_ia(
  uuid,jsonb,integer,integer,bigint,numeric,text
) to service_role;

create function aplicacao.backend_obter_relacoes_elementos_auditadas(
  p_execucao_id uuid,
  p_fragmento_id uuid,
  p_modelo_ia_id uuid,
  p_versao_prompt_id uuid,
  p_hash_entrada text
)
returns table (
  auditoria_id uuid,
  quantidade_relacoes integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_chave text;
  v_auditoria auditoria.execucoes_ia%rowtype;
  v_ids jsonb;
  v_quantidade integer;
begin
  if p_hash_entrada is null or p_hash_entrada !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'hash_entrada_relacoes_invalido' using errcode = '22023';
  end if;

  select e.usuario_id into v_usuario_id
  from processamento.execucoes e
  join processamento.documentos_processados d
    on d.execucao_id = e.id
   and d.usuario_id = e.usuario_id
  join processamento.fragmentos f
    on f.documento_processado_id = d.id
   and f.usuario_id = d.usuario_id
   and f.id = p_fragmento_id
  where e.id = p_execucao_id;

  if v_usuario_id is null then
    raise exception 'fragmento_relacoes_nao_encontrado' using errcode = 'P0002';
  end if;

  v_chave := encode(extensions.digest(
    concat_ws(
      '|',
      'relacoes_elementos_locais',
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

  v_ids := v_auditoria.referencias_saida->'relacoes_ids';
  if v_ids is null or jsonb_typeof(v_ids) <> 'array' then
    raise exception 'relacoes_concluidas_sem_ids' using errcode = '55000';
  end if;

  select count(*) into v_quantidade
  from processamento.relacoes_elementos re
  where re.usuario_id = v_usuario_id
    and re.id in (
      select value::uuid
      from jsonb_array_elements_text(v_ids) as ids(value)
    );

  if v_quantidade <> jsonb_array_length(v_ids) then
    raise exception 'relacoes_concluidas_resultado_ausente' using errcode = '55000';
  end if;

  return query select v_auditoria.id, v_quantidade;
end;
$$;

revoke all on function aplicacao.backend_obter_relacoes_elementos_auditadas(uuid,uuid,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function aplicacao.backend_obter_relacoes_elementos_auditadas(uuid,uuid,uuid,uuid,text)
  to service_role;

-- Guardrails das RPCs caras/auditadas.
do $$
begin
  if has_function_privilege(
    'anon',
    'aplicacao.backend_preparar_relacoes_elementos_ia(uuid,uuid,uuid,uuid,text,uuid[])',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_preparar_relacoes_elementos_ia(uuid,uuid,uuid,uuid,text,uuid[])',
    'EXECUTE'
  ) then
    raise exception 'rpc_preparar_relacoes_exposta_ao_cliente';
  end if;

  if has_function_privilege(
    'anon',
    'aplicacao.backend_concluir_relacoes_elementos_ia(uuid,jsonb,integer,integer,bigint,numeric,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_concluir_relacoes_elementos_ia(uuid,jsonb,integer,integer,bigint,numeric,text)',
    'EXECUTE'
  ) then
    raise exception 'rpc_concluir_relacoes_exposta_ao_cliente';
  end if;

  if has_function_privilege(
    'anon',
    'aplicacao.backend_obter_relacoes_elementos_auditadas(uuid,uuid,uuid,uuid,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_obter_relacoes_elementos_auditadas(uuid,uuid,uuid,uuid,text)',
    'EXECUTE'
  ) then
    raise exception 'rpc_replay_relacoes_exposta_ao_cliente';
  end if;
end $$;
