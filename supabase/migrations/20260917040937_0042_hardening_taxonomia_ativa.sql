-- 0042_hardening_taxonomia_ativa
-- 1. Somente conceitos canônicos ativos podem ser recuperados/reutilizados.
-- 2. O papel sugerido para uma proposta pertence à relação elemento→proposta
--    e precisa ser preservado junto da proveniência.

alter table taxonomia.fontes_propostas_conceitos
  add column papel_proposto text not null default 'principal';

alter table taxonomia.fontes_propostas_conceitos
  add constraint fontes_propostas_papel_check
  check (papel_proposto in ('principal', 'secundario', 'contextual', 'oposicao'));

alter table taxonomia.fontes_propostas_conceitos
  alter column papel_proposto drop default;

create or replace function aplicacao.backend_buscar_candidatos_taxonomia(
  p_execucao_id uuid,
  p_elemento_id uuid,
  p_limite integer default 8
)
returns table (
  conceito_id uuid,
  termo_preferencial text,
  definicao text,
  dominio text,
  termo_correspondente text,
  tipo_termo text,
  tipo_correspondencia text,
  similaridade real
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_versao_taxonomia_id uuid;
  v_titulo text;
  v_termo_busca text;
  v_limite integer;
begin
  v_limite := greatest(1, least(coalesce(p_limite, 8), 20));

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

  v_termo_busca := taxonomia.normalizar_termo_taxonomico(v_titulo);
  if v_termo_busca is null or length(v_termo_busca) = 0 then
    raise exception 'elemento_normalizacao_titulo_vazio' using errcode = '22023';
  end if;

  return query
  with candidatos as (
    select
      c.id as conceito_id,
      c.termo_preferencial,
      c.definicao,
      c.dominio,
      t.termo as termo_correspondente,
      t.tipo as tipo_termo,
      case
        when t.termo_normalizado = v_termo_busca then 'exata'::text
        else 'similaridade'::text
      end as tipo_correspondencia,
      case
        when t.termo_normalizado = v_termo_busca then 1::real
        else extensions.similarity(t.termo_normalizado, v_termo_busca)
      end as similaridade,
      row_number() over (
        partition by c.id
        order by
          (t.termo_normalizado = v_termo_busca) desc,
          extensions.similarity(t.termo_normalizado, v_termo_busca) desc,
          case t.tipo
            when 'preferencial' then 1
            when 'sinonimo' then 2
            when 'alternativo' then 3
            when 'historico' then 4
            else 5
          end,
          t.termo
      ) as ordem_conceito
    from taxonomia.conceitos c
    join taxonomia.termos t on t.conceito_id = c.id
    where c.versao_taxonomia_id = v_versao_taxonomia_id
      and c.estado = 'ativo'
      and (
        t.termo_normalizado = v_termo_busca
        or t.termo_normalizado OPERATOR(extensions.%) v_termo_busca
      )
  )
  select
    candidatos.conceito_id,
    candidatos.termo_preferencial,
    candidatos.definicao,
    candidatos.dominio,
    candidatos.termo_correspondente,
    candidatos.tipo_termo,
    candidatos.tipo_correspondencia,
    candidatos.similaridade
  from candidatos
  where candidatos.ordem_conceito = 1
  order by
    (candidatos.tipo_correspondencia = 'exata') desc,
    candidatos.similaridade desc,
    candidatos.termo_preferencial,
    candidatos.conceito_id
  limit v_limite;
end;
$$;

create or replace function aplicacao.backend_classificar_elemento_taxonomia_exata(
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
    raise exception 'match_exato_taxonomia_ambiguo_ou_ausente' using errcode = '22023';
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
    raise exception 'conceito_match_exato_taxonomia_invalido' using errcode = '22023';
  end if;

  select ce.id into v_classificacao_id
  from taxonomia.classificacoes_elementos ce
  where ce.usuario_id = v_usuario_id
    and ce.elemento_id = p_elemento_id
    and ce.conceito_id = p_conceito_id
    and ce.papel = 'principal';

  if v_classificacao_id is not null then
    return v_classificacao_id;
  end if;

  insert into taxonomia.classificacoes_elementos (
    usuario_id,
    elemento_id,
    conceito_id,
    papel,
    confianca
  ) values (
    v_usuario_id,
    p_elemento_id,
    p_conceito_id,
    'principal',
    1
  )
  returning id into v_classificacao_id;

  return v_classificacao_id;
end;
$$;

-- Confirma que as duas RPCs seguem exclusivas ao backend após o replace.
do $$
begin
  if has_function_privilege(
    'anon',
    'aplicacao.backend_buscar_candidatos_taxonomia(uuid,uuid,integer)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_buscar_candidatos_taxonomia(uuid,uuid,integer)',
    'EXECUTE'
  ) then
    raise exception 'rpc_candidatos_taxonomia_exposta_ao_cliente';
  end if;

  if has_function_privilege(
    'anon',
    'aplicacao.backend_classificar_elemento_taxonomia_exata(uuid,uuid,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'aplicacao.backend_classificar_elemento_taxonomia_exata(uuid,uuid,uuid)',
    'EXECUTE'
  ) then
    raise exception 'rpc_classificacao_exata_taxonomia_exposta_ao_cliente';
  end if;
end $$;
