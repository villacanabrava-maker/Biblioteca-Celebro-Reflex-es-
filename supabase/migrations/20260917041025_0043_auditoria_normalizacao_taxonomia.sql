-- 0043_auditoria_normalizacao_taxonomia
-- Auditoria/idempotencia dos casos de normalizacao taxonomica que realmente usam IA.
-- A shortlist de conceitos e congelada na reserva; a conclusao so pode reutilizar
-- um conceito que estivesse nessa shortlist e continue ativo na mesma versao.

alter table auditoria.execucoes_ia
  drop constraint if exists execucoes_ia_operacao_check;

alter table auditoria.execucoes_ia
  add constraint execucoes_ia_operacao_check
  check (operacao in (
    'sintese_documental',
    'extracao_elementos_documentais',
    'normalizacao_taxonomica_elemento'
  ));

create function aplicacao.backend_preparar_normalizacao_taxonomia_ia(
  p_execucao_id uuid,
  p_elemento_id uuid,
  p_modelo_ia_id uuid,
  p_versao_prompt_id uuid,
  p_hash_entrada text,
  p_candidatos_ids uuid[] default '{}'::uuid[]
)
returns table (
  auditoria_id uuid,
  estado text,
  tentativa integer,
  deve_chamar boolean,
  tipo_resultado text,
  referencia_id uuid
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
  v_elemento_codigo text;
  v_chave text;
  v_auditoria auditoria.execucoes_ia%rowtype;
  v_tipo_resultado text;
  v_referencia_id uuid;
begin
  if p_hash_entrada is null or p_hash_entrada !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'hash_entrada_normalizacao_taxonomia_invalido' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_candidatos_ids, '{}'::uuid[])) > 20 then
    raise exception 'shortlist_taxonomia_excessiva' using errcode = '22023';
  end if;

  if (
    select count(*) <> count(distinct candidato_id)
    from unnest(coalesce(p_candidatos_ids, '{}'::uuid[])) as candidatos(candidato_id)
  ) then
    raise exception 'shortlist_taxonomia_com_duplicatas' using errcode = '22023';
  end if;

  select e.usuario_id, d.id, e.versao_pipeline_id, e.versao_taxonomia_id, el.codigo
    into v_usuario_id, v_documento_id, v_versao_pipeline_id, v_versao_taxonomia_id, v_elemento_codigo
  from processamento.execucoes e
  join processamento.documentos_processados d
    on d.execucao_id = e.id
   and d.usuario_id = e.usuario_id
  join processamento.elementos el
    on el.documento_processado_id = d.id
   and el.usuario_id = d.usuario_id
   and el.id = p_elemento_id
  where e.id = p_execucao_id;

  if v_usuario_id is null then
    raise exception 'elemento_normalizacao_nao_encontrado' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from sistema.modelos_ia m
    where m.id = p_modelo_ia_id
      and m.provedor = 'openai'
      and m.finalidade = 'taxonomia'
      and m.ativo = true
  ) then
    raise exception 'modelo_ia_taxonomia_invalido' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from sistema.versoes_prompts vp
    join sistema.prompts p on p.id = vp.prompt_id
    where vp.id = p_versao_prompt_id
      and vp.ativado_em is not null
      and p.codigo = 'normalizacao_elemento_taxonomia'
      and p.ativo = true
  ) then
    raise exception 'versao_prompt_taxonomia_invalida' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_candidatos_ids, '{}'::uuid[])) as candidatos(candidato_id)
    where not exists (
      select 1
      from taxonomia.conceitos c
      where c.id = candidatos.candidato_id
        and c.versao_taxonomia_id = v_versao_taxonomia_id
        and c.estado = 'ativo'
    )
  ) then
    raise exception 'shortlist_taxonomia_contem_conceito_invalido' using errcode = '22023';
  end if;

  v_chave := encode(extensions.digest(
    concat_ws(
      '|',
      'normalizacao_taxonomica_elemento',
      p_execucao_id::text,
      p_elemento_id::text,
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
    if v_auditoria.referencias_entrada->'candidatos_ids'
       is distinct from to_jsonb(coalesce(p_candidatos_ids, '{}'::uuid[])) then
      raise exception 'shortlist_taxonomia_divergente_da_reserva' using errcode = '55000';
    end if;

    if v_auditoria.estado = 'concluida' then
      v_tipo_resultado := v_auditoria.referencias_saida->>'tipo_resultado';
      v_referencia_id := nullif(v_auditoria.referencias_saida->>'referencia_id', '')::uuid;

      if v_tipo_resultado = 'classificacao' then
        if v_referencia_id is null or not exists (
          select 1
          from taxonomia.classificacoes_elementos ce
          where ce.id = v_referencia_id
            and ce.usuario_id = v_usuario_id
            and ce.elemento_id = p_elemento_id
        ) then
          raise exception 'normalizacao_taxonomia_concluida_classificacao_ausente' using errcode = '55000';
        end if;
      elsif v_tipo_resultado = 'proposta' then
        if v_referencia_id is null or not exists (
          select 1
          from taxonomia.fontes_propostas_conceitos fp
          where fp.usuario_id = v_usuario_id
            and fp.elemento_id = p_elemento_id
            and fp.proposta_conceito_id = v_referencia_id
        ) then
          raise exception 'normalizacao_taxonomia_concluida_proposta_ausente' using errcode = '55000';
        end if;
      else
        raise exception 'normalizacao_taxonomia_concluida_resultado_invalido' using errcode = '55000';
      end if;

      return query
      select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false,
             v_tipo_resultado, v_referencia_id;
      return;
    end if;

    if v_auditoria.estado = 'reservada' then
      if v_auditoria.reservado_em < now() - interval '2 minutes' then
        update auditoria.execucoes_ia as a
        set reservado_em = now(), tentativa = a.tentativa + 1
        where a.id = v_auditoria.id
        returning a.* into v_auditoria;

        return query
        select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true,
               null::text, null::uuid;
        return;
      end if;

      return query
      select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false,
             null::text, null::uuid;
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
        select v_auditoria.id, 'incerta'::text, v_auditoria.tentativa, false,
               null::text, null::uuid;
        return;
      end if;

      return query
      select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false,
             null::text, null::uuid;
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
      select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true,
             null::text, null::uuid;
      return;
    end if;

    return query
    select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false,
           null::text, null::uuid;
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
    'normalizacao_taxonomica_elemento',
    p_modelo_ia_id,
    p_versao_prompt_id,
    v_versao_taxonomia_id,
    v_versao_pipeline_id,
    'reservada',
    jsonb_build_object(
      'execucao_id', p_execucao_id,
      'documento_processado_id', v_documento_id,
      'elemento_id', p_elemento_id,
      'elemento_codigo', v_elemento_codigo,
      'hash_entrada', lower(p_hash_entrada),
      'candidatos_ids', to_jsonb(coalesce(p_candidatos_ids, '{}'::uuid[]))
    ),
    v_chave,
    now()
  ) returning * into v_auditoria;

  return query
  select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true,
         null::text, null::uuid;
end;
$$;

revoke all on function aplicacao.backend_preparar_normalizacao_taxonomia_ia(uuid,uuid,uuid,uuid,text,uuid[])
  from public, anon, authenticated;
grant execute on function aplicacao.backend_preparar_normalizacao_taxonomia_ia(uuid,uuid,uuid,uuid,text,uuid[])
  to service_role;

create function aplicacao.backend_concluir_normalizacao_taxonomia_ia(
  p_auditoria_id uuid,
  p_decisao text,
  p_conceito_id uuid,
  p_proposta jsonb,
  p_papel text,
  p_confianca numeric,
  p_justificativa text,
  p_tokens_entrada integer,
  p_tokens_saida integer,
  p_duracao_ms bigint,
  p_custo_estimado numeric,
  p_response_id text
)
returns table (
  tipo_resultado text,
  referencia_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auditoria auditoria.execucoes_ia%rowtype;
  v_execucao_id uuid;
  v_elemento_id uuid;
  v_candidatos_ids jsonb;
  v_classificacao_id uuid;
  v_proposta_id uuid;
  v_termo_preferencial text;
  v_termo_normalizado text;
  v_definicao text;
  v_dominio text;
begin
  if p_decisao not in ('reutilizar_conceito', 'propor_conceito') then
    raise exception 'decisao_taxonomia_invalida' using errcode = '22023';
  end if;
  if p_papel not in ('principal', 'secundario', 'contextual', 'oposicao') then
    raise exception 'papel_taxonomia_invalido' using errcode = '22023';
  end if;
  if p_confianca is null or p_confianca < 0 or p_confianca > 1 then
    raise exception 'confianca_taxonomia_invalida' using errcode = '22023';
  end if;
  if p_justificativa is null or length(trim(p_justificativa)) = 0 or length(p_justificativa) > 2000 then
    raise exception 'justificativa_taxonomia_invalida' using errcode = '22023';
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

  if v_auditoria.operacao <> 'normalizacao_taxonomica_elemento' then
    raise exception 'execucao_ia_operacao_invalida_para_taxonomia' using errcode = '55000';
  end if;

  if v_auditoria.estado = 'concluida' then
    return query
    select v_auditoria.referencias_saida->>'tipo_resultado',
           (v_auditoria.referencias_saida->>'referencia_id')::uuid;
    return;
  end if;

  if v_auditoria.estado <> 'em_execucao' then
    raise exception 'execucao_ia_estado_invalido_para_conclusao' using errcode = '55000';
  end if;

  v_execucao_id := (v_auditoria.referencias_entrada->>'execucao_id')::uuid;
  v_elemento_id := (v_auditoria.referencias_entrada->>'elemento_id')::uuid;
  v_candidatos_ids := v_auditoria.referencias_entrada->'candidatos_ids';

  if v_candidatos_ids is null or jsonb_typeof(v_candidatos_ids) <> 'array' then
    raise exception 'shortlist_taxonomia_auditada_invalida' using errcode = '55000';
  end if;

  if p_decisao = 'reutilizar_conceito' then
    if p_conceito_id is null or p_proposta is not null then
      raise exception 'payload_reutilizacao_taxonomia_invalido' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from jsonb_array_elements_text(v_candidatos_ids) as candidatos(valor)
      where candidatos.valor::uuid = p_conceito_id
    ) then
      raise exception 'conceito_id_fora_da_shortlist_auditada' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from taxonomia.conceitos c
      where c.id = p_conceito_id
        and c.versao_taxonomia_id = v_auditoria.versao_taxonomia_id
        and c.estado = 'ativo'
    ) then
      raise exception 'conceito_taxonomia_nao_ativo_ou_versao_divergente' using errcode = '22023';
    end if;

    select ce.id into v_classificacao_id
    from taxonomia.classificacoes_elementos ce
    where ce.usuario_id = v_auditoria.usuario_id
      and ce.elemento_id = v_elemento_id
      and ce.conceito_id = p_conceito_id
      and ce.papel = p_papel;

    if v_classificacao_id is null then
      insert into taxonomia.classificacoes_elementos (
        usuario_id, elemento_id, conceito_id, papel, confianca
      ) values (
        v_auditoria.usuario_id, v_elemento_id, p_conceito_id, p_papel, p_confianca
      ) returning id into v_classificacao_id;
    end if;

    update auditoria.execucoes_ia
    set estado = 'concluida',
        tokens_entrada = p_tokens_entrada,
        tokens_saida = p_tokens_saida,
        duracao_ms = p_duracao_ms,
        custo_estimado = p_custo_estimado,
        referencias_saida = jsonb_build_object(
          'decisao', p_decisao,
          'tipo_resultado', 'classificacao',
          'referencia_id', v_classificacao_id,
          'conceito_id', p_conceito_id,
          'papel', p_papel,
          'confianca', p_confianca,
          'justificativa', trim(p_justificativa),
          'response_id', p_response_id
        ),
        concluido_em = now(),
        erro = null
    where id = p_auditoria_id;

    return query select 'classificacao'::text, v_classificacao_id;
    return;
  end if;

  if p_conceito_id is not null or p_proposta is null or jsonb_typeof(p_proposta) <> 'object' then
    raise exception 'payload_proposta_taxonomia_invalido' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_proposta) as k(chave)
    where k.chave not in ('termo_preferencial', 'definicao', 'dominio')
  ) then
    raise exception 'proposta_taxonomia_campos_inesperados' using errcode = '22023';
  end if;

  v_termo_preferencial := trim(p_proposta->>'termo_preferencial');
  v_definicao := trim(p_proposta->>'definicao');
  v_dominio := p_proposta->>'dominio';

  if v_termo_preferencial is null or length(v_termo_preferencial) = 0 or length(v_termo_preferencial) > 200 then
    raise exception 'proposta_taxonomia_termo_invalido' using errcode = '22023';
  end if;
  if v_definicao is null or length(v_definicao) = 0 or length(v_definicao) > 2000 then
    raise exception 'proposta_taxonomia_definicao_invalida' using errcode = '22023';
  end if;
  if v_dominio not in (
    'intelectual', 'axiologico', 'reflexivo', 'narrativo', 'entidades',
    'temporal', 'retorico', 'linguistico', 'estrutural', 'autoral'
  ) then
    raise exception 'proposta_taxonomia_dominio_invalido' using errcode = '22023';
  end if;

  v_termo_normalizado := taxonomia.normalizar_termo_taxonomico(v_termo_preferencial);
  if v_termo_normalizado is null or length(v_termo_normalizado) = 0 then
    raise exception 'proposta_taxonomia_termo_normalizado_vazio' using errcode = '22023';
  end if;

  -- Nao permite criar proposta se o termo ja identifica exatamente um conceito
  -- ativo na mesma versao. Nesse caso o chamador deve reutilizar o conceito.
  if exists (
    select 1
    from taxonomia.conceitos c
    join taxonomia.termos t on t.conceito_id = c.id
    where c.versao_taxonomia_id = v_auditoria.versao_taxonomia_id
      and c.estado = 'ativo'
      and t.termo_normalizado = v_termo_normalizado
  ) then
    raise exception 'proposta_taxonomia_duplicaria_conceito_ativo' using errcode = '22023';
  end if;

  select pc.id into v_proposta_id
  from taxonomia.propostas_conceitos pc
  where pc.usuario_id = v_auditoria.usuario_id
    and pc.versao_taxonomia_id = v_auditoria.versao_taxonomia_id
    and pc.termo_normalizado = v_termo_normalizado;

  if v_proposta_id is null then
    insert into taxonomia.propostas_conceitos (
      usuario_id,
      versao_taxonomia_id,
      termo_preferencial,
      termo_normalizado,
      definicao_proposta,
      dominio_proposto,
      confianca,
      estado_revisao,
      modelo_ia_id,
      versao_prompt_id
    ) values (
      v_auditoria.usuario_id,
      v_auditoria.versao_taxonomia_id,
      v_termo_preferencial,
      v_termo_normalizado,
      v_definicao,
      v_dominio,
      p_confianca,
      'nao_revisado',
      v_auditoria.modelo_ia_id,
      v_auditoria.versao_prompt_id
    ) returning id into v_proposta_id;
  end if;

  insert into taxonomia.fontes_propostas_conceitos (
    usuario_id,
    proposta_conceito_id,
    elemento_id,
    confianca,
    justificativa,
    papel_proposto
  ) values (
    v_auditoria.usuario_id,
    v_proposta_id,
    v_elemento_id,
    p_confianca,
    trim(p_justificativa),
    p_papel
  ) on conflict (usuario_id, proposta_conceito_id, elemento_id) do nothing;

  update auditoria.execucoes_ia
  set estado = 'concluida',
      tokens_entrada = p_tokens_entrada,
      tokens_saida = p_tokens_saida,
      duracao_ms = p_duracao_ms,
      custo_estimado = p_custo_estimado,
      referencias_saida = jsonb_build_object(
        'decisao', p_decisao,
        'tipo_resultado', 'proposta',
        'referencia_id', v_proposta_id,
        'proposta', p_proposta,
        'papel', p_papel,
        'confianca', p_confianca,
        'justificativa', trim(p_justificativa),
        'response_id', p_response_id
      ),
      concluido_em = now(),
      erro = null
  where id = p_auditoria_id;

  return query select 'proposta'::text, v_proposta_id;
