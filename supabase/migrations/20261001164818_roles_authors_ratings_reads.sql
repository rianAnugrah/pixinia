-- Reader / Creator / Admin, with story ownership and server-timed reading sessions.
alter table public.profiles drop constraint profiles_role_check;
update public.profiles set role='creator' where role='editor';
alter table public.profiles add constraint profiles_role_check check(role in ('reader','creator','admin'));
alter table public.profiles add column is_active boolean not null default true;
alter table public.stories add column author_id uuid references public.profiles(id) on delete restrict;
alter table public.stories add column legacy_author_name text not null default 'Pixinia Editorial';
update public.stories s set author_id=s.created_by where exists(select 1 from public.profiles p where p.id=s.created_by);
create index stories_author_idx on public.stories(author_id);
-- Draft covers must never be downloadable through Storage's public bucket URL.
update storage.buckets set public=false where id='story-public';

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active and role in ('creator','admin'));
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active and role='admin');
$$;

create or replace function pixinia_private.active_user() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active);
$$;
create function pixinia_private.can_manage_story(p_story uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.stories s join public.profiles p on p.id=auth.uid()
 where s.id=p_story and p.is_active and (p.role='admin' or (p.role='creator' and s.author_id=p.id)));
$$;
create function pixinia_private.can_manage_node(p_node uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.story_nodes n where n.id=p_node and pixinia_private.can_manage_story(n.story_id));
$$;
create function pixinia_private.can_manage_set(p_set uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.chapter_image_sets s where s.id=p_set and pixinia_private.can_manage_story(s.story_id));
$$;
create function pixinia_private.can_manage_image(p_image uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.chapter_images i where i.id=p_image and pixinia_private.can_manage_set(i.set_id));
$$;
create function pixinia_private.can_manage_job(p_job uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.chapter_image_generation_jobs j where j.id=p_job and pixinia_private.can_manage_set(j.set_id));
$$;
create function pixinia_private.can_manage_asset(p_asset uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.story_assets a where a.id=p_asset and pixinia_private.can_manage_story(a.story_id));
$$;
create function pixinia_private.can_manage_project(p_project uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.production_projects p where p.id=p_project and pixinia_private.can_manage_story(p.story_id));
$$;
create function pixinia_private.can_manage_production_job(p_job uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.production_jobs j where j.id=p_job and pixinia_private.can_manage_story(j.story_id));
$$;
create function pixinia_private.can_manage_media(p_bucket text,p_name text) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_staff() then return false; end if;
 if public.is_admin() then return true; end if;
 if p_bucket='story-public' and p_name ~ '^covers/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then
   return pixinia_private.can_manage_story(split_part(p_name,'/',2)::uuid);
 end if;
 if p_bucket='story-private' and p_name ~ '^[0-9a-f-]{36}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then
   return pixinia_private.can_manage_node(split_part(p_name,'/',2)::uuid);
 end if;
 return exists(select 1 from public.story_assets a where a.storage_bucket=p_bucket and a.storage_path=p_name
   and pixinia_private.can_manage_story(a.story_id)) or exists(select 1 from public.stories s
   where p_bucket='story-public' and s.cover_path in (p_name,'story-public/'||p_name) and pixinia_private.can_manage_story(s.id));
end $$;

-- Policies use private helpers; no table or privileged mutation is exposed by this grant.
grant usage on schema pixinia_private to anon,authenticated;
do $$ declare f regprocedure; begin
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='pixinia_private' and (p.proname like 'can_manage_%' or p.proname='active_user') loop
  execute format('revoke all on function %s from public',f);
  execute format('grant execute on function %s to anon,authenticated',f);
 end loop;
