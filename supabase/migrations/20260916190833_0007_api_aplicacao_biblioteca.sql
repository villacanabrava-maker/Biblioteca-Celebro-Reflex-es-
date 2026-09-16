-- 0007_api_aplicacao_biblioteca
-- Expõe somente funções controladas no schema aplicacao.
-- As tabelas internas de biblioteca permanecem fora da Data API.

-- A lista de schemas expostos passa a ser controlada por migration.
-- Isso torna a configuração reprodutível, mas significa que alterações futuras
-- na lista também devem ser feitas por migration e não silenciosamente no Dashboard.
alter role authenticator
  set pgrst.db_schemas = 'public, graphql_public, aplicacao';

revoke all on schema aplicacao from public, anon;
grant usage on schema aplicacao to authenticated, service_role;

-- Novas funções não devem nascer executáveis por PUBLIC.
alter default privileges for role postgres in schema aplicacao
  revoke execute on functions from public;

create or replace function aplicacao.listar_obras()
returns table (
  id uuid,
  codigo text,
  titulo text,
  tipo_obra text,
  autoria text,
  participacao_cerebro text,
  idioma text,
  descricao text,
  estado text,
  criado_em timestamptz,
  versao_id uuid,
  numero_versao integer,
  nome_arquivo text,
  estado_processamento text,
  versao_criada_em timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
begin
  if v_usuario_id is null then
    raise exception 'Autenticacao obrigatoria'
      using errcode = '42501';
  end if;

  return query
  select
    o.id,
    o.codigo,
    o.titulo_exibicao,
    o.tipo_obra,
    o.autoria,
    o.participacao_cerebro,
    o.idioma,
    o.descricao,
    o.estado,
    o.criado_em,
    v.id,
    v.numero_versao,
    v.nome_arquivo,
    v.estado_processamento,
    v.criado_em
  from biblioteca.obras o
  left join lateral (
    select
      vo.id,
      vo.numero_versao,
      vo.nome_arquivo,
      vo.estado_processamento,
      vo.criado_em
    from biblioteca.versoes_obras vo
    where vo.obra_id = o.id
      and vo.usuario_id = v_usuario_id
    order by vo.numero_versao desc
    limit 1
  ) v on true
  where o.usuario_id = v_usuario_id
    and o.estado <> 'excluida'
  order by o.criado_em desc;
end;
$$;

comment on function aplicacao.listar_obras() is
  'Lista somente as obras do usuário autenticado e a versão física mais recente de cada obra.';

create or replace function aplicacao.registrar_obra_arquivo(
  p_obra_id uuid,
  p_versao_id uuid,
  p_titulo text,
  p_tipo_obra text,
  p_autoria text,
  p_participacao_cerebro text,
  p_idioma text,
  p_nome_arquivo text,
  p_caminho_arquivo text,
  p_tipo_mime text,
  p_tamanho_bytes bigint,
  p_hash_sha256 text,
  p_extensao text default null,
  p_descricao text default null,
  p_data_producao date default null,
  p_autor_original text default null
)
returns table (
  obra_id uuid,
  obra_codigo text,
  versao_id uuid,
  versao_codigo text,
  caminho_arquivo text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_extensao text;
  v_nome_original_storage text;
  v_caminho_esperado text;
  v_obra_codigo text;
  v_versao_codigo text;
begin
  if v_usuario_id is null then
    raise exception 'Autenticacao obrigatoria'
      using errcode = '42501';
  end if;

  if p_obra_id is null or p_versao_id is null then
    raise exception 'Identificadores de obra e versao sao obrigatorios'
      using errcode = '22023';
  end if;

  if nullif(trim(p_titulo), '') is null then
    raise exception 'Titulo obrigatorio'
      using errcode = '22023';
  end if;

  if nullif(trim(p_nome_arquivo), '') is null then
    raise exception 'Nome de arquivo obrigatorio'
      using errcode = '22023';
  end if;

  if nullif(trim(p_tipo_mime), '') is null then
    raise exception 'Tipo MIME obrigatorio'
      using errcode = '22023';
  end if;

  if nullif(trim(p_idioma), '') is null then
    raise exception 'Idioma obrigatorio'
      using errcode = '22023';
  end if;

  if p_tamanho_bytes < 0 then
    raise exception 'Tamanho de arquivo invalido'
      using errcode = '22023';
  end if;

  if p_hash_sha256 !~ '^[0-9A-Fa-f]{64}$' then
    raise exception 'Hash SHA-256 invalido'
      using errcode = '22023';
  end if;

  v_extensao := nullif(
    lower(regexp_replace(coalesce(trim(p_extensao), ''), '^\.+', '')),
    ''
  );

  v_nome_original_storage := 'original' ||
    case when v_extensao is null then '' else '.' || v_extensao end;

  v_caminho_esperado :=
    v_usuario_id::text || '/' ||
    p_obra_id::text || '/' ||
    p_versao_id::text || '/' ||
    v_nome_original_storage;

  if p_caminho_arquivo <> v_caminho_esperado then
    raise exception 'Caminho de arquivo nao corresponde ao usuario/obra/versao autenticados'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from storage.objects so
    where so.bucket_id = 'originais-biblioteca'
      and so.name = v_caminho_esperado
  ) then
    raise exception 'Arquivo original nao encontrado no Storage privado'
      using errcode = '22023';
  end if;

  v_obra_codigo := 'OBR-' || upper(substr(replace(p_obra_id::text, '-', ''), 1, 12));
  v_versao_codigo := 'VOB-' || upper(substr(replace(p_versao_id::text, '-', ''), 1, 12));

  insert into biblioteca.obras (
    id,
    usuario_id,
    codigo,
    titulo_original,
    titulo_exibicao,
    titulo_normalizado,
    tipo_obra,
    autoria,
    participacao_cerebro,
    autor_original,
    idioma,
    descricao,
    data_producao,
    precisao_data,
    estado
  )
  values (
    p_obra_id,
    v_usuario_id,
    v_obra_codigo,
    trim(p_titulo),
    trim(p_titulo),
    lower(extensions.unaccent(trim(p_titulo))),
    p_tipo_obra,
    p_autoria,
    p_participacao_cerebro,
    nullif(trim(p_autor_original), ''),
    trim(p_idioma),
    nullif(trim(p_descricao), ''),
    p_data_producao,
    case when p_data_producao is null then 'desconhecida' else 'exata' end,
    'ativa'
  );

  insert into biblioteca.versoes_obras (
    id,
    usuario_id,
    obra_id,
    codigo,
    numero_versao,
    nome_arquivo,
    caminho_arquivo,
    tipo_mime,
    extensao,
    tamanho_bytes,
    hash_sha256,
    estado_processamento
  )
  values (
    p_versao_id,
    v_usuario_id,
    p_obra_id,
    v_versao_codigo,
    1,
    trim(p_nome_arquivo),
    v_caminho_esperado,
    trim(p_tipo_mime),
    v_extensao,
    p_tamanho_bytes,
    lower(p_hash_sha256),
    'recebido'
  );

  return query
  select
    p_obra_id,
    v_obra_codigo,
    p_versao_id,
    v_versao_codigo,
    v_caminho_esperado;
end;
$$;

comment on function aplicacao.registrar_obra_arquivo(
  uuid, uuid, text, text, text, text, text, text, text, text, bigint, text, text, text, date, text
) is
  'Registra atomicamente a obra e sua primeira versão após confirmar que o original já existe no Storage privado do usuário autenticado.';

-- Fecha execução por padrão e reabre somente as RPCs previstas.
revoke all on all functions in schema aplicacao from public, anon, authenticated;

grant execute on function aplicacao.listar_obras()
  to authenticated;

grant execute on function aplicacao.registrar_obra_arquivo(
  uuid, uuid, text, text, text, text, text, text, text, text, bigint, text, text, text, date, text
) to authenticated;

notify pgrst, 'reload config';
notify pgrst, 'reload schema';

-- Validação estrutural.
do $$
declare
  schemas_expostos text;
  func_count integer;
begin
  select setting
  into schemas_expostos
  from pg_settings
  where name = 'pgrst.db_schemas';

  -- pg_settings pode não refletir parâmetros de role no mesmo contexto em todas
  -- as versões, por isso a verificação definitiva será feita após a migration
  -- consultando pg_roles. Aqui validamos as funções e grants.
  select count(*)
  into func_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'aplicacao'
    and p.proname in ('listar_obras', 'registrar_obra_arquivo');

  if func_count <> 2 then
    raise exception 'Esperadas 2 funcoes da API da Biblioteca, encontradas %', func_count;
  end if;

  if has_function_privilege('anon', 'aplicacao.listar_obras()', 'EXECUTE') then
    raise exception 'anon nao pode executar aplicacao.listar_obras';
  end if;

  if not has_function_privilege('authenticated', 'aplicacao.listar_obras()', 'EXECUTE') then
    raise exception 'authenticated precisa executar aplicacao.listar_obras';
  end if;
end $$;
