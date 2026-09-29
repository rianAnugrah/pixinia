-- New Supabase projects may grant function EXECUTE explicitly to API roles.
revoke execute on function public.start_story(uuid) from public, anon, authenticated;
revoke execute on function public.apply_story_choice(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.start_story(uuid) to authenticated;
grant execute on function public.apply_story_choice(uuid, uuid) to authenticated;

alter function public.set_updated_at() set search_path = '';
