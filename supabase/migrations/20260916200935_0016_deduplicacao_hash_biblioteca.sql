-- 0016_deduplicacao_hash_biblioteca
-- Deduplicação por usuario+SHA-256 com lock transacional, sem transformar o índice
-- recomendado pelo Dicionário em uma restrição UNIQUE estrutural.

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
  v_hash_normalizado text;
begin
  if v_usuario_id is null then
    raise exception 'Autenticacao obrigatoria' using errcode = '42501';
  end if;
  if p_obra_id is null or p_versao_id is null then
    raise exception 'Identificadores de obra e versao sao obrigatorios' using errcode = '22023';
  end if;
  if nullif(trim(p_titulo), '') is null then
    raise exception 'Titulo obrigatorio' using errcode = '22023';
  end if;
  if nullif(trim(p_nome_arquivo), '') is null then
    raise exception 'Nome de arquivo obrigatorio' using errcode = '22023';
  end if;
  if nullif(trim(p_tipo_mime), '') is null then
    raise exception 'Tipo MIME obrigatorio' using errcode = '22023';
  end if;
  if nullif(trim(p_idioma), '') is null then
    raise exception 'Idioma obrigatorio' using errcode = '22023';
  end if;
  if p_tamanho_bytes < 0 then
    raise exception 'Tamanho de arquivo invalido' using errcode = '22023';
  end if;
  if p_hash_sha256 !~ '^[0-9A-Fa-f]{64}$' then
    raise exception 'Hash SHA-256 invalido' using errcode = '22023';
  end if;

  v_hash_normalizado := lower(p_hash_sha256);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_usuario_id::text || ':' || v_hash_normalizado, 0)
  );

  if exists (
    select 1 from biblioteca.versoes_obras vo
    where vo.usuario_id = v_usuario_id
      and vo.hash_sha256 = v_hash_normalizado
  ) then
    raise exception using errcode = '23505', message = 'arquivo_duplicado_por_hash';
  end if;

  v_extensao := nullif(lower(regexp_replace(coalesce(trim(p_extensao), ''), '^\.+', '')), '');
  v_nome_original_storage := 'original' || case when v_extensao is null then '' else '.' || v_extensao end;
  v_caminho_esperado := v_usuario_id::text || '/' || p_obra_id::text || '/' || p_versao_id::text || '/' || v_nome_original_storage;

  if p_caminho_arquivo <> v_caminho_esperado then
    raise exception 'Caminho de arquivo nao corresponde ao usuario/obra/versao autenticados' using errcode = '22023';
  end if;

  if not exists (
    select 1 from storage.objects so
    where so.bucket_id = 'originais-biblioteca'
      and so.name = v_caminho_esperado
  ) then
    raise exception 'Arquivo original nao encontrado no Storage privado' using errcode = '22023';
  end if;

  v_obra_codigo := 'OBR-' || upper(substr(replace(p_obra_id::text, '-', ''), 1, 12));
  v_versao_codigo := 'VOB-' || upper(substr(replace(p_versao_id::text, '-', ''), 1, 12));

  insert into biblioteca.obras (
    id, usuario_id, codigo, titulo_original, titulo_exibicao, titulo_normalizado,
    tipo_obra, autoria, participacao_cerebro, autor_original, idioma, descricao,
    data_producao, precisao_data, estado
  ) values (
    p_obra_id, v_usuario_id, v_obra_codigo, trim(p_titulo), trim(p_titulo),
    lower(extensions.unaccent(trim(p_titulo))), p_tipo_obra, p_autoria,
    p_participacao_cerebro, nullif(trim(p_autor_original), ''), trim(p_idioma),
    nullif(trim(p_descricao), ''), p_data_producao,
    case when p_data_producao is null then 'desconhecida' else 'exata' end,
    'ativa'
  );

  insert into biblioteca.versoes_obras (
    id, usuario_id, obra_id, codigo, numero_versao, nome_arquivo, caminho_arquivo,
    tipo_mime, extensao, tamanho_bytes, hash_sha256, estado_processamento
  ) values (
    p_versao_id, v_usuario_id, p_obra_id, v_versao_codigo, 1, trim(p_nome_arquivo),
    v_caminho_esperado, trim(p_tipo_mime), v_extensao, p_tamanho_bytes,
    v_hash_normalizado, 'recebido'
  );

  return query
  select p_obra_id, v_obra_codigo, p_versao_id, v_versao_codigo, v_caminho_esperado;
end;
$$;

revoke all on function aplicacao.registrar_obra_arquivo(
  uuid, uuid, text, text, text, text, text, text, text, text, bigint, text, text, text, date, text
) from public, anon, authenticated;

grant execute on function aplicacao.registrar_obra_arquivo(
  uuid, uuid, text, text, text, text, text, text, text, text, bigint, text, text, text, date, text
) to authenticated;
