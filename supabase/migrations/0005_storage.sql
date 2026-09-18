-- PrepSprint · 0005 · storage
--
-- Private bucket for uploaded PDFs. Paths are `<user_id>/<preparation_id>/<uuid>.pdf`
-- so ownership is the first path segment (see lib/supabase/storage.ts).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520,
  array['application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 20971520,
      allowed_mime_types = array['application/pdf'];

drop policy if exists "own files are readable" on storage.objects;
create policy "own files are readable"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own files are insertable" on storage.objects;
create policy "own files are insertable"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own files are deletable" on storage.objects;
create policy "own files are deletable"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
