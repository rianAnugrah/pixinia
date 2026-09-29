-- Branching Comic / Motion Comic platform
-- PostgreSQL for Supabase. Review and apply in a development project first.
-- RLS is enabled on all app tables. Adjust policies before exposing additional columns.

create extension if not exists pgcrypto;

-- ---------- Roles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'reader' check (role in ('reader', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('editor', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---------- Stories and graph ----------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text,
  description text,
  cover_path text,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'published', 'archived')),
  visibility text not null default 'public'
    check (visibility in ('public', 'unlisted', 'private')),
  default_format text not null default 'comic'
    check (default_format in ('comic', 'motion_comic', 'video')),
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists stories_set_updated_at on public.stories;
create trigger stories_set_updated_at before update on public.stories
for each row execute function public.set_updated_at();

create table if not exists public.story_nodes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  node_key text not null,
  title text not null,
  synopsis text,
  node_type text not null default 'episode'
    check (node_type in ('episode', 'ending')),
  is_start boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'published', 'archived')),
  sequence_hint integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, node_key),
  unique (id, story_id)
);

create unique index if not exists one_start_node_per_story
  on public.story_nodes(story_id) where is_start = true;

drop trigger if exists story_nodes_set_updated_at on public.story_nodes;
create trigger story_nodes_set_updated_at before update on public.story_nodes
for each row execute function public.set_updated_at();

create table if not exists public.story_choices (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  node_id uuid not null,
  next_node_id uuid not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  condition_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint choice_node_same_story
    foreign key (node_id, story_id) references public.story_nodes(id, story_id) on delete cascade,
  constraint choice_next_same_story
    foreign key (next_node_id, story_id) references public.story_nodes(id, story_id) on delete cascade
);

create index if not exists story_choices_node_order_idx
  on public.story_choices(node_id, sort_order);

-- ---------- Media assets ----------
create table if not exists public.story_assets (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  node_id uuid not null,
  format text not null check (format in ('comic', 'motion_comic', 'video', 'audio')),
  asset_type text not null
    check (asset_type in ('panel', 'video', 'audio', 'subtitle', 'thumbnail', 'poster', 'other')),
  storage_bucket text,
  storage_path text,
  external_provider text,
  external_asset_id text,
  mime_type text,
  width integer,
  height integer,
  duration_ms integer,
  status text not null default 'draft'
    check (status in ('draft', 'generating', 'review_required', 'approved', 'published', 'rejected', 'failed', 'archived')),
  alt_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asset_node_same_story
    foreign key (node_id, story_id) references public.story_nodes(id, story_id) on delete cascade,
  constraint asset_location_present check (
    (storage_path is not null) or
    (external_provider is not null and external_asset_id is not null)
  )
);

create index if not exists story_assets_node_format_idx
  on public.story_assets(node_id, format, status);

drop trigger if exists story_assets_set_updated_at on public.story_assets;
create trigger story_assets_set_updated_at before update on public.story_assets
for each row execute function public.set_updated_at();

create table if not exists public.story_asset_panels (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.story_assets(id) on delete cascade,
  panel_order integer not null,
  dialogue text,
  caption text,
  speaker text,
  panel_metadata jsonb not null default '{}'::jsonb,
  unique (asset_id, panel_order)
);

-- ---------- Entitlements and progress ----------
create table if not exists public.story_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  access_type text not null default 'purchase'
    check (access_type in ('purchase', 'subscription', 'grant', 'promo')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  external_reference text,
  created_at timestamptz not null default now(),
  unique (user_id, story_id, access_type, external_reference)
);

create index if not exists story_entitlements_user_story_idx
  on public.story_entitlements(user_id, story_id);

create table if not exists public.user_story_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  current_node_id uuid,
  selected_format text not null default 'comic'
    check (selected_format in ('comic', 'motion_comic', 'video')),
  choices_history jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, story_id),
  constraint progress_node_same_story
    foreign key (current_node_id, story_id) references public.story_nodes(id, story_id) on delete set null
);

drop trigger if exists user_story_progress_set_updated_at on public.user_story_progress;
create trigger user_story_progress_set_updated_at before update on public.user_story_progress
for each row execute function public.set_updated_at();