end;
$$;

revoke all on function aplicacao.backend_concluir_normalizacao_taxonomia_ia(
  uuid,text,uuid,jsonb,text,numeric,text,integer,integer,bigint,numeric,text
) from public, anon, authenticated;
grant execute on function aplicacao.backend_concluir_normalizacao_taxonomia_ia(
  uuid,text,uuid,jsonb,text,numeric,text,integer,integer,bigint,numeric,text
) to service_role;

create function aplicacao.backend_obter_normalizacao_taxonomia_auditada(
  p_execucao_id uuid,
  p_elemento_id uuid,
  p_modelo_ia_id uuid,
  p_versao_prompt_id uuid,
  p_hash_entrada text
)
returns table (
  auditoria_id uuid,
  tipo_resultado text,
  referencia_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_chave text;
  v_auditoria auditoria.execucoes_ia%rowtype;
  v_tipo_resultado text;
  v_referencia_id uuid;
begin
  if p_hash_entrada is null or p_hash_entrada !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'hash_entrada_normalizacao_taxonomia_invalido' using errcode = '22023';
  end if;

  select e.usuario_id into v_usuario_id
  from processamento.execucoes e
  join processamento.documentos_processados d
    on d.execucao_id = e.id
   and d.usuario_id = e.usuario_id
  join processamento.elementos el
    on el.documento_processado_id = d.id
   and el.usuario_id = d.usuario_id
   and el.id = p_elemento_id
  where e.id = p_execucao_id;

  if v_usuario_id is null then
    raise exception 'elemento_normalizacao_nao_encontrado' using errcode = 'P0002';
  end if;

  v_chave := encode(extensions.digest(
    concat_ws(
      '|',
      'normalizacao_taxonomica_elemento',
      p_execucao_id::text,
      p_elemento_id::text,
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

  v_tipo_resultado := v_auditoria.referencias_saida->>'tipo_resultado';
  v_referencia_id := nullif(v_auditoria.referencias_saida->>'referencia_id', '')::uuid;

  if v_tipo_resultado = 'classificacao' then
    if v_referencia_id is null or not exists (
      select 1
      from taxonomia.classificacoes_elementos ce
      where ce.id = v_referencia_id
        and ce.usuario_id = v_usuario_id
        and ce.elemento_id = p_elemento_id
    ) then
      raise exception 'normalizacao_taxonomia_concluida_classificacao_ausente' using errcode = '55000';
    end if;
  elsif v_tipo_resultado = 'proposta' then
    if v_referencia_id is null or not exists (
      select 1
      from taxonomia.fontes_propostas_conceitos fp
      where fp.usuario_id = v_usuario_id
        and fp.elemento_id = p_elemento_id
        and fp.proposta_conceito_id = v_referencia_id
    ) then
      raise exception 'normalizacao_taxonomia_concluida_proposta_ausente' using errcode = '55000';
    end if;
  else
    raise exception 'normalizacao_taxonomia_concluida_resultado_invalido' using errcode = '55000';
  end if;

  return query select v_auditoria.id, v_tipo_resultado, v_referencia_id;
end;
$$;

revoke all on function aplicacao.backend_obter_normalizacao_taxonomia_auditada(uuid,uuid,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function aplicacao.backend_obter_normalizacao_taxonomia_auditada(uuid,uuid,uuid,uuid,text)
  to service_role;

-- Guardrails: as tres novas RPCs sao exclusivamente backend/service_role.
do $$
begin
  if has_function_privilege(
    'anon',
    'aplicacao.backend_preparar_normalizacao_taxonomia_ia(uuid,uuid,uuid,uuid,text,uuid[])',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_preparar_normalizacao_taxonomia_ia(uuid,uuid,uuid,uuid,text,uuid[])',
    'EXECUTE'
  ) then
    raise exception 'rpc_preparar_normalizacao_taxonomia_exposta_ao_cliente';
  end if;

  if has_function_privilege(
    'anon',
    'aplicacao.backend_concluir_normalizacao_taxonomia_ia(uuid,text,uuid,jsonb,text,numeric,text,integer,integer,bigint,numeric,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_concluir_normalizacao_taxonomia_ia(uuid,text,uuid,jsonb,text,numeric,text,integer,integer,bigint,numeric,text)',
    'EXECUTE'
  ) then
    raise exception 'rpc_concluir_normalizacao_taxonomia_exposta_ao_cliente';
  end if;

  if has_function_privilege(
    'anon',
    'aplicacao.backend_obter_normalizacao_taxonomia_auditada(uuid,uuid,uuid,uuid,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_obter_normalizacao_taxonomia_auditada(uuid,uuid,uuid,uuid,text)',
    'EXECUTE'
  ) then
    raise exception 'rpc_replay_normalizacao_taxonomia_exposta_ao_cliente';
  end if;
end $$;
