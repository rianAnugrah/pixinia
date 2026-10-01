drop policy if exists "staff preview chapter images" on storage.objects;
create policy "staff preview chapter images" on storage.objects for select to authenticated
  using (bucket_id='story-private' and public.is_staff() and (
    name like (auth.uid()::text || '/%') or exists (
      select 1 from public.chapter_images i where i.storage_path=name
    )
  ));

alter table public.chapter_image_generation_jobs
  drop constraint chapter_image_generation_jobs_status_check;
alter table public.chapter_image_generation_jobs
  add constraint chapter_image_generation_jobs_status_check
  check (status in ('queued','running','processing','finalizing','succeeded','failed','uncertain'));

create or replace function public.set_chapter_image_job_state(
  p_job_id uuid,p_status text,p_task_id text default null,p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old text;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
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
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
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
