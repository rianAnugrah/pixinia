-- A published set is immutable. Editors work in a separate draft set.
create table public.chapter_image_sets (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  node_id uuid not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  version integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  foreign key (node_id, story_id) references public.story_nodes(id, story_id) on delete cascade
);
create unique index chapter_one_draft on public.chapter_image_sets(node_id) where status = 'draft';
create unique index chapter_one_published on public.chapter_image_sets(node_id) where status = 'published';

create table public.chapter_images (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.chapter_image_sets(id) on delete cascade,
  position integer not null check (position > 0),
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  alt_text text not null check (char_length(alt_text) between 1 and 500),
  caption text check (char_length(caption) <= 2000),
  dialogue text check (char_length(dialogue) <= 2000),
  speaker text check (char_length(speaker) <= 200),
  source text not null check (source in ('upload','ai')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chapter_images_position_unique unique (set_id, position) deferrable initially deferred
);
create index chapter_images_set_order on public.chapter_images(set_id, position);
create unique index chapter_images_storage_path on public.chapter_images(storage_path, set_id);

alter table public.chapter_image_sets enable row level security;
alter table public.chapter_images enable row level security;
grant select on public.chapter_image_sets, public.chapter_images to anon, authenticated;
grant insert, update, delete on public.chapter_image_sets, public.chapter_images to authenticated;

create policy "staff read image sets" on public.chapter_image_sets for select to authenticated
  using (public.is_staff());
create policy "public read published image sets" on public.chapter_image_sets for select to anon, authenticated
  using (status = 'published' and exists (
    select 1 from public.stories s join public.story_nodes n on n.story_id = s.id
    where s.id = story_id and n.id = node_id and s.status = 'published'
      and s.visibility = 'public' and n.status = 'published'));
create policy "staff read images" on public.chapter_images for select to authenticated
  using (public.is_staff());
create policy "public read published images" on public.chapter_images for select to anon, authenticated
  using (exists (
    select 1 from public.chapter_image_sets cs
    join public.stories s on s.id = cs.story_id
    join public.story_nodes n on n.id = cs.node_id
    where cs.id = set_id and cs.status = 'published' and s.status = 'published'
      and s.visibility = 'public' and n.status = 'published'));

-- Authenticated clients cannot mutate editorial rows directly; use checked RPCs.
revoke insert, update, delete on public.chapter_image_sets, public.chapter_images from authenticated;

create or replace function public.begin_chapter_image_draft(p_node_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_story_id uuid; v_set_id uuid;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
  select story_id into v_story_id from public.story_nodes where id = p_node_id;
  if v_story_id is null then raise exception 'Chapter not found'; end if;
  select id into v_set_id from public.chapter_image_sets where node_id = p_node_id and status = 'draft';
  if v_set_id is not null then return v_set_id; end if;
  insert into public.chapter_image_sets(story_id,node_id,created_by)
    values(v_story_id,p_node_id,auth.uid()) returning id into v_set_id;
  insert into public.chapter_images(set_id,position,storage_path,mime_type,width,height,alt_text,caption,dialogue,speaker,source,created_by)
    select v_set_id,i.position,i.storage_path,i.mime_type,i.width,i.height,i.alt_text,i.caption,i.dialogue,i.speaker,i.source,i.created_by
    from public.chapter_images i join public.chapter_image_sets s on s.id = i.set_id
    where s.node_id = p_node_id and s.status = 'published';
  return v_set_id;
end $$;

create or replace function public.add_chapter_image(
  p_set_id uuid, p_path text, p_mime text, p_width integer, p_height integer,
  p_alt text, p_source text default 'upload')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_node_id uuid; v_id uuid; v_position integer;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
  select node_id into v_node_id from public.chapter_image_sets where id = p_set_id and status = 'draft' for update;
  if v_node_id is null then raise exception 'Draft not found'; end if;
  if p_path !~ ('^' || auth.uid()::text || '/' || v_node_id::text || '/[0-9a-f-]+[.](jpg|png|webp)$')
    then raise exception 'Invalid path'; end if;
  if p_mime not in ('image/jpeg','image/png','image/webp') or p_width < 1 or p_height < 1
    or char_length(trim(p_alt)) not between 1 and 500 or p_source not in ('upload','ai')
    then raise exception 'Invalid image metadata'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'story-private' and name = p_path)
    then raise exception 'Uploaded file not found'; end if;
  select coalesce(max(position),0)+1 into v_position from public.chapter_images where set_id = p_set_id;
  insert into public.chapter_images(set_id,position,storage_path,mime_type,width,height,alt_text,source,created_by)
    values(p_set_id,v_position,p_path,p_mime,p_width,p_height,trim(p_alt),p_source,auth.uid()) returning id into v_id;
  update public.chapter_image_sets set version = version + 1 where id = p_set_id;
  return v_id;
end $$;

create or replace function public.update_chapter_image(
  p_image_id uuid, p_alt text, p_caption text, p_dialogue text, p_speaker text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_set_id uuid;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
  select s.id into v_set_id from public.chapter_images i join public.chapter_image_sets s on s.id = i.set_id
    where i.id = p_image_id and s.status = 'draft' for update of s;
  if v_set_id is null or char_length(trim(p_alt)) not between 1 and 500 or char_length(coalesce(p_caption,'')) > 2000
    or char_length(coalesce(p_dialogue,'')) > 2000 or char_length(coalesce(p_speaker,'')) > 200
    then raise exception 'Invalid draft or metadata'; end if;
  update public.chapter_images set alt_text=trim(p_alt), caption=nullif(trim(p_caption),''),
    dialogue=nullif(trim(p_dialogue),''), speaker=nullif(trim(p_speaker),'') where id=p_image_id;
  update public.chapter_image_sets set version=version+1 where id=v_set_id;
end $$;

create or replace function public.move_chapter_image(p_image_id uuid, p_direction integer, p_version integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_set_id uuid; v_version integer; v_pos integer; v_other uuid; v_other_pos integer;
begin
  if auth.uid() is null or not public.is_staff() or p_direction not in (-1,1) then raise exception 'Not authorized'; end if;
  select s.id,s.version,i.position into v_set_id,v_version,v_pos
    from public.chapter_images i join public.chapter_image_sets s on s.id=i.set_id
    where i.id=p_image_id and s.status='draft' for update of s;
  if v_set_id is null then raise exception 'Draft not found'; end if;
  if v_version <> p_version then raise exception 'Draft changed; reload before moving'; end if;
  select id,position into v_other,v_other_pos from public.chapter_images where set_id=v_set_id
    and ((p_direction=1 and position>v_pos) or (p_direction=-1 and position<v_pos))
    order by case when p_direction=1 then position end asc,
             case when p_direction=-1 then position end desc limit 1;
  if v_other is null then return v_version; end if;
  update public.chapter_images set position=case when id=p_image_id then v_other_pos else v_pos end
    where id in (p_image_id,v_other);
  update public.chapter_image_sets set version=version+1 where id=v_set_id returning version into v_version;
  return v_version;
end $$;

create or replace function public.remove_chapter_image(p_image_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_set_id uuid;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
  select s.id into v_set_id from public.chapter_images i join public.chapter_image_sets s on s.id=i.set_id
    where i.id=p_image_id and s.status='draft' for update of s;
  if v_set_id is null then raise exception 'Draft not found'; end if;
  delete from public.chapter_images where id=p_image_id;
  update public.chapter_image_sets set version=version+1 where id=v_set_id;
end $$;

create or replace function public.publish_chapter_images(p_set_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_node_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin required'; end if;
  select node_id into v_node_id from public.chapter_image_sets where id=p_set_id and status='draft' for update;
  if v_node_id is null or not exists(select 1 from public.chapter_images where set_id=p_set_id)
    then raise exception 'Draft must contain images'; end if;
  if exists(select 1 from public.chapter_images i where i.set_id=p_set_id and not exists (
    select 1 from storage.objects o where o.bucket_id='story-private' and o.name=i.storage_path))
    then raise exception 'Image file missing'; end if;
  update public.chapter_image_sets set status='archived' where node_id=v_node_id and status='published';
  update public.chapter_image_sets set status='published',published_at=now() where id=p_set_id;
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'begin_chapter_image_draft(uuid)',
    'add_chapter_image(uuid,text,text,integer,integer,text,text)',
    'update_chapter_image(uuid,text,text,text,text)',
    'move_chapter_image(uuid,integer,integer)',
    'remove_chapter_image(uuid)',
    'publish_chapter_images(uuid)'] loop
      execute 'revoke all on function public.' || f || ' from public, anon';
      execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;

-- Signed upload creation checks INSERT; the token permits upload without exposing a secret.
create policy "staff upload chapter images" on storage.objects for insert to authenticated
  with check (bucket_id='story-private' and public.is_staff()
    and name ~ ('^' || auth.uid()::text || '/[0-9a-f-]+/[0-9a-f-]+[.](jpg|png|webp)$'));
create policy "staff preview chapter images" on storage.objects for select to authenticated
  using (bucket_id='story-private' and public.is_staff());
create policy "public read published chapter images" on storage.objects for select to anon, authenticated
  using (bucket_id='story-private' and exists (
    select 1 from public.chapter_images i join public.chapter_image_sets s on s.id=i.set_id
    join public.stories st on st.id=s.story_id join public.story_nodes n on n.id=s.node_id
    where i.storage_path=name and s.status='published' and st.status='published'
      and st.visibility='public' and n.status='published'));
