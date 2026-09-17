-- 0026_corrige_contagem_fragmentos
-- Corrige aplicacao.backend_criar_fragmentos_documento (0025): o
-- "GET DIAGNOSTICS ... = row_count" logo após o laço de inserção só
-- reflete a última linha inserida (1), não o total do lote. Detectado
-- manualmente contra o schema real dentro de uma transação com ROLLBACK
-- (nenhum dado permanente foi criado): a ligação fragmento_anterior/
-- seguinte funcionava corretamente entre os fragmentos, mas a contagem
-- retornada e gravada em documentos_processados.quantidade_fragmentos
-- ficava sempre em 1, mesmo com mais fragmentos inseridos.

create or replace function aplicacao.backend_criar_fragmentos_documento(
  p_execucao_id uuid,
  p_fragmentos jsonb
)
returns table (documento_processado_id uuid, criado boolean, quantidade integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_documento_id uuid;
  v_item jsonb;
  v_quantidade_existente integer;
  v_quantidade_inserida integer;
begin
  if p_fragmentos is null or jsonb_typeof(p_fragmentos) <> 'array' or jsonb_array_length(p_fragmentos) < 1 then
    raise exception 'fragmentos_devem_ser_lista_nao_vazia' using errcode = '22023';
  end if;

  select d.usuario_id, d.id into v_usuario_id, v_documento_id
  from processamento.documentos_processados d
  where d.execucao_id = p_execucao_id;

  if v_documento_id is null then
    raise exception 'documento_processado_nao_encontrado' using errcode = 'P0002';
  end if;

  select count(*) into v_quantidade_existente
  from processamento.fragmentos f
  where f.documento_processado_id = v_documento_id;

  if v_quantidade_existente > 0 then
    return query select v_documento_id, false, v_quantidade_existente;
    return;
  end if;

  for v_item in select * from jsonb_array_elements(p_fragmentos)
  loop
    insert into processamento.fragmentos (
      id, usuario_id, documento_processado_id, secao_id, codigo, ordem,
      pagina_inicial, pagina_final, conteudo, conteudo_contextualizado, quantidade_tokens
    ) values (
      (v_item->>'id')::uuid,
      v_usuario_id,
      v_documento_id,
      (v_item->>'secao_id')::uuid,
      v_item->>'codigo',
      (v_item->>'ordem')::integer,
      nullif(v_item->>'pagina_inicial', '')::integer,
      nullif(v_item->>'pagina_final', '')::integer,
      v_item->>'conteudo',
      v_item->>'conteudo_contextualizado',
      (v_item->>'quantidade_tokens')::integer
    );
  end loop;

  -- Conta de verdade após o laço inteiro, em vez de confiar em
  -- GET DIAGNOSTICS (que só veria a última linha inserida).
  select count(*) into v_quantidade_inserida
  from processamento.fragmentos
  where documento_processado_id = v_documento_id;

  update processamento.fragmentos f
  set fragmento_anterior_id = anterior.id
  from processamento.fragmentos anterior
  where f.documento_processado_id = v_documento_id
    and anterior.documento_processado_id = v_documento_id
    and anterior.ordem = f.ordem - 1;

  update processamento.fragmentos anterior
  set fragmento_seguinte_id = seguinte.id
  from processamento.fragmentos seguinte
  where anterior.documento_processado_id = v_documento_id
    and seguinte.documento_processado_id = v_documento_id
    and seguinte.ordem = anterior.ordem + 1;

  update processamento.documentos_processados
  set quantidade_fragmentos = v_quantidade_inserida
  where id = v_documento_id;

  return query select v_documento_id, true, v_quantidade_inserida;
end;
$$;

revoke all on function aplicacao.backend_criar_fragmentos_documento(uuid, jsonb) from public, anon, authenticated;
grant execute on function aplicacao.backend_criar_fragmentos_documento(uuid, jsonb) to service_role;
