-- 0018_recuperacao_orquestracao_workflow
-- Reserva de disparo, recuperação de execuções e estado coerente do workflow durável.

alter table processamento.execucoes
  add column if not exists workflow_reservado_em timestamptz,
  add column if not exists workflow_iniciado_em timestamptz,
  add column if not exists workflow_tentativas integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'execucoes_workflow_tentativas_check'
      and conrelid = 'processamento.execucoes'::regclass
  ) then
    alter table processamento.execucoes
      add constraint execucoes_workflow_tentativas_check
      check (workflow_tentativas >= 0);
  end if;
end $$;

comment on column processamento.execucoes.workflow_reservado_em is
  'Reserva curta para impedir disparos concorrentes do mesmo workflow; pode ser retomada quando expirada.';
comment on column processamento.execucoes.workflow_iniciado_em is
  'Momento em que o backend confirmou o início do workflow durável.';
comment on column processamento.execucoes.workflow_tentativas is
  'Quantidade de tentativas de disparo/reinício do workflow durável.';

drop function if exists aplicacao.backend_iniciar_processamento(uuid, uuid);

create function aplicacao.backend_iniciar_processamento(
  p_usuario_id uuid,
  p_versao_obra_id uuid
)
returns table (
  execucao_id uuid,
  execucao_codigo text,
  estado text,
  criada boolean,
  deve_iniciar_workflow boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pipeline_id uuid;
  v_taxonomia_id uuid;
  v_execucao_id uuid;
  v_execucao_codigo text;
  v_estado text;
  v_workflow_reservado_em timestamptz;
  v_workflow_iniciado_em timestamptz;
  v_etapa_estado text;
  v_etapa_tentativas integer;
begin
  if p_usuario_id is null or p_versao_obra_id is null then
    raise exception 'usuario_e_versao_obrigatorios' using errcode = '22023';
  end if;

  if not exists (
    select 1 from biblioteca.versoes_obras vo
    where vo.id = p_versao_obra_id and vo.usuario_id = p_usuario_id
  ) then
    raise exception 'versao_obra_nao_encontrada' using errcode = 'P0002';
  end if;

  select vp.id into v_pipeline_id
  from sistema.versoes_pipeline vp
  where vp.estado = 'ativa'
  order by vp.ativado_em desc nulls last, vp.criado_em desc
  limit 1;

  select vt.id into v_taxonomia_id
  from taxonomia.versoes vt
  where vt.estado = 'ativa'
  order by vt.ativado_em desc nulls last, vt.criado_em desc
  limit 1;

  if v_pipeline_id is null then
    raise exception 'pipeline_ativo_nao_encontrado' using errcode = 'P0002';
  end if;
  if v_taxonomia_id is null then
    raise exception 'taxonomia_ativa_nao_encontrada' using errcode = 'P0002';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_usuario_id::text || ':' || p_versao_obra_id::text || ':' || v_pipeline_id::text || ':' || v_taxonomia_id::text,
      0
    )
  );

  select e.id, e.codigo, e.estado, e.workflow_reservado_em, e.workflow_iniciado_em
    into v_execucao_id, v_execucao_codigo, v_estado, v_workflow_reservado_em, v_workflow_iniciado_em
  from processamento.execucoes e
  where e.usuario_id = p_usuario_id
    and e.versao_obra_id = p_versao_obra_id
    and e.versao_pipeline_id = v_pipeline_id
    and e.versao_taxonomia_id = v_taxonomia_id
  order by e.criado_em desc
  limit 1;

  if v_execucao_id is not null then
    select ee.estado, ee.tentativas
      into v_etapa_estado, v_etapa_tentativas
    from processamento.etapas_execucao ee
    where ee.execucao_id = v_execucao_id
      and ee.nome_etapa = 'validar_arquivo';

    if v_estado = 'concluido' then
      return query select v_execucao_id, v_execucao_codigo, v_estado, false, false;
      return;
    end if;

    if v_estado not in ('falhou', 'cancelado') then
      if v_workflow_iniciado_em is not null or coalesce(v_etapa_tentativas, 0) > 0 then
        return query select v_execucao_id, v_execucao_codigo, v_estado, false, false;
        return;
      end if;

      if v_workflow_reservado_em is not null
         and v_workflow_reservado_em > now() - interval '5 minutes' then
        return query select v_execucao_id, v_execucao_codigo, v_estado, false, false;
        return;
      end if;
    end if;

    update processamento.execucoes
    set estado = 'recebido',
        concluido_em = null,
        codigo_erro = null,
        mensagem_erro = null,
        workflow_reservado_em = now(),
        workflow_iniciado_em = null,
        workflow_tentativas = workflow_tentativas + 1
    where id = v_execucao_id;

    if v_estado = 'cancelado' then
      update processamento.etapas_execucao
      set estado = 'pendente',
          iniciado_em = null,
          concluido_em = null,
          duracao_ms = null
      where execucao_id = v_execucao_id
        and estado = 'cancelada';
    end if;

    update biblioteca.versoes_obras
    set estado_processamento = 'em_processamento'
    where id = p_versao_obra_id and usuario_id = p_usuario_id;

    return query select v_execucao_id, v_execucao_codigo, 'recebido'::text, false, true;
    return;
  end if;

  v_execucao_id := gen_random_uuid();
  v_execucao_codigo := 'EXE-' || upper(substr(replace(v_execucao_id::text, '-', ''), 1, 12));

  insert into processamento.execucoes (
    id, usuario_id, versao_obra_id, codigo, estado, etapa_atual, percentual,
    versao_pipeline_id, versao_taxonomia_id, iniciado_em, criado_em,
    workflow_reservado_em, workflow_tentativas
  ) values (
    v_execucao_id, p_usuario_id, p_versao_obra_id, v_execucao_codigo,
    'recebido', 'validar_arquivo', 0, v_pipeline_id, v_taxonomia_id, now(), now(),
    now(), 1
  );

  insert into processamento.etapas_execucao (
    usuario_id, execucao_id, nome_etapa, ordem, chave_idempotencia,
    estado, tentativas, criado_em
  )
  select
    p_usuario_id,
    v_execucao_id,
    etapas.nome_etapa,
    etapas.ordem::integer,
    p_usuario_id::text || ':' || p_versao_obra_id::text || ':' ||
      v_pipeline_id::text || ':' || v_taxonomia_id::text || ':' || etapas.nome_etapa,
    'pendente',
    0,
    now()
  from unnest(array[
    'validar_arquivo','identificar_formato','extrair_conteudo','normalizar_conteudo',
    'identificar_estrutura','criar_hierarquia','criar_fragmentos','criar_sinteses',
    'extrair_elementos','classificar_taxonomia','criar_embeddings','criar_relacoes',
    'validar_resultado','publicar_documento'
  ]::text[]) with ordinality as etapas(nome_etapa, ordem)
  on conflict (chave_idempotencia) do nothing;

  update biblioteca.versoes_obras
  set estado_processamento = 'em_processamento'
  where id = p_versao_obra_id and usuario_id = p_usuario_id;

  return query select v_execucao_id, v_execucao_codigo, 'recebido'::text, true, true;
