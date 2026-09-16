-- 0006_storage_biblioteca
-- Bucket privado e políticas de acesso dos arquivos originais da Biblioteca.
--
-- O nome do objeto no Storage será gerado no formato:
-- {usuario_id}/{obra_id}/{versao_id}/original.ext
--
-- O Dicionário ainda não congelou todos os tipos/tamanhos de arquivo aceitos,
-- portanto esta migration não impõe allowed_mime_types nem file_size_limit.

insert into storage.buckets (id, name, public)
values ('originais-biblioteca', 'originais-biblioteca', false)
on conflict (id) do update
set name = excluded.name,
    public = false;

-- Usuário autenticado só pode visualizar arquivos cujo primeiro segmento
-- da pasta seja o próprio auth.uid(). Isso também permite que arquivos
-- enviados pelo backend em nome do usuário continuem acessíveis ao usuário.
create policy originais_biblioteca_selecionar_proprios
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'originais-biblioteca'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy originais_biblioteca_inserir_proprios
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'originais-biblioteca'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy originais_biblioteca_atualizar_proprios
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'originais-biblioteca'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'originais-biblioteca'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy originais_biblioteca_excluir_proprios
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'originais-biblioteca'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Validação estrutural da configuração de Storage.
do $$
declare
  bucket_privado boolean;
  policy_count integer;
begin
  select (public = false)
  into bucket_privado
  from storage.buckets
  where id = 'originais-biblioteca';

  if bucket_privado is not true then
    raise exception 'Bucket originais-biblioteca nao existe ou nao esta privado';
  end if;

  select count(*)
  into policy_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname in (
      'originais_biblioteca_selecionar_proprios',
      'originais_biblioteca_inserir_proprios',
      'originais_biblioteca_atualizar_proprios',
      'originais_biblioteca_excluir_proprios'
    );

  if policy_count <> 4 then
    raise exception 'Esperadas 4 policies do Storage da Biblioteca, encontradas %', policy_count;
  end if;
end $$;
