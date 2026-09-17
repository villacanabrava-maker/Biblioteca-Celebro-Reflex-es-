-- 0029_listagem_fragmentos_replay
-- Exponibiliza ao backend, e somente a ele, a leitura dos fragmentos de uma
-- execucao para que replays duraveis possam verificar se o resultado
-- persistido continua exatamente coerente com a geracao deterministica.

create function aplicacao.backend_listar_fragmentos_documento(p_execucao_id uuid)
returns table (
  documento_processado_id uuid,
  fragmento_id uuid,
  secao_id uuid,
  codigo text,
  ordem integer,
  pagina_inicial integer,
  pagina_final integer,
  conteudo text,
  conteudo_contextualizado text,
  quantidade_tokens integer
)
language sql
security definer
set search_path = ''
as $$
  select d.id, f.id, f.secao_id, f.codigo, f.ordem,
         f.pagina_inicial, f.pagina_final, f.conteudo,
         f.conteudo_contextualizado, f.quantidade_tokens
  from processamento.documentos_processados d
  join processamento.fragmentos f
    on f.documento_processado_id = d.id
   and f.usuario_id = d.usuario_id
  where d.execucao_id = p_execucao_id
  order by f.ordem
$$;

revoke all on function aplicacao.backend_listar_fragmentos_documento(uuid) from public, anon, authenticated;
grant execute on function aplicacao.backend_listar_fragmentos_documento(uuid) to service_role;
