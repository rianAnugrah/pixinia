alter table public.chapter_image_generation_jobs
  drop constraint chapter_image_generation_jobs_aspect_ratio_check;
alter table public.chapter_image_generation_jobs
  add constraint chapter_image_generation_jobs_aspect_ratio_check
  check (aspect_ratio in ('auto','1:1','16:9','9:16','4:3','3:4'));

create or replace function public.enqueue_chapter_image_job(
  p_set_id uuid,p_provider text,p_prompt text,p_alt text,p_aspect text,p_key uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_job_id uuid; v_model text; v_reserved numeric(8,4); v_cap numeric(8,4); v_total numeric(8,4);
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Not authorized'; end if;
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
