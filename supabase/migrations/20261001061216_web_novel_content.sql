-- Story format is a catalog category. Existing stories remain comics.
alter table public.stories drop constraint if exists stories_default_format_check;
alter table public.stories add constraint stories_default_format_check
  check (default_format in ('comic', 'motion_comic', 'video', 'web_novel'));

create table public.story_node_prose_drafts (
  node_id uuid primary key references public.story_nodes(id) on delete cascade,
  body text not null default '' check (length(body) <= 200000),
  updated_at timestamptz not null default now()
);
create table public.story_node_prose_publications (
  node_id uuid primary key references public.story_nodes(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 200000),
  published_at timestamptz not null default now()
);
create trigger story_node_prose_drafts_updated before update on public.story_node_prose_drafts
  for each row execute function public.set_updated_at();

alter table public.story_node_prose_drafts enable row level security;
alter table public.story_node_prose_publications enable row level security;
revoke all on public.story_node_prose_drafts, public.story_node_prose_publications from anon, authenticated;
grant select, insert, update on public.story_node_prose_drafts to authenticated;
grant select, insert, update on public.story_node_prose_publications to authenticated;
grant select on public.story_node_prose_publications to anon;
create policy "staff read prose drafts" on public.story_node_prose_drafts for select to authenticated using (public.is_staff());
create policy "staff insert prose drafts" on public.story_node_prose_drafts for insert to authenticated with check (public.is_staff());
create policy "staff update prose drafts" on public.story_node_prose_drafts for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "read owned published prose" on public.story_node_prose_publications for select to anon, authenticated
  using (public.is_staff() or public.coin_can_read_node(node_id));
create policy "admin publish prose" on public.story_node_prose_publications for insert to authenticated
  with check (public.is_admin() and exists (
    select 1 from public.story_nodes n join public.stories s on s.id=n.story_id
    where n.id=node_id and s.default_format='web_novel'));
create policy "admin revise prose" on public.story_node_prose_publications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- A novel graph cannot become public with blank chapters, including direct RPC calls.
create or replace function public.validate_web_novel_graph_content()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.publication_version=old.publication_version then return new; end if;
  if exists(select 1 from public.stories s where s.id=new.story_id and s.default_format='web_novel')
    and exists(
      select 1 from jsonb_array_elements(new.graph->'nodes') item
      where not exists(select 1 from public.story_node_prose_publications p
        where p.node_id=(item->>'id')::uuid and length(trim(p.body))>0)
    ) then raise exception 'Publish every web novel chapter before publishing the story graph' using errcode='22023';
  end if;
  return new;
end $$;
revoke all on function public.validate_web_novel_graph_content() from public, anon, authenticated;
create trigger validate_web_novel_graph_content_before_publish before update of publication_version
  on public.studio_graph_drafts for each row execute function public.validate_web_novel_graph_content();
