-- Removing a draft node from the graph does not cascade-delete its panel records.
-- The unused draft row can be reviewed and cleaned up separately after a grace period.
create or replace function public.studio_sync_draft_nodes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_node jsonb;
begin
  if new.graph = old.graph then return new; end if;
  for v_node in select value from jsonb_array_elements(new.graph->'nodes') loop
    update public.story_nodes set node_key=v_node->>'key', title=v_node->>'title',
      synopsis=v_node->>'synopsis', node_type=v_node->>'type'
    where id=(v_node->>'id')::uuid and story_id=new.story_id and status='draft';
  end loop;
  return new;
end $$;

-- This runs inside the same transaction as studio_publish_graph, including for direct RPC calls.
create or replace function public.studio_validate_graph_publish()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_total integer; v_can_end integer;
begin
  if new.publication_version = old.publication_version then return new; end if;
  select count(*) into v_total from jsonb_array_elements(new.graph->'nodes');
  with recursive can_end(id) as (
    select (n->>'id')::uuid from jsonb_array_elements(new.graph->'nodes') n where n->>'type'='ending'
    union
    select (c->>'source')::uuid from jsonb_array_elements(new.graph->'choices') c
    join can_end e on e.id=(c->>'target')::uuid
  ) select count(*) into v_can_end from can_end;
  if v_can_end<>v_total then raise exception 'Every node must lead to an ending' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(new.graph->'choices') c
    group by c->>'source',c->>'sortOrder' having count(*)>1)
    then raise exception 'Choice order must be unique per node' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(new.graph->'choices') c
    group by c->>'source',c->>'target',lower(trim(c->>'label')) having count(*)>1)
    then raise exception 'Duplicate choice' using errcode='22023'; end if;
  return new;
end $$;
revoke all on function public.studio_validate_graph_publish() from public,anon,authenticated;
create trigger studio_validate_graph_publish_before_update before update of publication_version
on public.studio_graph_drafts for each row execute function public.studio_validate_graph_publish();