end $$;
create function public.studio_can_manage_story(p_story_id uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select pixinia_private.can_manage_story(p_story_id);
$$;
revoke all on function public.studio_can_manage_story(uuid) from public,anon;
grant execute on function public.studio_can_manage_story(uuid) to authenticated;

-- Preserve every existing public visibility, paid-content and draft constraint while
-- replacing the global staff exemption in both permissive and restrictive policies.
do $$ declare p record; scope text; q text; c text; stmt text; begin
 for p in select * from pg_policies where schemaname in ('public','storage')
   and (coalesce(qual,'')||coalesce(with_check,'')) like '%is_staff()%' loop
  scope := case p.tablename
   when 'stories' then case when p.cmd='INSERT' then '(public.is_staff() and author_id=auth.uid() and created_by=auth.uid())' else 'pixinia_private.can_manage_story(id)' end
   when 'story_nodes' then 'pixinia_private.can_manage_story(story_id)'
   when 'story_choices' then 'pixinia_private.can_manage_story(story_id)'
   when 'story_assets' then 'pixinia_private.can_manage_story(story_id)'
   when 'story_asset_panels' then 'pixinia_private.can_manage_asset(asset_id)'
   when 'chapter_image_sets' then 'pixinia_private.can_manage_story(story_id)'
   when 'chapter_images' then 'pixinia_private.can_manage_set(set_id)'
   when 'chapter_image_generation_jobs' then 'pixinia_private.can_manage_set(set_id)'
   when 'studio_graph_drafts' then 'pixinia_private.can_manage_story(story_id)'
   when 'studio_graph_publications' then 'pixinia_private.can_manage_story(story_id)'
   when 'story_node_prose_drafts' then 'pixinia_private.can_manage_node(node_id)'
   when 'story_node_prose_publications' then 'pixinia_private.can_manage_node(node_id)'
   when 'production_projects' then '(public.is_admin() or pixinia_private.can_manage_story(story_id))'
   when 'production_jobs' then '(public.is_admin() or pixinia_private.can_manage_story(story_id))'
   when 'production_job_events' then '(public.is_admin() or pixinia_private.can_manage_production_job(job_id))'
   when 'production_approvals' then '(public.is_admin() or pixinia_private.can_manage_project(project_id))'
   when 'objects' then 'pixinia_private.can_manage_media(bucket_id,name)'
   else null end;
  if scope is null then raise exception 'Unscoped staff policy: %.%',p.tablename,p.policyname; end if;
  q:=regexp_replace(p.qual,'(public\.)?is_staff\(\)',scope,'g');
  c:=regexp_replace(p.with_check,'(public\.)?is_staff\(\)',scope,'g');
  stmt:=format('alter policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
  if q is not null then stmt:=stmt||' using ('||q||')'; end if;
  if c is not null then stmt:=stmt||' with check ('||c||')'; end if;
  execute stmt;
 end loop;
end $$;

-- Author cannot be reassigned through an ordinary content update.
create function pixinia_private.guard_story_author() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null then
  if TG_OP='INSERT' and (not public.is_staff() or new.author_id is distinct from auth.uid() or new.created_by is distinct from auth.uid()) then
   raise exception 'Author must be the signed-in creator' using errcode='42501';
  end if;
  if TG_OP='UPDATE' and (new.author_id is distinct from old.author_id or new.legacy_author_name is distinct from old.legacy_author_name)
    and coalesce(current_setting('pixinia.author_assignment',true),'')<>'allowed' then
   raise exception 'Use the admin author assignment action' using errcode='42501';
  end if;
  if new.cover_path is not null and (TG_OP='INSERT' or new.cover_path is distinct from old.cover_path) then
   if new.cover_path !~ ('^covers/'||new.id::text||'/[0-9a-f-]{36}[.](jpg|png|webp)$')
     or not exists(select 1 from storage.objects where bucket_id='story-public' and name=new.cover_path) then
    raise exception 'Cover must belong to this story' using errcode='42501';
   end if;
  end if;
 end if;
 return new;
end $$;
create trigger stories_guard_author before insert or update on public.stories for each row execute function pixinia_private.guard_story_author();
revoke all on function pixinia_private.guard_story_author() from public,anon,authenticated;
-- Editable metadata is explicitly scoped. Publication/pricing/ownership stay RPC-only.
grant update(genres,tags,cover_path) on public.stories to authenticated;
create policy "author update story metadata" on public.stories for update to authenticated
 using(pixinia_private.can_manage_story(id)) with check(pixinia_private.can_manage_story(id));

create table public.admin_audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid references public.profiles(id) on delete set null,
 action text not null,
 target_id uuid not null,
 details jsonb not null default '{}',
 created_at timestamptz not null default now()
);
alter table public.admin_audit_events enable row level security;
revoke all on public.admin_audit_events from anon,authenticated;
grant select on public.admin_audit_events to authenticated;
create policy "admin read account audit" on public.admin_audit_events for select to authenticated using(public.is_admin());
create index admin_audit_actor_idx on public.admin_audit_events(actor_id);

-- Only RPCs may edit roles or activation. Self profile editing remains display-name only.
revoke update on public.profiles from authenticated;
revoke update(role) on public.profiles from authenticated;
grant update(display_name) on public.profiles to authenticated;
create function pixinia_private.guard_profile_access() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
   and coalesce(current_setting('pixinia.profile_management',true),'')<>'allowed' then
  raise exception 'Use admin_manage_user' using errcode='42501';
 end if;
 return new;
end $$;
create trigger profiles_guard_access before update on public.profiles for each row execute function pixinia_private.guard_profile_access();
revoke all on function pixinia_private.guard_profile_access() from public,anon,authenticated;

create function public.admin_manage_user(p_user_id uuid,p_role text,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
declare old_profile public.profiles;
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_role is null or p_role not in ('reader','creator','admin') or p_active is null then raise exception 'Invalid role or status' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('pixinia-admin-management',0));
 select * into old_profile from public.profiles where id=p_user_id for update;
 if not found then raise exception 'User not found'; end if;
 if p_user_id=auth.uid() and (not p_active or p_role<>'admin') then raise exception 'You cannot demote or deactivate yourself'; end if;
 if old_profile.role='admin' and old_profile.is_active and (p_role<>'admin' or not p_active)
   and (select count(*) from public.profiles where role='admin' and is_active)<=1 then raise exception 'At least one active admin required'; end if;
 perform set_config('pixinia.profile_management','allowed',true);
 update public.profiles set role=p_role,is_active=p_active where id=p_user_id;
 perform set_config('pixinia.profile_management','',true);
 insert into public.admin_audit_events(actor_id,action,target_id,details) values(auth.uid(),'manage_user',p_user_id,
  jsonb_build_object('old_role',old_profile.role,'role',p_role,'old_active',old_profile.is_active,'active',p_active));
end $$;
create function public.admin_assign_author(p_story_id uuid,p_author_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare old_author uuid;
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles where id=p_author_id and role in ('creator','admin') and is_active) then raise exception 'Active creator required'; end if;
 select author_id into old_author from public.stories where id=p_story_id for update;
 if not found then raise exception 'Story not found'; end if;
 perform set_config('pixinia.author_assignment','allowed',true);
 update public.stories set author_id=p_author_id where id=p_story_id;
 perform set_config('pixinia.author_assignment','',true);
 insert into public.admin_audit_events(actor_id,action,target_id,details) values(auth.uid(),'assign_author',p_story_id,
   jsonb_build_object('old_author',old_author,'author',p_author_id));
end $$;

create table public.story_ratings (
 story_id uuid not null references public.stories(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 score smallint not null check(score between 1 and 5),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(story_id,user_id)
);
create index story_ratings_user_idx on public.story_ratings(user_id);
alter table public.story_ratings enable row level security;
revoke all on public.story_ratings from anon,authenticated;
grant select on public.story_ratings to authenticated;
create policy "read own rating" on public.story_ratings for select to authenticated using(user_id=auth.uid() and pixinia_private.active_user());

create table public.story_read_sessions (
 id uuid primary key default gen_random_uuid(),
 story_id uuid not null references public.stories(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 started_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 tracking_active boolean not null default true,
 active_seconds double precision not null default 0 check(active_seconds>=0),
 counted_at timestamptz
);
create index story_sessions_stats_idx on public.story_read_sessions(story_id,counted_at,user_id) where counted_at is not null;
create index story_sessions_user_idx on public.story_read_sessions(user_id,story_id);
create table public.story_read_activity (
 user_id uuid not null references public.profiles(id) on delete cascade,
 story_id uuid not null references public.stories(id) on delete cascade,
 session_id uuid not null references public.story_read_sessions(id) on delete cascade,
 primary key(user_id,story_id)
);
create index story_activity_story_idx on public.story_read_activity(story_id);
create index story_activity_session_idx on public.story_read_activity(session_id);
alter table public.story_read_sessions enable row level security;
alter table public.story_read_activity enable row level security;
revoke all on public.story_read_sessions,public.story_read_activity from anon,authenticated;
grant select on public.story_read_sessions to authenticated;
create policy "read own sessions" on public.story_read_sessions for select to authenticated using(user_id=auth.uid() and pixinia_private.active_user());

create function public.reader_touch_session(p_node_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare sid uuid; sess public.story_read_sessions; ts timestamptz; gap double precision;
begin
 if not pixinia_private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 select n.story_id into sid from public.story_nodes n join public.stories s on s.id=n.story_id
 where n.id=p_node_id and n.status='published' and s.status='published' and s.visibility='public';
 if sid is null or not public.coin_can_read_node(p_node_id) then raise exception 'Readable published chapter required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||sid::text,0));
 ts:=clock_timestamp();
 select s.* into sess from public.story_read_activity a join public.story_read_sessions s on s.id=a.session_id
 where a.user_id=auth.uid() and a.story_id=sid for update of s;
 if not found or ts-sess.last_seen_at>=interval '30 minutes' then
  insert into public.story_read_sessions(story_id,user_id,started_at,last_seen_at) values(sid,auth.uid(),ts,ts) returning * into sess;
  insert into public.story_read_activity(user_id,story_id,session_id) values(auth.uid(),sid,sess.id)
   on conflict(user_id,story_id) do update set session_id=excluded.session_id;
 else
  gap:=greatest(0,extract(epoch from ts-sess.last_seen_at));
  -- Duplicate requests contribute no extra time. Hidden/offline gaps do not qualify.
  if sess.tracking_active and gap<=15 then sess.active_seconds:=sess.active_seconds+gap; end if;
  update public.story_read_sessions set active_seconds=sess.active_seconds,last_seen_at=ts,tracking_active=true,
   counted_at=case when sess.active_seconds>=30 then coalesce(counted_at,ts) else counted_at end
  where id=sess.id returning * into sess;
 end if;
 return sess.counted_at is not null;
end $$;
create function public.reader_pause_session(p_node_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if not pixinia_private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 select story_id into sid from public.story_nodes where id=p_node_id;
 if sid is null then return; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||sid::text,0));
 update public.story_read_sessions s set tracking_active=false from public.story_read_activity a
 where a.session_id=s.id and a.story_id=sid and a.user_id=auth.uid();
end $$;
create function public.rate_story(p_story_id uuid,p_score integer) returns void language plpgsql security definer set search_path='' as $$
begin
 if not pixinia_private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 if p_score is null or p_score not between 1 and 5 then raise exception 'Rating must be 1 to 5' using errcode='22023'; end if;
 if not exists(select 1 from public.stories where id=p_story_id and status='published' and visibility='public' and author_id is distinct from auth.uid()) then
  raise exception 'Published story required; authors cannot rate their own story' using errcode='42501';
 end if;
 if not exists(select 1 from public.story_read_sessions where story_id=p_story_id and user_id=auth.uid() and counted_at is not null) then
  raise exception 'Read this story for at least 30 active seconds before rating' using errcode='42501';
 end if;
 insert into public.story_ratings(story_id,user_id,score) values(p_story_id,auth.uid(),p_score)
  on conflict(story_id,user_id) do update set score=excluded.score,updated_at=now();
end $$;

-- Public projection contains only author display names and aggregate statistics.
create function public.story_public_metrics(p_story_ids uuid[]) returns table(story_id uuid,author_id uuid,author_name text,rating_average numeric,rating_count bigint,read_count bigint,reader_count bigint)
language sql stable security definer set search_path='' as $$
 select s.id,s.author_id,coalesce(nullif(trim(p.display_name),''),case when s.author_id is null then s.legacy_author_name else 'Creator' end),
   r.average,coalesce(r.total,0),coalesce(v.total,0),coalesce(v.readers,0)
 from public.stories s left join public.profiles p on p.id=s.author_id
 left join lateral(select round(avg(score),2) as average,count(*) as total from public.story_ratings where story_id=s.id) r on true
 left join lateral(select count(*) as total,count(distinct user_id) as readers from public.story_read_sessions where story_id=s.id and counted_at is not null) v on true
 where s.id=any(p_story_ids) and ((s.status='published' and s.visibility='public') or pixinia_private.can_manage_story(s.id))
 and cardinality(p_story_ids)<=200;
$$;

create function public.story_analytics(p_days integer default 30,p_format text default null,p_author_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb; since timestamptz;
begin
 if not public.is_staff() then raise exception 'Creator or Admin required' using errcode='42501'; end if;
 if p_days is null or p_days not in (7,30,90,365) or (p_format is not null and p_format not in ('comic','web_novel','motion_comic','video')) then raise exception 'Invalid filter'; end if;
 since:=now()-make_interval(days=>p_days);
 with scope as (
  select * from public.stories where (public.is_admin() or author_id=auth.uid())
   and (p_format is null or default_format=p_format) and (p_author_id is null or author_id=p_author_id)
 ), reads as (
  select r.* from public.story_read_sessions r join scope s on s.id=r.story_id where r.counted_at>=since
 ), ratings as (
  select r.* from public.story_ratings r join scope s on s.id=r.story_id
 ) select jsonb_build_object(
  'reads',(select count(*) from reads),'readers',(select count(distinct user_id) from reads),
  'stories',(select count(*) from scope),'ratings',(select count(*) from ratings),
  'users',case when public.is_admin() then (select jsonb_build_object('total',count(*),'reader',count(*) filter(where role='reader'),
    'creator',count(*) filter(where role='creator'),'admin',count(*) filter(where role='admin'),'new',count(*) filter(where created_at>=since)) from public.profiles) else null end,
  'top_stories',coalesce((select jsonb_agg(to_jsonb(t)) from (
   select s.id,s.slug,s.title,s.status,s.default_format,(select count(*) from reads r where r.story_id=s.id) as read_count,
    (select count(distinct user_id) from reads r where r.story_id=s.id) as reader_count,
    (select round(avg(score),2) from ratings r where r.story_id=s.id) as rating_average,
    (select count(*) from ratings r where r.story_id=s.id) as rating_count
   from scope s order by read_count desc,s.title limit 50
  ) t),'[]'::jsonb),
  'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from (
    select (counted_at at time zone 'Asia/Jakarta')::date as day,count(*) as reads,count(distinct user_id) as readers
    from reads group by 1
  ) d),'[]'::jsonb)
 ) into result;
 return result;
end $$;

do $$ declare f text; begin
 foreach f in array array['admin_manage_user(uuid,text,boolean)','admin_assign_author(uuid,uuid)',
   'reader_touch_session(uuid)','reader_pause_session(uuid)','rate_story(uuid,integer)','story_analytics(integer,text,uuid)'] loop
  execute 'revoke all on function public.'||f||' from public,anon';
  execute 'grant execute on function public.'||f||' to authenticated';
 end loop;
end $$;
revoke all on function public.story_public_metrics(uuid[]) from public;
grant execute on function public.story_public_metrics(uuid[]) to anon,authenticated;

-- Explicit replacements retain existing draft/version/price validations.
create or replace function public.studio_begin_graph(p_story_id uuid)
returns public.studio_graph_drafts language plpgsql security definer set search_path = '' as $$
declare v_draft public.studio_graph_drafts; v_episode uuid := gen_random_uuid();
begin
  if auth.uid() is null or not pixinia_private.can_manage_story(p_story_id) then raise exception 'Staff required' using errcode='42501'; end if;
  if not exists(select 1 from public.stories where id=p_story_id) then raise exception 'Story not found' using errcode='P0002'; end if;
  insert into public.studio_graph_drafts(story_id, graph, updated_by)
  select p_story_id, jsonb_build_object(
    'episodes', jsonb_build_array(jsonb_build_object('id',v_episode,'title','Episode 1','sortOrder',1)),
    'nodes', coalesce((select jsonb_agg(jsonb_build_object(
      'id',n.id,'key',n.node_key,'title',n.title,'synopsis',coalesce(n.synopsis,''),
      'type',n.node_type,'start',n.is_start,'episodeId',v_episode,
      'x',null,'y',null,'tags',jsonb_build_array(),'notes','') order by n.created_at,n.id)
      from public.story_nodes n where n.story_id=p_story_id),'[]'::jsonb),
    'choices', coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'source',c.node_id,'target',c.next_node_id,'label',c.label,
      'description',coalesce(c.description,''),'sortOrder',c.sort_order,
      'color','blue','condition',c.condition_json) order by c.node_id,c.sort_order,c.id)
      from public.story_choices c where c.story_id=p_story_id),'[]'::jsonb)
  ),auth.uid()
  on conflict (story_id) do nothing;
  select * into v_draft from public.studio_graph_drafts where story_id=p_story_id;
  return v_draft;
