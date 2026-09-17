-- 0035_contrato_schema_sintese
-- Garante que o backend só receba configuração de síntese quando o JSON Schema
-- ativo no catálogo corresponder exatamente ao contrato estruturado esperado.

create or replace function aplicacao.backend_obter_config_sintese(p_identificador_modelo text)
returns table (
  modelo_ia_id uuid,
  identificador_modelo text,
  versao_prompt_id uuid,
  numero_versao_prompt integer,
  conteudo_prompt text,
  schema_saida jsonb
)
language sql
security definer
set search_path = ''
as $$
  select m.id, m.identificador_modelo, vp.id, vp.numero_versao, vp.conteudo, vp.schema_saida
  from sistema.modelos_ia m
  join sistema.prompts p on p.codigo = 'sintese_documental_hierarquica' and p.ativo = true
  join sistema.versoes_prompts vp on vp.prompt_id = p.id and vp.ativado_em is not null
  where m.provedor = 'openai'
    and m.identificador_modelo = p_identificador_modelo
    and m.finalidade = 'analise'
    and m.ativo = true
    and vp.schema_saida = '{"type":"object","properties":{"sintese":{"type":"string","minLength":1,"maxLength":12000}},"required":["sintese"],"additionalProperties":false}'::jsonb
  order by vp.numero_versao desc
  limit 1
$$;

revoke all on function aplicacao.backend_obter_config_sintese(text) from public, anon, authenticated;
grant execute on function aplicacao.backend_obter_config_sintese(text) to service_role;
