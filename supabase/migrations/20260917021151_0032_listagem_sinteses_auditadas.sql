-- 0032_listagem_sinteses_auditadas
-- Permite ao backend validar que uma síntese persistida foi produzida a partir
-- do mesmo hash de entrada, modelo e versão de prompt esperados no replay.

create function aplicacao.backend_listar_sinteses_auditadas_documento(p_execucao_id uuid)
returns table (
  documento_processado_id uuid,
  sintese_id uuid,
  tipo_alvo text,
  alvo_id uuid,
  nivel smallint,
  conteudo text,
  modelo_ia_id uuid,
  versao_prompt_id uuid,
  auditoria_id uuid,
  hash_entrada text
)
language sql
security definer
set search_path = ''
as $$
  select d.id, s.id, s.tipo_alvo, s.alvo_id, s.nivel, s.conteudo,
         s.modelo_ia_id, s.versao_prompt_id,
         a.id, a.referencias_entrada->>'hash_entrada'
  from processamento.documentos_processados d
  join processamento.sinteses s
    on s.documento_processado_id = d.id
   and s.usuario_id = d.usuario_id
  join lateral (
    select ai.id, ai.referencias_entrada, ai.concluido_em, ai.criado_em
    from auditoria.execucoes_ia ai
    where ai.usuario_id = d.usuario_id
      and ai.estado = 'concluida'
      and (ai.referencias_saida->>'sintese_id')::uuid = s.id
    order by ai.concluido_em desc nulls last, ai.criado_em desc
    limit 1
  ) a on true
  where d.execucao_id = p_execucao_id
  order by s.nivel desc, s.criado_em, s.id
$$;

revoke all on function aplicacao.backend_listar_sinteses_auditadas_documento(uuid) from public, anon, authenticated;
grant execute on function aplicacao.backend_listar_sinteses_auditadas_documento(uuid) to service_role;
