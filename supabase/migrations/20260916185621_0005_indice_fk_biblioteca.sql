-- 0005_indice_fk_biblioteca
-- Cobre a FK composta (obra_id, usuario_id) de biblioteca.versoes_obras.
-- O advisor de performance do Supabase detectou a ausência deste índice após
-- a aplicação de 0004_biblioteca.

create index versoes_obras_obra_usuario_idx
  on biblioteca.versoes_obras (obra_id, usuario_id);

comment on index biblioteca.versoes_obras_obra_usuario_idx is
  'Índice de suporte à FK composta que garante integridade multiusuário entre versão e obra.';

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'biblioteca'
      and tablename = 'versoes_obras'
      and indexname = 'versoes_obras_obra_usuario_idx'
  ) then
    raise exception 'Indice de suporte a FK nao foi criado';
  end if;
end $$;
