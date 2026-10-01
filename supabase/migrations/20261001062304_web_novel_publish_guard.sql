-- Keep graph rules shared; choose the content requirement by story format.
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
    if exists(select 1 from public.stories st where st.id=p_story_id and st.default_format='web_novel') then
      if not exists(select 1 from public.story_node_prose_publications p where p.node_id=v_id and length(trim(p.body))>0)
        then raise exception 'Published prose required for every web novel node' using errcode='22023'; end if;
    elsif not exists(select 1 from public.chapter_image_sets s where s.node_id=v_id and s.status='published')
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