-- Atomic choice application: client submits a choice ID, not an arbitrary next_node_id.
create or replace function public.apply_story_choice(p_story_id uuid, p_choice_id uuid)
returns public.user_story_progress
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_choice public.story_choices%rowtype;
  v_progress public.user_story_progress%rowtype;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_choice
  from public.story_choices
  where id = p_choice_id and story_id = p_story_id;

  if not found then
    raise exception 'Choice not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.story_nodes n
    join public.stories s on s.id = n.story_id
    where n.id = v_choice.node_id and n.status = 'published'
      and s.status = 'published'
  ) then
    raise exception 'Source node is not published' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.story_nodes n
    where n.id = v_choice.next_node_id and n.status = 'published'
  ) then
    raise exception 'Target node is not published' using errcode = '42501';
  end if;

  insert into public.user_story_progress (user_id, story_id, current_node_id, choices_history)
  values (v_user, p_story_id, v_choice.next_node_id,
    jsonb_build_array(jsonb_build_object(
      'choice_id', v_choice.id,
      'from_node_id', v_choice.node_id,
      'to_node_id', v_choice.next_node_id,
      'selected_at', now()
    )))
  on conflict (user_id, story_id) do update
  set current_node_id = excluded.current_node_id,
      choices_history = public.user_story_progress.choices_history ||
        jsonb_build_array(jsonb_build_object(
          'choice_id', v_choice.id,
          'from_node_id', v_choice.node_id,
          'to_node_id', v_choice.next_node_id,
          'selected_at', now()
        )),
      completed_at = null,
      updated_at = now()
  where public.user_story_progress.current_node_id = v_choice.node_id
     or public.user_story_progress.current_node_id is null
  returning * into v_progress;

  if not found then
    raise exception 'Choice does not match current node; reload progress' using errcode = '40001';
  end if;

  return v_progress;
end;
$$;

-- ---------- AI production pipeline ----------
create table if not exists public.production_projects (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete set null,
  name text not null,
  brief jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists production_projects_set_updated_at on public.production_projects;
create trigger production_projects_set_updated_at before update on public.production_projects
for each row execute function public.set_updated_at();

create table if not exists public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.production_projects(id) on delete cascade,
  story_id uuid references public.stories(id) on delete set null,
  node_id uuid references public.story_nodes(id) on delete set null,
  parent_job_id uuid references public.production_jobs(id) on delete set null,
  stage text not null check (stage in (
    'brief', 'outline', 'graph_validation', 'script', 'storyboard',
    'asset_prompts', 'asset_generation', 'asset_validation',
    'assembly', 'quality_review', 'publish', 'analytics'
  )),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'waiting_approval', 'succeeded', 'failed', 'cancelled', 'dead_letter')),
  priority integer not null default 100,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  provider text,
  model text,
  prompt_version text,
  idempotency_key text not null unique,
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd >= 0),
  actual_cost_usd numeric(12,6) check (actual_cost_usd is null or actual_cost_usd >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists production_jobs_claim_idx
  on public.production_jobs(status, priority, available_at, created_at);

create index if not exists production_jobs_project_stage_idx
  on public.production_jobs(project_id, stage, status);

drop trigger if exists production_jobs_set_updated_at on public.production_jobs;
create trigger production_jobs_set_updated_at before update on public.production_jobs
for each row execute function public.set_updated_at();

create table if not exists public.production_job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.production_jobs(id) on delete cascade,
  event_type text not null,
  message text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists production_job_events_job_idx
  on public.production_job_events(job_id, created_at);

create table if not exists public.production_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.production_projects(id) on delete cascade,
  job_id uuid references public.production_jobs(id) on delete set null,
  asset_id uuid references public.story_assets(id) on delete set null,
  gate text not null check (gate in ('story_bible', 'outline', 'script', 'storyboard', 'key_art', 'final_episode', 'publish')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'revision_requested')),
  reviewer_id uuid references auth.users(id) on delete set null,
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.production_budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.production_projects(id) on delete cascade,
  provider text,
  daily_limit_usd numeric(12,4) not null default 5 check (daily_limit_usd >= 0),
  monthly_limit_usd numeric(12,4) not null default 50 check (monthly_limit_usd >= 0),
  max_concurrency integer not null default 2 check (max_concurrency between 1 and 20),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.story_nodes enable row level security;
alter table public.story_choices enable row level security;
alter table public.story_assets enable row level security;
alter table public.story_asset_panels enable row level security;
alter table public.story_entitlements enable row level security;
alter table public.user_story_progress enable row level security;
alter table public.production_projects enable row level security;
alter table public.production_jobs enable row level security;
alter table public.production_job_events enable row level security;
alter table public.production_approvals enable row level security;
alter table public.production_budgets enable row level security;

-- Profiles: users can read/update their own profile; only admins can change roles.
drop policy if exists "profile read own or admin" on public.profiles;
create policy "profile read own or admin" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "profile update own non-role fields" on public.profiles;
create policy "profile update own non-role fields" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- IMPORTANT: prevent role escalation with a column-level grant in deployment:
revoke update on public.profiles from authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;

drop policy if exists "admin manage profiles" on public.profiles;
create policy "admin manage profiles" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public story graph is readable only when published and visible.
drop policy if exists "read published stories" on public.stories;
create policy "read published stories" on public.stories
for select to anon, authenticated
using (
  status = 'published'
  and visibility = 'public'
  or public.is_staff()
);

