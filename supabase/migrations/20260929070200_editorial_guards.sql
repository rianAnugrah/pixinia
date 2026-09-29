-- Public publication remains a controlled future operation. Browser staff may
-- create draft content, but cannot change published status through PostgREST.
drop policy if exists "staff manage stories" on public.stories;
create policy "staff read stories" on public.stories for select to authenticated using (public.is_staff());
create policy "staff insert draft stories" on public.stories for insert to authenticated
with check (public.is_staff() and status = 'draft');

drop policy if exists "staff manage nodes" on public.story_nodes;
create policy "staff read nodes" on public.story_nodes for select to authenticated using (public.is_staff());
create policy "staff insert draft nodes" on public.story_nodes for insert to authenticated
with check (public.is_staff() and status = 'draft' and exists (
  select 1 from public.stories s where s.id = story_id and s.status = 'draft'
));

drop policy if exists "staff manage choices" on public.story_choices;
create policy "staff read choices" on public.story_choices for select to authenticated using (public.is_staff());
create policy "staff insert draft choices" on public.story_choices for insert to authenticated
with check (public.is_staff() and exists (
  select 1 from public.stories s where s.id = story_id and s.status = 'draft'
));

drop policy if exists "staff manage assets" on public.story_assets;
create policy "staff read assets" on public.story_assets for select to authenticated using (public.is_staff());
create policy "staff insert draft assets" on public.story_assets for insert to authenticated
with check (public.is_staff() and status = 'draft' and exists (
  select 1 from public.stories s where s.id = story_id and s.status = 'draft'
));

drop policy if exists "staff manage panels" on public.story_asset_panels;
create policy "staff read panels" on public.story_asset_panels for select to authenticated using (public.is_staff());
create policy "staff insert draft panels" on public.story_asset_panels for insert to authenticated
with check (public.is_staff() and exists (
  select 1 from public.story_assets a join public.stories s on s.id = a.story_id
  where a.id = asset_id and a.status = 'draft' and s.status = 'draft'
));

revoke update, delete on public.stories, public.story_nodes, public.story_choices,
  public.story_assets, public.story_asset_panels from authenticated;

-- Production review records cannot be self-approved from a browser client.
drop policy if exists "staff manage approvals" on public.production_approvals;
revoke insert, update, delete on public.production_approvals from authenticated;