end $$;

create or replace function public.studio_save_graph(p_story_id uuid,p_version bigint,p_graph jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_draft public.studio_graph_drafts; v_node jsonb; v_choice jsonb; v_episode jsonb;
  v_id uuid; v_existing public.story_nodes; v_count bigint; v_key text;
  v_node_ids uuid[] := '{}'; v_keys text[] := '{}'; v_episode_ids uuid[] := '{}'; v_choice_ids uuid[] := '{}';
begin
  if auth.uid() is null or not pixinia_private.can_manage_story(p_story_id) then raise exception 'Staff required' using errcode='42501'; end if;
  select * into v_draft from public.studio_graph_drafts where story_id=p_story_id for update;
  if not found then raise exception 'Graph not initialized' using errcode='P0002'; end if;
  if v_draft.version<>p_version then raise exception 'Graph changed; reload' using errcode='40001'; end if;
  if p_graph is null or jsonb_typeof(p_graph->'nodes')<>'array' or jsonb_typeof(p_graph->'choices')<>'array'
     or jsonb_typeof(p_graph->'episodes')<>'array' or octet_length(p_graph::text)>300000
     or jsonb_array_length(p_graph->'nodes')>200 or jsonb_array_length(p_graph->'choices')>400
     or jsonb_array_length(p_graph->'episodes')>50 then raise exception 'Invalid graph size or shape' using errcode='22023'; end if;
  if jsonb_array_length(p_graph->'episodes')=0 then raise exception 'At least one episode required' using errcode='22023'; end if;
  for v_episode in select value from jsonb_array_elements(p_graph->'episodes') loop
    if length(trim(coalesce(v_episode->>'title','')))=0 or length(v_episode->>'title')>120 then raise exception 'Invalid episode title' using errcode='22023'; end if;
    v_id := (v_episode->>'id')::uuid;
    if v_id=any(v_episode_ids) then raise exception 'Duplicate episode' using errcode='22023'; end if;
    v_episode_ids := array_append(v_episode_ids,v_id);
  end loop;
  for v_node in select value from jsonb_array_elements(p_graph->'nodes') loop
    v_id := (v_node->>'id')::uuid; v_key := v_node->>'key';
    if v_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_key)>100
      or length(trim(coalesce(v_node->>'title','')))=0 or length(v_node->>'title')>200
      or length(coalesce(v_node->>'synopsis',''))>4000 or length(coalesce(v_node->>'notes',''))>4000
      or v_node->>'type' not in ('episode','ending') or jsonb_typeof(v_node->'start')<>'boolean'
      or not (v_node->>'episodeId')::uuid=any(v_episode_ids)
      or (v_node->>'x')::numeric not between -100000 and 100000
      or (v_node->>'y')::numeric not between -100000 and 100000
      then raise exception 'Invalid node' using errcode='22023'; end if;
    if v_id=any(v_node_ids) or v_key=any(v_keys) then raise exception 'Duplicate node or key' using errcode='22023'; end if;
    v_node_ids := array_append(v_node_ids,v_id); v_keys := array_append(v_keys,v_key);
    select * into v_existing from public.story_nodes where id=v_id;
    if found and v_existing.story_id<>p_story_id then raise exception 'Node belongs to another story' using errcode='42501'; end if;
    if found and v_existing.status='published' and v_existing.node_key<>v_key
      then raise exception 'Published node key cannot change' using errcode='22023'; end if;
    if not found then
      insert into public.story_nodes(id,story_id,node_key,title,synopsis,node_type,is_start,status)
      values(v_id,p_story_id,v_key,v_node->>'title',v_node->>'synopsis',v_node->>'type',false,'draft');
    end if;
  end loop;
  if exists(select 1 from public.story_nodes n where n.story_id=p_story_id and n.status='published'
    and not n.id=any(v_node_ids))
    then raise exception 'Published nodes cannot be removed' using errcode='22023'; end if;
  for v_choice in select value from jsonb_array_elements(p_graph->'choices') loop
    if length(trim(coalesce(v_choice->>'label','')))=0 or length(v_choice->>'label')>200
       or not (v_choice->>'source')::uuid=any(v_node_ids)
       or not (v_choice->>'target')::uuid=any(v_node_ids)
       or (v_choice->>'sortOrder')::integer<0
       then raise exception 'Invalid choice' using errcode='22023'; end if;
    v_id := (v_choice->>'id')::uuid;
    if v_id=any(v_choice_ids) then raise exception 'Duplicate choice' using errcode='22023'; end if;
    v_choice_ids := array_append(v_choice_ids,v_id);
    if exists(select 1 from public.story_choices where id=(v_choice->>'id')::uuid and story_id<>p_story_id)
      then raise exception 'Choice belongs to another story' using errcode='42501'; end if;
  end loop;
  update public.studio_graph_drafts set graph=p_graph,version=version+1,updated_at=now(),updated_by=auth.uid()
  where story_id=p_story_id returning version into v_count;
  return v_count;