end;
$$;

create or replace function aplicacao.backend_registrar_workflow_iniciado(
  p_execucao_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atualizados integer;
begin
  update processamento.execucoes
  set workflow_iniciado_em = coalesce(workflow_iniciado_em, now()),
      workflow_reservado_em = null
  where id = p_execucao_id
    and estado not in ('concluido', 'cancelado');

  get diagnostics v_atualizados = row_count;
  return v_atualizados > 0;
end;
$$;

create or replace function aplicacao.backend_iniciar_etapa(
  p_execucao_id uuid,
  p_nome_etapa text,
  p_estado_execucao text,
  p_percentual numeric
)
returns table (deve_executar boolean, tentativas integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado_etapa text;
  v_tentativas integer;
  v_usuario_id uuid;
  v_versao_obra_id uuid;
begin
  select ee.estado, ee.tentativas into v_estado_etapa, v_tentativas
  from processamento.etapas_execucao ee
  where ee.execucao_id = p_execucao_id and ee.nome_etapa = p_nome_etapa;

  if v_estado_etapa is null then
    raise exception 'etapa_nao_encontrada' using errcode = 'P0002';
  end if;

  if v_estado_etapa in ('concluida', 'ignorada', 'cancelada') then
    return query select false, v_tentativas;
    return;
  end if;

  update processamento.etapas_execucao
  set estado = 'executando',
      tentativas = tentativas + 1,
      iniciado_em = now(),
      concluido_em = null,
      duracao_ms = null
  where execucao_id = p_execucao_id and nome_etapa = p_nome_etapa
  returning processamento.etapas_execucao.tentativas into v_tentativas;

  update processamento.execucoes
  set estado = p_estado_execucao,
      etapa_atual = p_nome_etapa,
      percentual = p_percentual,
      concluido_em = null,
      codigo_erro = null,
      mensagem_erro = null,
      workflow_iniciado_em = coalesce(workflow_iniciado_em, now()),
      workflow_reservado_em = null
  where id = p_execucao_id
  returning usuario_id, versao_obra_id into v_usuario_id, v_versao_obra_id;

  update biblioteca.versoes_obras
  set estado_processamento = 'em_processamento'
  where id = v_versao_obra_id and usuario_id = v_usuario_id;

  return query select true, v_tentativas;
end;
$$;

create or replace function aplicacao.backend_falhar_execucao(
  p_execucao_id uuid,
  p_nome_etapa text,
  p_codigo_erro text,
  p_mensagem_erro text,
  p_detalhes jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_versao_obra_id uuid;
begin
  if p_detalhes is not null and jsonb_typeof(p_detalhes) <> 'object' then
    raise exception 'detalhes_devem_ser_objeto' using errcode = '22023';
  end if;

  select e.usuario_id, e.versao_obra_id into v_usuario_id, v_versao_obra_id
  from processamento.execucoes e where e.id = p_execucao_id;

  if v_usuario_id is null then return false; end if;

  update processamento.etapas_execucao
  set estado = 'falhou',
      concluido_em = now(),
      duracao_ms = case
        when iniciado_em is null then duracao_ms
        else greatest(0, (extract(epoch from (now() - iniciado_em)) * 1000)::bigint)
      end,
      detalhes_auxiliares = coalesce(p_detalhes, detalhes_auxiliares)
  where execucao_id = p_execucao_id
    and nome_etapa = p_nome_etapa
    and estado <> 'concluida';

  update processamento.execucoes
  set estado = 'falhou',
      etapa_atual = p_nome_etapa,
      concluido_em = now(),
      codigo_erro = left(coalesce(p_codigo_erro, 'PROCESSAMENTO_FALHOU'), 120),
      mensagem_erro = left(coalesce(p_mensagem_erro, 'Falha no processamento'), 500),
      workflow_reservado_em = null
  where id = p_execucao_id;

  update biblioteca.versoes_obras
  set estado_processamento = 'falhou'
  where id = v_versao_obra_id and usuario_id = v_usuario_id;

  return true;
end;
$$;

revoke all on function aplicacao.backend_iniciar_processamento(uuid, uuid) from public, anon, authenticated;
revoke all on function aplicacao.backend_registrar_workflow_iniciado(uuid) from public, anon, authenticated;
revoke all on function aplicacao.backend_iniciar_etapa(uuid, text, text, numeric) from public, anon, authenticated;
revoke all on function aplicacao.backend_falhar_execucao(uuid, text, text, text, jsonb) from public, anon, authenticated;

grant execute on function aplicacao.backend_iniciar_processamento(uuid, uuid) to service_role;
grant execute on function aplicacao.backend_registrar_workflow_iniciado(uuid) to service_role;
grant execute on function aplicacao.backend_iniciar_etapa(uuid, text, text, numeric) to service_role;
grant execute on function aplicacao.backend_falhar_execucao(uuid, text, text, text, jsonb) to service_role;
