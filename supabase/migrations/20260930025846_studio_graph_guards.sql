-- Keep draft-only node keys synchronized after a graph save. Published rows stay immutable until publication.
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
  delete from public.story_nodes n where n.story_id=new.story_id and n.status='draft'
    and not exists(select 1 from jsonb_array_elements(new.graph->'nodes') item where item->>'id'=n.id::text);
  return new;
end $$;
revoke all on function public.studio_sync_draft_nodes() from public,anon,authenticated;
create trigger studio_sync_draft_nodes_after_save after update of graph on public.studio_graph_drafts
for each row execute function public.studio_sync_draft_nodes();