end $$;

create or replace function public.studio_save_graph_once(p_story_id uuid,p_version bigint,p_graph jsonb,p_mutation_id uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_inserted uuid; v_existing public.studio_graph_requests; v_result bigint;
begin
  if auth.uid() is null or not pixinia_private.can_manage_story(p_story_id) then raise exception 'Staff required' using errcode='42501'; end if;
  if p_mutation_id is null then raise exception 'Mutation ID required' using errcode='22023'; end if;
  insert into public.studio_graph_requests(story_id,mutation_id,action,base_version,graph,created_by)
  values(p_story_id,p_mutation_id,'save',p_version,p_graph,auth.uid())
  on conflict do nothing returning mutation_id into v_inserted;
  if v_inserted is null then
    select * into v_existing from public.studio_graph_requests where story_id=p_story_id and mutation_id=p_mutation_id;
    if v_existing.action<>'save' or v_existing.base_version<>p_version or v_existing.graph is distinct from p_graph
      then raise exception 'Mutation ID reused with different data' using errcode='22023'; end if;
    return v_existing.result_version;
  end if;
  v_result := public.studio_save_graph(p_story_id,p_version,p_graph);
  update public.studio_graph_requests set result_version=v_result where story_id=p_story_id and mutation_id=p_mutation_id;
  return v_result;
end $$;

create or replace function public.begin_chapter_image_draft(p_node_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_story_id uuid; v_set_id uuid;
begin
  if auth.uid() is null or not pixinia_private.can_manage_node(p_node_id) then raise exception 'Not authorized'; end if;
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
  if auth.uid() is null or not pixinia_private.can_manage_set(p_set_id) then raise exception 'Not authorized'; end if;
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
  if auth.uid() is null or not pixinia_private.can_manage_image(p_image_id) then raise exception 'Not authorized'; end if;
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
  if auth.uid() is null or not pixinia_private.can_manage_image(p_image_id) or p_direction not in (-1,1) then raise exception 'Not authorized'; end if;
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
  if auth.uid() is null or not pixinia_private.can_manage_image(p_image_id) then raise exception 'Not authorized'; end if;
  select s.id into v_set_id from public.chapter_images i join public.chapter_image_sets s on s.id=i.set_id
    where i.id=p_image_id and s.status='draft' for update of s;
  if v_set_id is null then raise exception 'Draft not found'; end if;
  delete from public.chapter_images where id=p_image_id;
  update public.chapter_image_sets set version=version+1 where id=v_set_id;
end $$;

create or replace function public.enqueue_chapter_image_job(
  p_set_id uuid,p_provider text,p_prompt text,p_alt text,p_aspect text,p_key uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_job_id uuid; v_model text; v_reserved numeric(8,4); v_cap numeric(8,4); v_total numeric(8,4);
begin
  if auth.uid() is null or not pixinia_private.can_manage_set(p_set_id) then raise exception 'Not authorized'; end if;
  if not exists(select 1 from public.chapter_image_sets where id=p_set_id and status='draft')
    then raise exception 'Draft not found'; end if;
  if char_length(trim(p_prompt)) not between 10 and 2000 or char_length(trim(p_alt)) not between 1 and 500
    then raise exception 'Invalid prompt'; end if;
  if p_provider='openrouter' then
    if p_aspect not in ('1:1','16:9','9:16','4:3','3:4') then raise exception 'Invalid aspect ratio'; end if;
    v_model:='bytedance-seed/seedream-4.5'; v_reserved:=0.1000;
  elsif p_provider='kie' then
    if p_aspect not in ('auto','1:1','16:9','9:16','4:3','3:4') then raise exception 'Invalid aspect ratio'; end if;
    v_model:='gpt-image-2-text-to-image'; v_reserved:=0.0300;
  else raise exception 'Unsupported provider'; end if;
  select id into v_job_id from public.chapter_image_generation_jobs
    where requested_by=auth.uid() and idempotency_key=p_key;
  if v_job_id is not null then return v_job_id; end if;
  select cap_usd into v_cap from public.chapter_ai_budget where id=true for update;
  select coalesce(sum(reserved_cost_usd),0) into v_total from public.chapter_image_generation_jobs;
  if v_cap is null or v_total+v_reserved > v_cap then raise exception 'AI budget exhausted'; end if;
  insert into public.chapter_image_generation_jobs(set_id,requested_by,provider,model,prompt,alt_text,aspect_ratio,idempotency_key,reserved_cost_usd)
    values(p_set_id,auth.uid(),p_provider,v_model,trim(p_prompt),trim(p_alt),p_aspect,p_key,v_reserved)
    returning id into v_job_id;
  return v_job_id;
end $$;

create or replace function public.set_chapter_image_job_state(
  p_job_id uuid,p_status text,p_task_id text default null,p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old text;
begin
  if auth.uid() is null or not pixinia_private.can_manage_job(p_job_id) then raise exception 'Not authorized'; end if;
  select status into v_old from public.chapter_image_generation_jobs
    where id=p_job_id and requested_by=auth.uid() for update;
  if v_old is null or not ((v_old='queued' and p_status in ('running','failed','uncertain'))
    or (v_old='running' and p_status in ('processing','failed','uncertain'))
    or (v_old='processing' and p_status in ('finalizing','failed','uncertain'))
    or (v_old='finalizing' and p_status='uncertain'))
    then raise exception 'Invalid job transition'; end if;
  update public.chapter_image_generation_jobs set status=p_status,
    provider_task_id=coalesce(p_task_id,provider_task_id),last_error=left(p_error,500)
    where id=p_job_id;
end $$;

create or replace function public.complete_chapter_image_job(
  p_job_id uuid,p_path text,p_mime text,p_width integer,p_height integer,p_actual_cost numeric default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_job public.chapter_image_generation_jobs; v_image_id uuid;
begin
  if auth.uid() is null or not pixinia_private.can_manage_job(p_job_id) then raise exception 'Not authorized'; end if;
  select * into v_job from public.chapter_image_generation_jobs
    where id=p_job_id and requested_by=auth.uid() for update;
  if v_job.id is null or v_job.status not in ('running','finalizing') then raise exception 'Job not running'; end if;
  if p_actual_cost is not null and (p_actual_cost < 0 or p_actual_cost > v_job.reserved_cost_usd)
    then raise exception 'Cost exceeds reservation'; end if;
  v_image_id:=public.add_chapter_image(v_job.set_id,p_path,p_mime,p_width,p_height,v_job.alt_text,'ai');
  update public.chapter_image_generation_jobs set status='succeeded',result_path=p_path,
    actual_cost_usd=p_actual_cost where id=p_job_id;
  return v_image_id;
end $$;

create or replace function public.coin_can_read_node(p_node uuid) returns boolean language sql stable security definer set search_path='' as $$
 select pixinia_private.can_manage_node(p_node) or exists(
   select 1 from public.story_nodes n join public.stories s on s.id=n.story_id
   where n.id=p_node and n.status='published' and s.status='published' and s.visibility='public'
   and ((n.unlock_cost=0 and not n.is_premium and not s.is_premium)
    or exists(select 1 from public.coin_node_unlocks u where u.node_id=n.id and u.user_id=auth.uid())
    or exists(select 1 from public.coin_story_unlocks u where u.story_id=n.story_id and u.user_id=auth.uid()))
 );
$$;

create or replace function pixinia_private.lock_wallet(p_user uuid) returns bigint language plpgsql security definer set search_path='' as $$
declare b bigint;
begin
 if not pixinia_private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 if auth.uid() is null or auth.uid()<>p_user then raise exception 'Authentication required' using errcode='42501'; end if;
 select balance into b from public.coin_wallets where user_id=p_user for update;
 if not found then raise exception 'Wallet unavailable' using errcode='P0002'; end if;
 return b;
end $$;

create or replace function public.start_story(p_story_id uuid) returns public.user_story_progress language plpgsql security definer set search_path='' as $$
declare n uuid; p public.user_story_progress;
begin
 if not pixinia_private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 perform pixinia_private.lock_wallet(auth.uid());
 select * into p from public.user_story_progress where user_id=auth.uid() and story_id=p_story_id for update;
 if found then return p; end if;
 select id into n from public.story_nodes where story_id=p_story_id and is_start and status='published';
 perform pixinia_private.unlock_node(n,gen_random_uuid());
 return pixinia_private.start_story(p_story_id);
end $$;

create or replace function public.apply_story_choice(p_story_id uuid,p_choice_id uuid) returns public.user_story_progress language plpgsql security definer set search_path='' as $$
declare c public.story_choices; p public.user_story_progress;
begin
 if not pixinia_private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 perform pixinia_private.lock_wallet(auth.uid());
 select * into c from public.story_choices where id=p_choice_id and story_id=p_story_id and condition_json='{}'::jsonb for share;
 if not found then raise exception 'Choice unavailable'; end if;
 select * into p from public.user_story_progress where user_id=auth.uid() and story_id=p_story_id for update;
 if not found or p.current_node_id<>c.node_id then raise exception 'Progress changed' using errcode='40001'; end if;
 if not public.coin_can_read_node(c.node_id) then raise exception 'Unlock source chapter first' using errcode='42501'; end if;
 perform pixinia_private.unlock_node(c.next_node_id,gen_random_uuid());
 return pixinia_private.apply_story_choice(p_story_id,p_choice_id);
end $$;

create or replace function public.coin_reset_chapter(p_node_id uuid,p_request_id uuid) returns public.user_story_progress language plpgsql security definer set search_path='' as $$
declare n public.story_nodes; p public.user_story_progress; cost integer;
begin
 if not pixinia_private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 perform pixinia_private.lock_wallet(auth.uid());
 select * into n from public.story_nodes where id=p_node_id and status='published' and exists(
 select 1 from public.stories s where s.id=story_id and s.status='published' and s.visibility='public');
 if not found or not public.coin_can_read_node(n.id) then raise exception 'Unlock chapter first' using errcode='42501'; end if;
 select reset_cost into cost from public.coin_settings where id=true for share;
 if not pixinia_private.spend(auth.uid(),p_request_id,'reset_chapter',n.id,cost) then
 select * into p from public.user_story_progress where user_id=auth.uid() and story_id=n.story_id; return p; end if;
 -- Start a new branch from the selected owned chapter. Ownership of paid content is preserved.
 insert into public.user_story_progress(user_id,story_id,current_node_id,choices_history,completed_at)
 values(auth.uid(),n.story_id,n.id,'[]'::jsonb,case when n.node_type='ending' then now() end)
 on conflict(user_id,story_id) do update set current_node_id=n.id,choices_history='[]'::jsonb,
 completed_at=case when n.node_type='ending' then now() end,updated_at=now() returning * into p;
 return p;
end $$;

create or replace function public.coin_redeem_reward(p_reward_id uuid,p_request_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.coin_rewards; claim uuid;
begin
 if not pixinia_private.active_user() then raise exception 'Active account required' using errcode='42501'; end if;
 perform pixinia_private.lock_wallet(auth.uid());
 select id into claim from public.coin_reward_claims where user_id=auth.uid() and request_id=p_request_id;
 if found then
 if not exists(select 1 from public.coin_reward_claims where id=claim and reward_id=p_reward_id) then raise exception 'Request ID reused'; end if;
 return claim; end if;
 select * into r from public.coin_rewards where id=p_reward_id and active for share;
 if not found then raise exception 'Reward unavailable'; end if;
 perform pixinia_private.spend(auth.uid(),p_request_id,'redeem_reward',r.id,r.cost);
 insert into public.coin_reward_claims(user_id,reward_id,request_id,title,cost) values(auth.uid(),r.id,p_request_id,r.title,r.cost) returning id into claim;
 return claim;
end $$;

