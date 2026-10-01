create table public.studio_graph_requests (
  story_id uuid not null references public.stories(id) on delete cascade,
  mutation_id uuid not null,
  action text not null check (action in ('save','publish')),
  base_version bigint not null,
  graph jsonb,
  result_version bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key(story_id,mutation_id)
);
create index studio_graph_requests_created on public.studio_graph_requests(created_at);
alter table public.studio_graph_requests enable row level security;
revoke all on public.studio_graph_requests from public,anon,authenticated;

create or replace function public.studio_save_graph_once(p_story_id uuid,p_version bigint,p_graph jsonb,p_mutation_id uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_inserted uuid; v_existing public.studio_graph_requests; v_result bigint;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Staff required' using errcode='42501'; end if;
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

create or replace function public.studio_publish_graph_once(p_story_id uuid,p_version bigint,p_mutation_id uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_inserted uuid; v_existing public.studio_graph_requests; v_result bigint;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
  if p_mutation_id is null then raise exception 'Mutation ID required' using errcode='22023'; end if;
  insert into public.studio_graph_requests(story_id,mutation_id,action,base_version,created_by)
  values(p_story_id,p_mutation_id,'publish',p_version,auth.uid())
  on conflict do nothing returning mutation_id into v_inserted;
  if v_inserted is null then
    select * into v_existing from public.studio_graph_requests where story_id=p_story_id and mutation_id=p_mutation_id;
    if v_existing.action<>'publish' or v_existing.base_version<>p_version
      then raise exception 'Mutation ID reused with different data' using errcode='22023'; end if;
    return v_existing.result_version;
  end if;
  v_result := public.studio_publish_graph(p_story_id,p_version);
  update public.studio_graph_requests set result_version=v_result where story_id=p_story_id and mutation_id=p_mutation_id;
  return v_result;
end $$;

revoke all on function public.studio_save_graph_once(uuid,bigint,jsonb,uuid),
  public.studio_publish_graph_once(uuid,bigint,uuid) from public,anon;
grant execute on function public.studio_save_graph_once(uuid,bigint,jsonb,uuid),
  public.studio_publish_graph_once(uuid,bigint,uuid) to authenticated;
