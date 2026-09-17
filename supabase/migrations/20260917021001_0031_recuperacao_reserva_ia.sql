-- 0031_recuperacao_reserva_ia
-- Separa a janela de reserva local da chamada externa já iniciada.
-- Reserva não iniciada pode ser recuperada sem risco de cobrança duplicada;
-- chamada já iniciada e abandonada permanece conservadoramente incerta.

alter table auditoria.execucoes_ia
  add column reservado_em timestamptz not null default now();

create or replace function aplicacao.backend_preparar_sintese_ia(
  p_execucao_id uuid,
  p_tipo_alvo text,
  p_alvo_id uuid,
  p_modelo_ia_id uuid,
  p_versao_prompt_id uuid,
  p_hash_entrada text
)
returns table (
  auditoria_id uuid,
  estado text,
  tentativa integer,
  deve_chamar boolean,
  sintese_id uuid
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
  v_nivel smallint;
  v_chave text;
  v_auditoria auditoria.execucoes_ia%rowtype;
  v_sintese_id uuid;
begin
  if p_tipo_alvo not in ('secao','capitulo','parte','obra') then
    raise exception 'tipo_alvo_sintese_invalido' using errcode = '22023';
  end if;
  if p_hash_entrada is null or p_hash_entrada !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'hash_entrada_sintese_invalido' using errcode = '22023';
  end if;

  select e.usuario_id, d.id, e.versao_pipeline_id, e.versao_taxonomia_id
    into v_usuario_id, v_documento_id, v_versao_pipeline_id, v_versao_taxonomia_id
  from processamento.execucoes e
  join processamento.documentos_processados d on d.execucao_id = e.id and d.usuario_id = e.usuario_id
  where e.id = p_execucao_id;

  if v_documento_id is null then raise exception 'documento_processado_nao_encontrado' using errcode = 'P0002'; end if;

  if not exists (
    select 1 from sistema.modelos_ia m
    where m.id = p_modelo_ia_id and m.provedor = 'openai' and m.finalidade = 'analise' and m.ativo = true
  ) then raise exception 'modelo_ia_sintese_invalido' using errcode = '22023'; end if;

  if not exists (
    select 1 from sistema.versoes_prompts vp
    join sistema.prompts p on p.id = vp.prompt_id
    where vp.id = p_versao_prompt_id and vp.ativado_em is not null
      and p.codigo = 'sintese_documental_hierarquica' and p.ativo = true
  ) then raise exception 'versao_prompt_sintese_invalida' using errcode = '22023'; end if;

  if p_tipo_alvo = 'obra' then
    if p_alvo_id <> v_documento_id then raise exception 'alvo_obra_sintese_invalido' using errcode = '22023'; end if;
    v_nivel := 0;
  else
    select s.nivel_hierarquico into v_nivel
    from processamento.secoes s
    where s.id = p_alvo_id and s.documento_processado_id = v_documento_id and s.usuario_id = v_usuario_id
      and ((p_tipo_alvo = 'parte' and s.tipo = 'parte')
        or (p_tipo_alvo = 'capitulo' and s.tipo = 'capitulo')
        or (p_tipo_alvo = 'secao' and s.tipo in ('secao','subsecao','anexo','prefacio','posfacio')));
    if v_nivel is null then raise exception 'alvo_secao_sintese_invalido' using errcode = '22023'; end if;
  end if;

  v_chave := encode(extensions.digest(
    concat_ws('|', 'sintese_documental', p_execucao_id::text, p_tipo_alvo, p_alvo_id::text,
      p_modelo_ia_id::text, p_versao_prompt_id::text, lower(p_hash_entrada)), 'sha256'), 'hex');

  perform pg_advisory_xact_lock(hashtextextended(v_chave, 0));

  select * into v_auditoria from auditoria.execucoes_ia a
  where a.chave_idempotencia = v_chave for update;

  if found then
    if v_auditoria.estado = 'concluida' then
      v_sintese_id := (v_auditoria.referencias_saida->>'sintese_id')::uuid;
      return query select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false, v_sintese_id;
      return;
    end if;

    if v_auditoria.estado = 'reservada' then
      if v_auditoria.reservado_em < now() - interval '2 minutes' then
        update auditoria.execucoes_ia
        set reservado_em = now(), tentativa = tentativa + 1
        where id = v_auditoria.id returning * into v_auditoria;
        return query select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true, null::uuid;
      end if;
      return query select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false, null::uuid;
      return;
    end if;

    if v_auditoria.estado = 'em_execucao' then
      if v_auditoria.iniciado_em is not null and v_auditoria.iniciado_em < now() - interval '15 minutes' then
        update auditoria.execucoes_ia
        set estado = 'incerta', erro = 'execucao_interrompida_estado_incerto', concluido_em = now()
        where id = v_auditoria.id;
        return query select v_auditoria.id, 'incerta'::text, v_auditoria.tentativa, false, null::uuid;
      end if;
      return query select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false, null::uuid;
      return;
    end if;

    if v_auditoria.estado = 'falhou' and v_auditoria.tentativa < 3 then
      update auditoria.execucoes_ia
      set estado = 'reservada', reservado_em = now(), tentativa = tentativa + 1,
          tokens_entrada = null, tokens_saida = null, duracao_ms = null,
          custo_estimado = null, referencias_saida = '{}'::jsonb,
          erro = null, iniciado_em = null, concluido_em = null
      where id = v_auditoria.id returning * into v_auditoria;
      return query select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true, null::uuid;
      return;
    end if;

    return query select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, false, null::uuid;
    return;
  end if;

  insert into auditoria.execucoes_ia (
    usuario_id, operacao, modelo_ia_id, versao_prompt_id, versao_taxonomia_id,
    versao_pipeline_id, estado, referencias_entrada, chave_idempotencia, reservado_em
  ) values (
    v_usuario_id, 'sintese_documental', p_modelo_ia_id, p_versao_prompt_id,
    v_versao_taxonomia_id, v_versao_pipeline_id, 'reservada',
    jsonb_build_object('execucao_id', p_execucao_id, 'documento_processado_id', v_documento_id,
      'tipo_alvo', p_tipo_alvo, 'alvo_id', p_alvo_id, 'nivel', v_nivel,
      'hash_entrada', lower(p_hash_entrada)), v_chave, now()
  ) returning * into v_auditoria;

  return query select v_auditoria.id, v_auditoria.estado, v_auditoria.tentativa, true, null::uuid;
end;
$$;

revoke all on function aplicacao.backend_preparar_sintese_ia(uuid,text,uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function aplicacao.backend_preparar_sintese_ia(uuid,text,uuid,uuid,uuid,text) to service_role;
