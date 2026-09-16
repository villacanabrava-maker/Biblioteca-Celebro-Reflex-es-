-- 0020_artefatos_intermediarios_processamento
-- Persiste metadados/proveniência de artefatos intermediários sem confundi-los
-- com um Documento Processado publicado. O conteúdo grande permanece em Storage privado.

insert into storage.buckets (id, name, public)
values ('artefatos-processamento', 'artefatos-processamento', false)
on conflict (id) do update set public = false;

create table processamento.artefatos_execucao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  execucao_id uuid not null,
  tipo text not null,
  caminho_arquivo text not null,
  tipo_mime text not null,
  tamanho_bytes bigint not null,
  hash_sha256 text not null,
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  constraint artefatos_execucao_execucao_usuario_fk
    foreign key (execucao_id, usuario_id)
    references processamento.execucoes(id, usuario_id)
    on delete cascade,
  constraint artefatos_execucao_tipo_check
    check (tipo in ('conteudo_extraido', 'conteudo_normalizado')),
  constraint artefatos_execucao_tamanho_check check (tamanho_bytes >= 0),
  constraint artefatos_execucao_hash_check check (hash_sha256 ~ '^[0-9a-f]{64}$'),
  constraint artefatos_execucao_metadados_objeto_check check (jsonb_typeof(metadados) = 'object'),
  constraint artefatos_execucao_tipo_unico unique (execucao_id, tipo),
  constraint artefatos_execucao_caminho_unico unique (caminho_arquivo)
);

create index artefatos_execucao_execucao_usuario_idx
  on processamento.artefatos_execucao (execucao_id, usuario_id);
create index artefatos_execucao_usuario_criado_idx
  on processamento.artefatos_execucao (usuario_id, criado_em desc);

alter table processamento.artefatos_execucao enable row level security;
revoke all on processamento.artefatos_execucao from public, anon, authenticated, service_role;

create or replace function aplicacao.backend_obter_artefato_execucao(
  p_execucao_id uuid,
  p_tipo text
)
returns table (
  artefato_id uuid,
  usuario_id uuid,
  execucao_id uuid,
  tipo text,
  caminho_arquivo text,
  tipo_mime text,
  tamanho_bytes bigint,
  hash_sha256 text,
  metadados jsonb,
  criado_em timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select a.id, a.usuario_id, a.execucao_id, a.tipo, a.caminho_arquivo,
         a.tipo_mime, a.tamanho_bytes, a.hash_sha256, a.metadados, a.criado_em
  from processamento.artefatos_execucao a
  where a.execucao_id = p_execucao_id and a.tipo = p_tipo
  limit 1
$$;

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
  if p_tipo not in ('conteudo_extraido', 'conteudo_normalizado') then
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

revoke all on function aplicacao.backend_obter_artefato_execucao(uuid, text) from public, anon, authenticated;
revoke all on function aplicacao.backend_registrar_artefato_execucao(uuid, text, text, text, bigint, text, jsonb) from public, anon, authenticated;

grant execute on function aplicacao.backend_obter_artefato_execucao(uuid, text) to service_role;
grant execute on function aplicacao.backend_registrar_artefato_execucao(uuid, text, text, text, bigint, text, jsonb) to service_role;
