-- 0023_artefato_estrutura_identificada
-- Autoriza o novo tipo de artefato intermediário 'estrutura_identificada',
-- produzido pela etapa identificar_estrutura. Segue o mesmo modelo de
-- 0020/0021: metadados/proveniência em Postgres, conteúdo em Storage
-- privado, sem GRANT novo para anon/authenticated.

begin;

alter table processamento.artefatos_execucao
  drop constraint artefatos_execucao_tipo_check;

alter table processamento.artefatos_execucao
  add constraint artefatos_execucao_tipo_check
  check (tipo in ('conteudo_extraido', 'conteudo_normalizado', 'estrutura_identificada'));

create or replace function aplicacao.backend_registrar_artefato_execucao(
  p_execucao_id uuid,
  p_tipo text,
  p_caminho_arquivo text,
  p_tipo_mime text,
  p_tamanho_bytes bigint,
  p_hash_sha256 text,
  p_metadados jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_artefato_id uuid;
  v_hash_existente text;
  v_caminho_existente text;
  v_caminho_esperado text;
begin
  if p_tipo not in ('conteudo_extraido', 'conteudo_normalizado', 'estrutura_identificada') then
    raise exception 'tipo_artefato_invalido' using errcode = '22023';
  end if;
  if p_tamanho_bytes is null or p_tamanho_bytes < 0 then
    raise exception 'tamanho_artefato_invalido' using errcode = '22023';
  end if;
  if p_hash_sha256 is null or lower(p_hash_sha256) !~ '^[0-9a-f]{64}$' then
    raise exception 'hash_artefato_invalido' using errcode = '22023';
  end if;
  if p_metadados is null or jsonb_typeof(p_metadados) <> 'object' then
    raise exception 'metadados_artefato_devem_ser_objeto' using errcode = '22023';
  end if;

  select e.usuario_id into v_usuario_id
  from processamento.execucoes e
  where e.id = p_execucao_id;

  if v_usuario_id is null then
    raise exception 'execucao_nao_encontrada' using errcode = 'P0002';
  end if;

  v_caminho_esperado := v_usuario_id::text || '/' || p_execucao_id::text || '/' || p_tipo || '.json';
  if p_caminho_arquivo is distinct from v_caminho_esperado then
    raise exception 'caminho_artefato_invalido' using errcode = '22023';
  end if;

  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'artefatos-processamento'
      and o.name = p_caminho_arquivo
  ) then
    raise exception 'artefato_storage_nao_encontrado' using errcode = 'P0002';
  end if;

  select a.id, a.hash_sha256, a.caminho_arquivo
    into v_artefato_id, v_hash_existente, v_caminho_existente
  from processamento.artefatos_execucao a
  where a.execucao_id = p_execucao_id and a.tipo = p_tipo
  for update;

  if v_artefato_id is not null then
    if v_hash_existente = lower(p_hash_sha256)
       and v_caminho_existente = p_caminho_arquivo then
      return v_artefato_id;
    end if;
    raise exception 'artefato_execucao_divergente' using errcode = '23505';
  end if;

  insert into processamento.artefatos_execucao (
    usuario_id, execucao_id, tipo, caminho_arquivo, tipo_mime,
    tamanho_bytes, hash_sha256, metadados
  ) values (
    v_usuario_id, p_execucao_id, p_tipo, p_caminho_arquivo, p_tipo_mime,
    p_tamanho_bytes, lower(p_hash_sha256), p_metadados
  )
  returning id into v_artefato_id;

  return v_artefato_id;
end;
$$;

-- A função é recriada com o mesmo dono/segurança; grants explícitos
-- permanecem os mesmos de 0020 e não precisam ser reafirmados porque
-- create or replace preserva ACL existente. Reafirmamos por clareza.
revoke all on function aplicacao.backend_registrar_artefato_execucao(uuid, text, text, text, bigint, text, jsonb) from public, anon, authenticated;
grant execute on function aplicacao.backend_registrar_artefato_execucao(uuid, text, text, text, bigint, text, jsonb) to service_role;

-- Validação estrutural da própria migration.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artefatos_execucao_tipo_check'
      and conrelid = 'processamento.artefatos_execucao'::regclass
      and pg_get_constraintdef(oid) ilike '%estrutura_identificada%'
  ) then
    raise exception 'Constraint artefatos_execucao_tipo_check nao inclui estrutura_identificada';
  end if;
end $$;

commit;
