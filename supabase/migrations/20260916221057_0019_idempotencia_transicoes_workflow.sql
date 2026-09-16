-- 0019_idempotencia_transicoes_workflow
-- Endurece as transições do workflow contra chamadas atrasadas, replays e regressão de estado.

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
    and estado not in ('concluido', 'cancelado', 'falhou');

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
  v_estado_execucao text;
  v_etapa_atual text;
  v_estado_etapa text;
  v_tentativas integer;
  v_usuario_id uuid;
  v_versao_obra_id uuid;
begin
  select e.estado, e.etapa_atual, e.usuario_id, e.versao_obra_id
    into v_estado_execucao, v_etapa_atual, v_usuario_id, v_versao_obra_id
  from processamento.execucoes e
  where e.id = p_execucao_id
  for update;

  if v_usuario_id is null then
    raise exception 'execucao_nao_encontrada' using errcode = 'P0002';
  end if;

  select ee.estado, ee.tentativas
    into v_estado_etapa, v_tentativas
  from processamento.etapas_execucao ee
  where ee.execucao_id = p_execucao_id and ee.nome_etapa = p_nome_etapa
  for update;

  if v_estado_etapa is null then
    raise exception 'etapa_nao_encontrada' using errcode = 'P0002';
  end if;

  if v_estado_execucao in ('concluido', 'cancelado', 'falhou')
     or v_estado_etapa in ('concluida', 'ignorada', 'cancelada')
     or v_etapa_atual is distinct from p_nome_etapa then
    return query select false, v_tentativas;
    return;
  end if;

  update processamento.etapas_execucao
  set estado = 'executando',
      tentativas = tentativas + 1,
      iniciado_em = coalesce(iniciado_em, now()),
      concluido_em = null,
      duracao_ms = null
  where execucao_id = p_execucao_id and nome_etapa = p_nome_etapa
  returning processamento.etapas_execucao.tentativas into v_tentativas;

  update processamento.execucoes
  set estado = p_estado_execucao,
      etapa_atual = p_nome_etapa,
      percentual = greatest(percentual, p_percentual),
      concluido_em = null,
      codigo_erro = null,
      mensagem_erro = null,
      workflow_iniciado_em = coalesce(workflow_iniciado_em, now()),
      workflow_reservado_em = null
  where id = p_execucao_id;

  update biblioteca.versoes_obras
  set estado_processamento = 'em_processamento'
  where id = v_versao_obra_id and usuario_id = v_usuario_id;

  return query select true, v_tentativas;
end;
$$;

create or replace function aplicacao.backend_concluir_etapa(
  p_execucao_id uuid,
  p_nome_etapa text,
  p_percentual numeric,
  p_proximo_estado text,
  p_proxima_etapa text,
  p_detalhes jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado_execucao text;
  v_etapa_atual text;
  v_estado_etapa text;
  v_atualizados integer;
begin
  if p_detalhes is not null and jsonb_typeof(p_detalhes) <> 'object' then
    raise exception 'detalhes_devem_ser_objeto' using errcode = '22023';
  end if;

  select e.estado, e.etapa_atual
    into v_estado_execucao, v_etapa_atual
  from processamento.execucoes e
  where e.id = p_execucao_id
  for update;

  if v_estado_execucao is null then
    return false;
  end if;

  if v_estado_execucao in ('concluido', 'cancelado', 'falhou')
     or v_etapa_atual is distinct from p_nome_etapa then
    return false;
  end if;

  select ee.estado into v_estado_etapa
  from processamento.etapas_execucao ee
  where ee.execucao_id = p_execucao_id and ee.nome_etapa = p_nome_etapa
  for update;

  if v_estado_etapa is distinct from 'executando' then
    return false;
  end if;

  update processamento.etapas_execucao
  set estado = 'concluida',
      concluido_em = now(),
      duracao_ms = case
        when iniciado_em is null then duracao_ms
        else greatest(0, (extract(epoch from (now() - iniciado_em)) * 1000)::bigint)
      end,
      detalhes_auxiliares = coalesce(p_detalhes, detalhes_auxiliares)
  where execucao_id = p_execucao_id
    and nome_etapa = p_nome_etapa
    and estado = 'executando';

  get diagnostics v_atualizados = row_count;
  if v_atualizados = 0 then
    return false;
  end if;

  update processamento.execucoes
  set estado = p_proximo_estado,
      etapa_atual = p_proxima_etapa,
      percentual = greatest(percentual, p_percentual),
      concluido_em = case
        when p_proximo_estado in ('concluido', 'falhou', 'cancelado') then now()
        else null
      end
  where id = p_execucao_id;

  return true;
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
  v_estado_execucao text;
  v_etapa_atual text;
begin
  if p_detalhes is not null and jsonb_typeof(p_detalhes) <> 'object' then
    raise exception 'detalhes_devem_ser_objeto' using errcode = '22023';
  end if;

  select e.usuario_id, e.versao_obra_id, e.estado, e.etapa_atual
    into v_usuario_id, v_versao_obra_id, v_estado_execucao, v_etapa_atual
  from processamento.execucoes e
  where e.id = p_execucao_id
  for update;

  if v_usuario_id is null then return false; end if;

  if v_estado_execucao in ('concluido', 'cancelado', 'falhou')
     or v_etapa_atual is distinct from p_nome_etapa then
    return false;
  end if;

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
    and estado not in ('concluida', 'cancelada');

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

revoke all on function aplicacao.backend_registrar_workflow_iniciado(uuid) from public, anon, authenticated;
revoke all on function aplicacao.backend_iniciar_etapa(uuid, text, text, numeric) from public, anon, authenticated;
revoke all on function aplicacao.backend_concluir_etapa(uuid, text, numeric, text, text, jsonb) from public, anon, authenticated;
revoke all on function aplicacao.backend_falhar_execucao(uuid, text, text, text, jsonb) from public, anon, authenticated;

grant execute on function aplicacao.backend_registrar_workflow_iniciado(uuid) to service_role;
grant execute on function aplicacao.backend_iniciar_etapa(uuid, text, text, numeric) to service_role;
grant execute on function aplicacao.backend_concluir_etapa(uuid, text, numeric, text, text, jsonb) to service_role;
grant execute on function aplicacao.backend_falhar_execucao(uuid, text, text, text, jsonb) to service_role;