drop policy if exists "staff manage stories" on public.stories;
create policy "staff manage stories" on public.stories
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read published nodes" on public.story_nodes;
create policy "read published nodes" on public.story_nodes
for select to anon, authenticated
using (
  status = 'published' and exists (
    select 1 from public.stories s
    where s.id = story_nodes.story_id
      and s.status = 'published' and s.visibility = 'public'
  )
  or public.is_staff()
);

drop policy if exists "staff manage nodes" on public.story_nodes;
create policy "staff manage nodes" on public.story_nodes
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read choices for published nodes" on public.story_choices;
create policy "read choices for published nodes" on public.story_choices
for select to anon, authenticated
using (
  exists (
    select 1 from public.story_nodes n
    join public.stories s on s.id = n.story_id
    where n.id = story_choices.node_id
      and n.status = 'published'
      and s.status = 'published' and s.visibility = 'public'
  )
  or public.is_staff()
);

drop policy if exists "staff manage choices" on public.story_choices;
create policy "staff manage choices" on public.story_choices
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read approved public assets" on public.story_assets;
create policy "read approved public assets" on public.story_assets
for select to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.stories s
    where s.id = story_assets.story_id
      and s.status = 'published' and s.visibility = 'public'
  )
  or public.is_staff()
);

drop policy if exists "staff manage assets" on public.story_assets;
create policy "staff manage assets" on public.story_assets
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read panels through approved assets" on public.story_asset_panels;
create policy "read panels through approved assets" on public.story_asset_panels
for select to anon, authenticated
using (
  exists (
    select 1 from public.story_assets a
    join public.stories s on s.id = a.story_id
    where a.id = story_asset_panels.asset_id
      and a.status = 'published'
      and s.status = 'published' and s.visibility = 'public'
  )
  or public.is_staff()
);

drop policy if exists "staff manage panels" on public.story_asset_panels;
create policy "staff manage panels" on public.story_asset_panels
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "users read own entitlements" on public.story_entitlements;
create policy "users read own entitlements" on public.story_entitlements
for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin manage entitlements" on public.story_entitlements;
create policy "admin manage entitlements" on public.story_entitlements
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users manage own progress" on public.user_story_progress;
create policy "users read own progress" on public.user_story_progress
for select to authenticated using (user_id = auth.uid());
create policy "users insert own progress" on public.user_story_progress
for insert to authenticated with check (user_id = auth.uid());
create policy "users update own progress" on public.user_story_progress
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Production data is private; all mutations should go through trusted server endpoints.
drop policy if exists "staff read production projects" on public.production_projects;
create policy "staff read production projects" on public.production_projects
for select to authenticated using (public.is_staff());
drop policy if exists "staff manage production projects" on public.production_projects;
create policy "staff manage production projects" on public.production_projects
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff read production jobs" on public.production_jobs;
create policy "staff read production jobs" on public.production_jobs
for select to authenticated using (public.is_staff());
drop policy if exists "staff read job events" on public.production_job_events;
create policy "staff read job events" on public.production_job_events
for select to authenticated using (public.is_staff());
drop policy if exists "staff read approvals" on public.production_approvals;
create policy "staff read approvals" on public.production_approvals
for select to authenticated using (public.is_staff());
drop policy if exists "staff manage approvals" on public.production_approvals;
create policy "staff manage approvals" on public.production_approvals
for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "admin manage budgets" on public.production_budgets;
create policy "admin manage budgets" on public.production_budgets
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- No direct browser policies for inserting/updating production jobs/events/budgets.
-- Pages Functions should use server-side credentials and validate admin role.
-- Do not expose service-role keys to the browser.

-- ---------- Storage setup notes ----------
-- Create buckets in Supabase Storage dashboard:
-- 1) story-public: public covers/panels that are approved for public display.
-- 2) story-private: premium/review assets, private; serve with short-lived signed URLs.
-- Storage policies should check object path ownership/story entitlement or use server-side signing.
-- Do not assume a private bucket alone enforces story entitlement at the application level.

-- ---------- Deployment notes ----------
-- 1) Apply in a development Supabase project first.
-- 2) Verify RLS as anon, authenticated reader, editor, and admin.
-- 3) Add a server-only queue-claim function (e.g. claim_production_jobs) before running multiple workers.
-- 4) Restrict profile role updates as above; bootstrap the first admin manually using the SQL editor.
-- 5) Test apply_story_choice under RLS. Add entitlement checks before enabling premium nodes/assets.
-- 6) Review the progress FK behavior in your environment; if needed, replace ON DELETE SET NULL with a composite-FK-safe cleanup strategy.
