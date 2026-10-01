-- Covers are private Storage objects. Only the reader cover route issues a short-lived URL.
drop policy if exists "staff upload story covers" on storage.objects;
create policy "staff upload story covers" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'story-public'
    and public.is_staff()
    and name ~ '^covers/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
  );

drop policy if exists "staff update story covers" on storage.objects;
create policy "staff update story covers" on storage.objects for update to authenticated
  using (bucket_id = 'story-public' and public.is_staff())
  with check (bucket_id = 'story-public' and public.is_staff());
