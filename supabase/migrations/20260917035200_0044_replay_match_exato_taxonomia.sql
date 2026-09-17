-- 0044_replay_match_exato_taxonomia
-- Replay de normalizacao exata deve apenas verificar classificacao persistida.
-- Nunca cria classificacao nova quando a etapa esta em modo de replay.

create function aplicacao.backend_obter_classificacao_taxonomia_exata(
  p_execucao_id uuid,
  p_elemento_id uuid,
  p_conceito_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_versao_taxonomia_id uuid;
  v_titulo text;
  v_termo_normalizado text;
  v_quantidade_conceitos_exatos integer;
  v_classificacao_id uuid;
begin
  select e.usuario_id, e.versao_taxonomia_id, el.titulo
    into v_usuario_id, v_versao_taxonomia_id, v_titulo
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

  v_termo_normalizado := taxonomia.normalizar_termo_taxonomico(v_titulo);
  if v_termo_normalizado is null or length(v_termo_normalizado) = 0 then
    raise exception 'elemento_normalizacao_titulo_vazio' using errcode = '22023';
  end if;

  select count(distinct c.id)
    into v_quantidade_conceitos_exatos
  from taxonomia.conceitos c
  join taxonomia.termos t on t.conceito_id = c.id
  where c.versao_taxonomia_id = v_versao_taxonomia_id
    and c.estado = 'ativo'
    and t.termo_normalizado = v_termo_normalizado;

  if v_quantidade_conceitos_exatos <> 1 then
    return null;
  end if;

  if not exists (
    select 1
    from taxonomia.conceitos c
    join taxonomia.termos t on t.conceito_id = c.id
    where c.id = p_conceito_id
      and c.versao_taxonomia_id = v_versao_taxonomia_id
      and c.estado = 'ativo'
      and t.termo_normalizado = v_termo_normalizado
  ) then
    return null;
  end if;

  select ce.id into v_classificacao_id
  from taxonomia.classificacoes_elementos ce
  where ce.usuario_id = v_usuario_id
    and ce.elemento_id = p_elemento_id
    and ce.conceito_id = p_conceito_id
    and ce.papel = 'principal'
    and ce.confianca = 1;

  return v_classificacao_id;
end;
$$;

revoke all on function aplicacao.backend_obter_classificacao_taxonomia_exata(uuid,uuid,uuid)
  from public, anon, authenticated;
grant execute on function aplicacao.backend_obter_classificacao_taxonomia_exata(uuid,uuid,uuid)
  to service_role;

do $$
begin
  if has_function_privilege(
    'anon',
    'aplicacao.backend_obter_classificacao_taxonomia_exata(uuid,uuid,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_obter_classificacao_taxonomia_exata(uuid,uuid,uuid)',
    'EXECUTE'
  ) then
    raise exception 'rpc_replay_match_exato_taxonomia_exposta_ao_cliente';
  end if;
end $$;
