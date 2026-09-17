-- 0025_api_backend_fragmentos_documento
-- Adiciona posição em caracteres às seções (necessária para recortar o
-- texto exato de cada seção em texto/markdown) e cria as RPCs server-only
-- da etapa criar_fragmentos: listar seções do documento e materializar
-- processamento.fragmentos de forma idempotente.

alter table processamento.secoes
  add column indice_inicio integer,
  add column indice_fim integer;

alter table processamento.secoes
  add constraint secoes_indices_caracteres_check check (
    (indice_inicio is null and indice_fim is null)
    or (indice_inicio is not null and indice_fim is not null
        and indice_inicio >= 0 and indice_fim >= indice_inicio)
  );

comment on column processamento.secoes.indice_inicio is
  'Posição inicial (em caracteres) desta seção dentro do conteúdo normalizado, quando o formato é texto/markdown. Nula em PDF, que usa granularidade de página (pagina_inicial/pagina_final).';
comment on column processamento.secoes.indice_fim is
  'Posição final (em caracteres, exclusiva, como em string.slice) desta seção dentro do conteúdo normalizado. Nula em PDF.';

-- Recriação de 0024 apenas para também persistir indice_inicio/indice_fim.
-- Mesma assinatura, mesma lógica de derivação/idempotência.
create or replace function aplicacao.backend_criar_hierarquia_documento(
  p_execucao_id uuid,
  p_secoes jsonb
)
returns table (documento_processado_id uuid, criado boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_versao_obra_id uuid;
  v_obra_id uuid;
  v_versao_pipeline_id uuid;
  v_versao_taxonomia_id uuid;
  v_titulo text;
  v_documento_id uuid;
  v_codigo text;
  v_qtd_partes integer;
  v_qtd_capitulos integer;
  v_qtd_secoes integer;
  v_item jsonb;
begin
  if p_secoes is null or jsonb_typeof(p_secoes) <> 'array' or jsonb_array_length(p_secoes) < 1 then
    raise exception 'secoes_devem_ser_lista_nao_vazia' using errcode = '22023';
  end if;

  select e.usuario_id, e.versao_obra_id, vo.obra_id, e.versao_pipeline_id, e.versao_taxonomia_id,
         o.titulo_exibicao
    into v_usuario_id, v_versao_obra_id, v_obra_id, v_versao_pipeline_id, v_versao_taxonomia_id,
         v_titulo
  from processamento.execucoes e
  join biblioteca.versoes_obras vo on vo.id = e.versao_obra_id and vo.usuario_id = e.usuario_id
  join biblioteca.obras o on o.id = vo.obra_id and o.usuario_id = e.usuario_id
  where e.id = p_execucao_id;

  if v_usuario_id is null then
    raise exception 'execucao_nao_encontrada' using errcode = 'P0002';
  end if;

  select d.id into v_documento_id
  from processamento.documentos_processados d
  where d.execucao_id = p_execucao_id;

  if v_documento_id is not null then
    return query select v_documento_id, false;
    return;
  end if;

  select
    count(*) filter (where elem->>'tipo' = 'parte'),
    count(*) filter (where elem->>'tipo' = 'capitulo'),
    count(*) filter (where elem->>'tipo' in ('secao', 'subsecao', 'anexo', 'prefacio', 'posfacio'))
    into v_qtd_partes, v_qtd_capitulos, v_qtd_secoes
  from jsonb_array_elements(p_secoes) as elem;

  v_documento_id := gen_random_uuid();
  v_codigo := 'DOC-' || upper(substr(replace(v_documento_id::text, '-', ''), 1, 12));

  insert into processamento.documentos_processados (
    id, usuario_id, obra_id, versao_obra_id, execucao_id, codigo, titulo,
    quantidade_partes, quantidade_capitulos, quantidade_secoes,
    versao_pipeline_id, versao_taxonomia_id, estado, processado_em
  ) values (
    v_documento_id, v_usuario_id, v_obra_id, v_versao_obra_id, p_execucao_id, v_codigo, v_titulo,
    coalesce(v_qtd_partes, 0), coalesce(v_qtd_capitulos, 0), coalesce(v_qtd_secoes, 0),
    v_versao_pipeline_id, v_versao_taxonomia_id, 'candidato', now()
  );

  for v_item in select * from jsonb_array_elements(p_secoes)
  loop
    insert into processamento.secoes (
      id, usuario_id, documento_processado_id, secao_pai_id, codigo, tipo, titulo,
      ordem, nivel_hierarquico, pagina_inicial, pagina_final, indice_inicio, indice_fim
    ) values (
      (v_item->>'id')::uuid,
      v_usuario_id,
      v_documento_id,
      nullif(v_item->>'secao_pai_id', '')::uuid,
      v_item->>'codigo',
      v_item->>'tipo',
      v_item->>'titulo',
      (v_item->>'ordem')::integer,
      (v_item->>'nivel_hierarquico')::smallint,
      nullif(v_item->>'pagina_inicial', '')::integer,
      nullif(v_item->>'pagina_final', '')::integer,
      nullif(v_item->>'indice_inicio', '')::integer,
      nullif(v_item->>'indice_fim', '')::integer
    );
  end loop;

  return query select v_documento_id, true;
end;
$$;

revoke all on function aplicacao.backend_criar_hierarquia_documento(uuid, jsonb) from public, anon, authenticated;
grant execute on function aplicacao.backend_criar_hierarquia_documento(uuid, jsonb) to service_role;

-- Lista as seções já materializadas de um documento, para o backend
-- recortar o texto de cada uma e montar o breadcrumb de ancestrais.
create or replace function aplicacao.backend_listar_secoes_documento(p_execucao_id uuid)
returns table (
  documento_processado_id uuid,
  secao_id uuid,
  secao_pai_id uuid,
  codigo text,
  tipo text,
  titulo text,
  ordem integer,
  nivel_hierarquico smallint,
  pagina_inicial integer,
  pagina_final integer,
  indice_inicio integer,
  indice_fim integer
)
language sql
security definer
set search_path = ''
as $$
  select d.id, s.id, s.secao_pai_id, s.codigo, s.tipo, s.titulo, s.ordem, s.nivel_hierarquico,
         s.pagina_inicial, s.pagina_final, s.indice_inicio, s.indice_fim
  from processamento.documentos_processados d
  join processamento.secoes s on s.documento_processado_id = d.id and s.usuario_id = d.usuario_id
  where d.execucao_id = p_execucao_id
  order by s.ordem
$$;

revoke all on function aplicacao.backend_listar_secoes_documento(uuid) from public, anon, authenticated;
grant execute on function aplicacao.backend_listar_secoes_documento(uuid) to service_role;

-- Materializa processamento.fragmentos a partir da lista já resolvida pelo
-- backend (conteúdo recortado, contextualizado e contado). Idempotente: se
-- já existir qualquer fragmento para o documento, apenas informa quantos.
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

  get diagnostics v_quantidade_inserida = row_count;

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

-- Validação estrutural da própria migration.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'processamento' and table_name = 'secoes' and column_name = 'indice_inicio'
  ) then
    raise exception 'Coluna processamento.secoes.indice_inicio nao foi criada';
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'aplicacao' and p.proname = 'backend_criar_fragmentos_documento'
  ) then
    raise exception 'Funcao aplicacao.backend_criar_fragmentos_documento nao foi criada';
  end if;
end $$;
