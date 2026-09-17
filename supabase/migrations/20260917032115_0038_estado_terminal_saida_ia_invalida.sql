-- 0038_estado_terminal_saida_ia_invalida
-- Permite encerrar uma chamada conhecida como `cancelada` quando o provedor
-- respondeu, mas a saída falhou em validação determinística local. Isso evita
-- nova cobrança automática para um resultado semanticamente inválido.

create or replace function aplicacao.backend_falhar_execucao_ia(
  p_auditoria_id uuid,
  p_estado text,
  p_erro text,
  p_duracao_ms bigint default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_estado not in ('falhou', 'incerta', 'cancelada') then
    raise exception 'estado_falha_ia_invalido' using errcode = '22023';
  end if;

  update auditoria.execucoes_ia
  set estado = p_estado,
      erro = left(coalesce(p_erro, 'erro_ia'), 2000),
      duracao_ms = p_duracao_ms,
      concluido_em = now()
  where id = p_auditoria_id
    and estado in ('reservada', 'em_execucao');

  return found;
end;
$$;

revoke all on function aplicacao.backend_falhar_execucao_ia(uuid,text,text,bigint)
  from public, anon, authenticated;
grant execute on function aplicacao.backend_falhar_execucao_ia(uuid,text,text,bigint)
  to service_role;
