-- The graph draft is private editorial data. Reader tables remain the published projection.
create table public.studio_graph_drafts (
  story_id uuid primary key references public.stories(id) on delete cascade,
  version bigint not null default 1,
  publication_version bigint not null default 0,
  graph jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint studio_graph_shape check (jsonb_typeof(graph) = 'object')
);
create table public.studio_graph_publications (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  version bigint not null,
  graph jsonb not null,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  unique(story_id, version)
);
create index studio_graph_publications_story on public.studio_graph_publications(story_id, version desc);
alter table public.studio_graph_drafts enable row level security;
alter table public.studio_graph_publications enable row level security;
grant select on public.studio_graph_drafts, public.studio_graph_publications to authenticated;
create policy "staff read graph drafts" on public.studio_graph_drafts for select to authenticated using (public.is_staff());
create policy "staff read graph publications" on public.studio_graph_publications for select to authenticated using (public.is_staff());

create or replace function public.studio_begin_graph(p_story_id uuid)
returns public.studio_graph_drafts language plpgsql security definer set search_path = '' as $$
declare v_draft public.studio_graph_drafts; v_episode uuid := gen_random_uuid();
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Staff required' using errcode='42501'; end if;
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

-- All saves are compare-and-swap. Only a future published projection can affect readers.
create or replace function public.studio_save_graph(p_story_id uuid,p_version bigint,p_graph jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_draft public.studio_graph_drafts; v_node jsonb; v_choice jsonb; v_episode jsonb;
  v_id uuid; v_existing public.story_nodes; v_count bigint; v_key text;
  v_node_ids uuid[] := '{}'; v_keys text[] := '{}'; v_episode_ids uuid[] := '{}'; v_choice_ids uuid[] := '{}';
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'Staff required' using errcode='42501'; end if;
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

create or replace function public.studio_publish_graph(p_story_id uuid,p_version bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_draft public.studio_graph_drafts; v_node jsonb; v_choice jsonb; v_start uuid;
  v_id uuid; v_publication bigint; v_total integer; v_reachable integer; strict_cycle boolean;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
  select * into v_draft from public.studio_graph_drafts where story_id=p_story_id for update;
  if not found or v_draft.version<>p_version then raise exception 'Graph changed; reload' using errcode='40001'; end if;
  select count(*) into v_total from jsonb_array_elements(v_draft.graph->'nodes');
  if v_total=0 then raise exception 'Graph has no nodes' using errcode='22023'; end if;
  if (select count(*) from jsonb_array_elements(v_draft.graph->'nodes') n where n->>'start'='true')<>1
    then raise exception 'Exactly one start node required' using errcode='22023'; end if;
  if not exists(select 1 from jsonb_array_elements(v_draft.graph->'nodes') n where n->>'type'='ending')
    then raise exception 'At least one ending required' using errcode='22023'; end if;
  select (n->>'id')::uuid into v_start from jsonb_array_elements(v_draft.graph->'nodes') n where n->>'start'='true';
  for v_node in select value from jsonb_array_elements(v_draft.graph->'nodes') loop
    v_id := (v_node->>'id')::uuid;
    if v_node->>'type'='ending' and exists(select 1 from jsonb_array_elements(v_draft.graph->'choices') c where c->>'source'=v_id::text)
      then raise exception 'Ending cannot have choices' using errcode='22023'; end if;
    if v_node->>'type'<>'ending' and not exists(select 1 from jsonb_array_elements(v_draft.graph->'choices') c where c->>'source'=v_id::text)
      then raise exception 'Non-ending has no choice' using errcode='22023'; end if;
    if not exists(select 1 from public.chapter_image_sets s where s.node_id=v_id and s.status='published')
       and not exists(select 1 from public.story_assets a where a.node_id=v_id and a.status='published')
      then raise exception 'Published panel required for every node' using errcode='22023'; end if;
  end loop;
  -- A bounded traversal detects cycles and unreachable nodes before any public row is changed.
  with recursive walk(id,path,cycle) as (
    select v_start,array[v_start],false
    union all
    select (c->>'target')::uuid,w.path||(c->>'target')::uuid,
      (c->>'target')::uuid=any(w.path)
    from walk w cross join lateral jsonb_array_elements(v_draft.graph->'choices') c
    where c->>'source'=w.id::text and not w.cycle and cardinality(w.path)<=v_total
  ) select count(distinct id),coalesce(bool_or(cycle),false) into v_reachable,strict_cycle
    from walk;
  if strict_cycle then raise exception 'Graph contains a cycle' using errcode='22023'; end if;
  if v_reachable<>v_total then raise exception 'Graph contains unreachable nodes' using errcode='22023'; end if;
  -- Existing progress refers to node IDs, which stay stable.
  update public.story_nodes set is_start=false where story_id=p_story_id and is_start;
  for v_node in select value from jsonb_array_elements(v_draft.graph->'nodes') loop
    update public.story_nodes set title=v_node->>'title',synopsis=v_node->>'synopsis',
      node_type=v_node->>'type',status='published',is_start=(v_node->>'start')::boolean
      where id=(v_node->>'id')::uuid and story_id=p_story_id;
  end loop;
  delete from public.story_choices c where c.story_id=p_story_id and not exists
    (select 1 from jsonb_array_elements(v_draft.graph->'choices') j where j->>'id'=c.id::text);
  for v_choice in select value from jsonb_array_elements(v_draft.graph->'choices') loop
    insert into public.story_choices(id,story_id,node_id,next_node_id,label,description,sort_order,condition_json)
    values((v_choice->>'id')::uuid,p_story_id,(v_choice->>'source')::uuid,(v_choice->>'target')::uuid,
      v_choice->>'label',v_choice->>'description',(v_choice->>'sortOrder')::integer,coalesce(v_choice->'condition','{}'::jsonb))
    on conflict(id) do update set node_id=excluded.node_id,next_node_id=excluded.next_node_id,
      label=excluded.label,description=excluded.description,sort_order=excluded.sort_order,
      condition_json=excluded.condition_json;
  end loop;
  update public.stories set status='published',published_at=coalesce(published_at,now()) where id=p_story_id;
  update public.studio_graph_drafts set publication_version=publication_version+1,version=version+1,
    updated_at=now(),updated_by=auth.uid() where story_id=p_story_id returning publication_version into v_publication;
  insert into public.studio_graph_publications(story_id,version,graph,published_by)
    values(p_story_id,v_publication,v_draft.graph,auth.uid());
  return v_publication;
end $$;

revoke all on function public.studio_begin_graph(uuid),public.studio_save_graph(uuid,bigint,jsonb),
  public.studio_publish_graph(uuid,bigint) from public,anon;
grant execute on function public.studio_begin_graph(uuid),public.studio_save_graph(uuid,bigint,jsonb),
  public.studio_publish_graph(uuid,bigint) to authenticated;
