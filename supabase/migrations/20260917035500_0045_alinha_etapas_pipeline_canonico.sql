-- 0045_alinha_etapas_pipeline_canonico
-- Corrige o plano de etapas criado para novas execucoes.
-- O codigo de extrair_elementos ja transiciona para normalizar_taxonomia;
-- a funcao antiga ainda criava classificar_taxonomia e ordenava embeddings
-- antes de relacoes. Esta migration alinha novas execucoes ao workflow canonico.
--
-- Nao ha execucoes no projeto oficial no momento desta mudanca; ainda assim,
-- a definicao abaixo preserva integralmente a logica operacional anterior e
-- altera somente o catalogo de etapas criado para novas execucoes.

create or replace function aplicacao.backend_iniciar_processamento(
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
      p_usuario_id::text || ':' || p_versao_obra_id::text || ':' ||
      v_pipeline_id::text || ':' || v_taxonomia_id::text,
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
    'validar_arquivo',
    'identificar_formato',
    'extrair_conteudo',
    'normalizar_conteudo',
    'identificar_estrutura',
    'criar_hierarquia',
    'criar_fragmentos',
    'criar_sinteses',
    'extrair_elementos',
    'normalizar_taxonomia',
    'criar_relacoes',
    'gerar_embeddings',
    'criar_indices',
    'realizar_analise_autoral_local',
    'validar_processamento',
    'publicar_documento_processado',
    'avaliar_participacao_cerebro',
    'atualizar_cerebro'
  ]::text[]) with ordinality as etapas(nome_etapa, ordem)
  on conflict (chave_idempotencia) do nothing;

  update biblioteca.versoes_obras
  set estado_processamento = 'em_processamento'
  where id = p_versao_obra_id and usuario_id = p_usuario_id;

  return query select v_execucao_id, v_execucao_codigo, 'recebido'::text, true, true;
end;
$$;

revoke all on function aplicacao.backend_iniciar_processamento(uuid,uuid)
  from public, anon, authenticated;
grant execute on function aplicacao.backend_iniciar_processamento(uuid,uuid)
  to service_role;

-- Guardrail: a definicao operacional precisa conter as tres etapas imediatas
-- na ordem intelectual estabelecida pelo projeto.
do $$
declare
  v_definicao text;
begin
  select pg_get_functiondef(p.oid) into v_definicao
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'aplicacao'
    and p.proname = 'backend_iniciar_processamento'
    and p.prokind = 'f';

  if v_definicao not like '%normalizar_taxonomia%criar_relacoes%gerar_embeddings%' then
    raise exception 'ordem_pipeline_taxonomia_relacoes_embeddings_divergente';
  end if;
end $$;
