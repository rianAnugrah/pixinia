create table public.chapter_image_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.chapter_image_sets(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('openrouter','kie')),
  model text not null,
  prompt text not null check (char_length(prompt) between 10 and 2000),
  alt_text text not null check (char_length(alt_text) between 1 and 500),
  aspect_ratio text not null check (aspect_ratio in ('1:1','16:9','9:16','4:3','3:4')),
  status text not null default 'queued' check (status in ('queued','running','processing','succeeded','failed','uncertain')),
  idempotency_key uuid not null,
  provider_task_id text,
  result_path text,
  reserved_cost_usd numeric(8,4) not null check (reserved_cost_usd > 0),
  actual_cost_usd numeric(8,4) check (actual_cost_usd >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requested_by,idempotency_key)
);
create index chapter_generation_by_set on public.chapter_image_generation_jobs(set_id,created_at desc);
create trigger chapter_generation_updated_at before update on public.chapter_image_generation_jobs
  for each row execute function public.set_updated_at();
alter table public.chapter_image_generation_jobs enable row level security;
revoke all on public.chapter_image_generation_jobs from anon, authenticated;
grant select on public.chapter_image_generation_jobs to authenticated;
create policy "staff read chapter image jobs" on public.chapter_image_generation_jobs
  for select to authenticated using (public.is_staff());

create table public.chapter_ai_budget (
  id boolean primary key default true check (id),
  cap_usd numeric(8,4) not null check (cap_usd >= 0)
);
insert into public.chapter_ai_budget(id,cap_usd) values(true,2.0000);
alter table public.chapter_ai_budget enable row level security;
revoke all on public.chapter_ai_budget from anon, authenticated;

create or replace function public.enqueue_chapter_image_job(
  p_set_id uuid,p_provider text,p_prompt text,p_alt text,p_aspect text,p_key uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_job_id uuid; v_model text; v_reserved numeric(8,4); v_cap numeric(8,4); v_total numeric(8,4);
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
  if not exists(select 1 from public.chapter_image_sets where id=p_set_id and status='draft')
    then raise exception 'Draft not found'; end if;
  if char_length(trim(p_prompt)) not between 10 and 2000 or char_length(trim(p_alt)) not between 1 and 500
    or p_aspect not in ('1:1','16:9','9:16','4:3','3:4') then raise exception 'Invalid prompt'; end if;
  if p_provider='openrouter' then v_model:='bytedance-seed/seedream-4.5'; v_reserved:=0.1000;
  elsif p_provider='kie' then v_model:='flux1-kontext'; v_reserved:=0.2500;
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
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
  select status into v_old from public.chapter_image_generation_jobs
    where id=p_job_id and requested_by=auth.uid() for update;
  if v_old is null or not ((v_old='queued' and p_status in ('running','processing','failed','uncertain'))
    or (v_old='running' and p_status in ('processing','failed','uncertain'))
    or (v_old='processing' and p_status in ('failed','uncertain')))
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
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
  select * into v_job from public.chapter_image_generation_jobs
    where id=p_job_id and requested_by=auth.uid() for update;
  if v_job.id is null or v_job.status not in ('running','processing') then raise exception 'Job not running'; end if;
  if p_actual_cost is not null and (p_actual_cost < 0 or p_actual_cost > v_job.reserved_cost_usd)
    then raise exception 'Cost exceeds reservation'; end if;
  v_image_id:=public.add_chapter_image(v_job.set_id,p_path,p_mime,p_width,p_height,v_job.alt_text,'ai');
  update public.chapter_image_generation_jobs set status='succeeded',result_path=p_path,
    actual_cost_usd=p_actual_cost where id=p_job_id;
  return v_image_id;
end $$;

revoke all on function public.enqueue_chapter_image_job(uuid,text,text,text,text,uuid) from public,anon;
revoke all on function public.set_chapter_image_job_state(uuid,text,text,text) from public,anon;
revoke all on function public.complete_chapter_image_job(uuid,text,text,integer,integer,numeric) from public,anon;
grant execute on function public.enqueue_chapter_image_job(uuid,text,text,text,text,uuid) to authenticated;
grant execute on function public.set_chapter_image_job_state(uuid,text,text,text) to authenticated;
grant execute on function public.complete_chapter_image_job(uuid,text,text,integer,integer,numeric) to authenticated;
