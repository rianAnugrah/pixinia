-- Public graph metadata only. Paid choice text/panels still use ownership RLS.
create function public.reader_story_edges(p_story_id uuid)
returns table(node_id uuid,next_node_id uuid)
language sql stable security definer set search_path='' as $$
 select distinct c.node_id,c.next_node_id
 from public.story_choices c
 join public.stories s on s.id=c.story_id
 join public.story_nodes a on a.id=c.node_id and a.story_id=s.id
 join public.story_nodes b on b.id=c.next_node_id and b.story_id=s.id
 where s.id=p_story_id and s.status='published' and s.visibility='public'
 and a.status='published' and b.status='published' and c.condition_json='{}'::jsonb;
$$;
revoke all on function public.reader_story_edges(uuid) from public,anon,authenticated;
grant execute on function public.reader_story_edges(uuid) to anon,authenticated;
