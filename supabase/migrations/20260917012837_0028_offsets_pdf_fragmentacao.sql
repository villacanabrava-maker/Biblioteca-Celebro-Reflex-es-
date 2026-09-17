-- 0028_offsets_pdf_fragmentacao
-- Preserva a posição exata do início de uma seção dentro da página PDF.
-- Isso evita duplicação ou perda de texto quando duas seções começam na
-- mesma página (ou quando a próxima seção começa no meio de uma página).

alter table processamento.secoes
  add column offset_pagina_inicio integer;

alter table processamento.secoes
  add constraint secoes_offset_pagina_inicio_check check (
    offset_pagina_inicio is null or offset_pagina_inicio >= 0
  );

comment on column processamento.secoes.offset_pagina_inicio is
  'Offset em caracteres dentro de pagina_inicial para localizar com precisao o inicio da secao em PDF. Nulo em texto/markdown.';

-- Recria a materialização da hierarquia para persistir o offset relativo
-- à página sem alterar a assinatura pública da função.
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
      ordem, nivel_hierarquico, pagina_inicial, pagina_final, indice_inicio, indice_fim,
      offset_pagina_inicio
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
      nullif(v_item->>'indice_fim', '')::integer,
      nullif(v_item->>'offset_pagina_inicio', '')::integer
    );
  end loop;

  return query select v_documento_id, true;
end;
$$;

revoke all on function aplicacao.backend_criar_hierarquia_documento(uuid, jsonb) from public, anon, authenticated;
grant execute on function aplicacao.backend_criar_hierarquia_documento(uuid, jsonb) to service_role;

-- A lista de seções ganha o offset de página. Como RETURNS TABLE faz parte
-- do tipo da função, é necessário recriar esta RPC em vez de CREATE OR REPLACE.
drop function aplicacao.backend_listar_secoes_documento(uuid);

create function aplicacao.backend_listar_secoes_documento(p_execucao_id uuid)
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
  indice_fim integer,
  offset_pagina_inicio integer
)
language sql
security definer
set search_path = ''
as $$
  select d.id, s.id, s.secao_pai_id, s.codigo, s.tipo, s.titulo, s.ordem, s.nivel_hierarquico,
         s.pagina_inicial, s.pagina_final, s.indice_inicio, s.indice_fim, s.offset_pagina_inicio
  from processamento.documentos_processados d
  join processamento.secoes s on s.documento_processado_id = d.id and s.usuario_id = d.usuario_id
  where d.execucao_id = p_execucao_id
  order by s.ordem
$$;

revoke all on function aplicacao.backend_listar_secoes_documento(uuid) from public, anon, authenticated;
grant execute on function aplicacao.backend_listar_secoes_documento(uuid) to service_role;

-- Validação estrutural da própria migration.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'processamento' and table_name = 'secoes' and column_name = 'offset_pagina_inicio'
  ) then
    raise exception 'offset_pagina_inicio nao foi criada';
  end if;
end $$;
