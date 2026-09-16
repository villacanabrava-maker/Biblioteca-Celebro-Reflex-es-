-- 0017_api_backend_workflow_processamento
-- Operações server-only do workflow. Nenhuma função abaixo é executável pelo navegador.

create or replace function aplicacao.backend_iniciar_processamento(
  p_usuario_id uuid,
  p_versao_obra_id uuid
)
returns table (
  execucao_id uuid,
  execucao_codigo text,
  estado text,
  criada boolean
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

  select e.id, e.codigo, e.estado
    into v_execucao_id, v_execucao_codigo, v_estado
  from processamento.execucoes e
  where e.usuario_id = p_usuario_id
    and e.versao_obra_id = p_versao_obra_id
    and e.versao_pipeline_id = v_pipeline_id
    and e.versao_taxonomia_id = v_taxonomia_id
  order by e.criado_em desc
  limit 1;

  if v_execucao_id is not null then
    return query select v_execucao_id, v_execucao_codigo, v_estado, false;
    return;
  end if;

  v_execucao_id := gen_random_uuid();
  v_execucao_codigo := 'EXE-' || upper(substr(replace(v_execucao_id::text, '-', ''), 1, 12));

  insert into processamento.execucoes (
    id, usuario_id, versao_obra_id, codigo, estado, etapa_atual, percentual,
    versao_pipeline_id, versao_taxonomia_id, iniciado_em, criado_em
  ) values (
    v_execucao_id, p_usuario_id, p_versao_obra_id, v_execucao_codigo,
    'recebido', 'validar_arquivo', 0, v_pipeline_id, v_taxonomia_id, now(), now()
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

  return query select v_execucao_id, v_execucao_codigo, 'recebido'::text, true;
end;
$$;

create or replace function aplicacao.backend_obter_execucao(p_execucao_id uuid)
returns table (
  execucao_id uuid,
  usuario_id uuid,
  versao_obra_id uuid,
  obra_id uuid,
  estado text,
  etapa_atual text,
  versao_pipeline_id uuid,
  versao_taxonomia_id uuid,
  caminho_arquivo text,
  hash_sha256 text,
  tamanho_bytes bigint,
  tipo_mime text,
  nome_arquivo text
)
language sql
security definer
set search_path = ''
as $$
  select e.id, e.usuario_id, e.versao_obra_id, vo.obra_id, e.estado, e.etapa_atual,
         e.versao_pipeline_id, e.versao_taxonomia_id, vo.caminho_arquivo,
         vo.hash_sha256, vo.tamanho_bytes, vo.tipo_mime, vo.nome_arquivo
  from processamento.execucoes e
  join biblioteca.versoes_obras vo
    on vo.id = e.versao_obra_id and vo.usuario_id = e.usuario_id
  where e.id = p_execucao_id
  limit 1
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
      mensagem_erro = null
  where id = p_execucao_id;

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
  v_atualizados integer;
begin
  if p_detalhes is not null and jsonb_typeof(p_detalhes) <> 'object' then
    raise exception 'detalhes_devem_ser_objeto' using errcode = '22023';
  end if;

  update processamento.etapas_execucao
  set estado = 'concluida',
      concluido_em = coalesce(concluido_em, now()),
      duracao_ms = case
        when iniciado_em is null then duracao_ms
        else greatest(0, (extract(epoch from (coalesce(concluido_em, now()) - iniciado_em)) * 1000)::bigint)
      end,
      detalhes_auxiliares = coalesce(p_detalhes, detalhes_auxiliares)
  where execucao_id = p_execucao_id
    and nome_etapa = p_nome_etapa
    and estado <> 'concluida';

  get diagnostics v_atualizados = row_count;

  update processamento.execucoes
  set estado = p_proximo_estado,
      etapa_atual = p_proxima_etapa,
      percentual = p_percentual
  where id = p_execucao_id and estado <> 'falhou';

  return v_atualizados > 0;
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
      mensagem_erro = left(coalesce(p_mensagem_erro, 'Falha no processamento'), 500)
  where id = p_execucao_id;

  update biblioteca.versoes_obras
  set estado_processamento = 'falhou'
  where id = v_versao_obra_id and usuario_id = v_usuario_id;

  return true;
end;
$$;

revoke all on function aplicacao.backend_iniciar_processamento(uuid, uuid) from public, anon, authenticated;
revoke all on function aplicacao.backend_obter_execucao(uuid) from public, anon, authenticated;
revoke all on function aplicacao.backend_iniciar_etapa(uuid, text, text, numeric) from public, anon, authenticated;
revoke all on function aplicacao.backend_concluir_etapa(uuid, text, numeric, text, text, jsonb) from public, anon, authenticated;
revoke all on function aplicacao.backend_falhar_execucao(uuid, text, text, text, jsonb) from public, anon, authenticated;

grant execute on function aplicacao.backend_iniciar_processamento(uuid, uuid) to service_role;
grant execute on function aplicacao.backend_obter_execucao(uuid) to service_role;
grant execute on function aplicacao.backend_iniciar_etapa(uuid, text, text, numeric) to service_role;
grant execute on function aplicacao.backend_concluir_etapa(uuid, text, numeric, text, text, jsonb) to service_role;
grant execute on function aplicacao.backend_falhar_execucao(uuid, text, text, text, jsonb) to service_role;
