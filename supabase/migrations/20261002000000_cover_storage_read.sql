-- The cover upload flow (POST /api/studio/covers, action=finalize) downloads the freshly
-- uploaded object to validate it with sharp before linking it to stories.cover_path. No
-- SELECT policy ever granted staff read access to a story-public cover they just uploaded
-- but haven't linked yet, so that download always failed RLS and surfaced as a misleading
-- "file not found or too large" error regardless of actual file size.
drop policy if exists "staff read story covers" on storage.objects;
create policy "staff read story covers" on storage.objects for select to authenticated
  using (bucket_id = 'story-public' and pixinia_private.can_manage_media(bucket_id, name));
