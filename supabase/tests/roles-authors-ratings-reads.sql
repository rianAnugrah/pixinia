-- Disposable PostgreSQL test database only. Assertions run as actual API roles.
begin;
create temporary table role_test_ids as select
 gen_random_uuid() creator_a,gen_random_uuid() creator_b,gen_random_uuid() reader_a,
 gen_random_uuid() reader_b,gen_random_uuid() admin_a,gen_random_uuid() story_a,gen_random_uuid() story_b,
 gen_random_uuid() node_a,gen_random_uuid() node_b,gen_random_uuid() set_b,gen_random_uuid() image_b,gen_random_uuid() job_b;
grant select on role_test_ids to anon,authenticated;
select set_config('request.jwt.claim.sub','',true);
insert into auth.users(id,raw_user_meta_data) select creator_a,'{}'::jsonb from role_test_ids
 union all select creator_b,'{}'::jsonb from role_test_ids union all select reader_a,'{}'::jsonb from role_test_ids
 union all select reader_b,'{}'::jsonb from role_test_ids union all select admin_a,'{}'::jsonb from role_test_ids;
update public.profiles set role='creator',display_name='Creator A' where id=(select creator_a from role_test_ids);
update public.profiles set role='creator',display_name='Creator B' where id=(select creator_b from role_test_ids);
update public.profiles set role='admin' where id=(select admin_a from role_test_ids);
insert into public.stories(id,slug,title,author_id,created_by) select story_a,'role-test-a','Test A',creator_a,creator_a from role_test_ids;
insert into public.stories(id,slug,title,author_id,created_by) select story_b,'role-test-b','Test B',creator_b,creator_b from role_test_ids;
insert into public.story_nodes(id,story_id,node_key,title,is_start,unlock_cost)
 select node_a,story_a,'start','Start A',true,0 from role_test_ids union all select node_b,story_b,'start','Start B',true,5 from role_test_ids;
insert into public.chapter_image_sets(id,story_id,node_id,created_by) select set_b,story_b,node_b,creator_b from role_test_ids;
insert into storage.objects(bucket_id,name) select 'story-private',creator_b::text||'/'||node_b::text||'/00000000-0000-4000-8000-000000000001.webp' from role_test_ids;
insert into storage.objects(bucket_id,name) select 'story-public','covers/'||story_b::text||'/00000000-0000-4000-8000-000000000001.webp' from role_test_ids;
insert into public.chapter_images(id,set_id,position,storage_path,mime_type,width,height,alt_text,source,created_by)
 select image_b,set_b,1,creator_b::text||'/'||node_b::text||'/00000000-0000-4000-8000-000000000001.webp','image/webp',100,100,'Test B image','upload',creator_b from role_test_ids;
insert into public.chapter_image_generation_jobs(id,set_id,requested_by,provider,model,prompt,alt_text,aspect_ratio,idempotency_key,reserved_cost_usd)
 select job_b,set_b,creator_b,'kie','test-model','Test image prompt','Test B','1:1',gen_random_uuid(),0.03 from role_test_ids;
insert into public.story_node_prose_drafts(node_id,body) select node_b,'Private prose B' from role_test_ids;

select set_config('request.jwt.claim.sub',(select creator_a::text from role_test_ids),true);
set local role authenticated;
do $$ declare t record; d public.studio_graph_drafts; begin
 select * into t from role_test_ids;
 assert public.is_staff(),'Creator gets Studio';
 assert public.studio_can_manage_story(t.story_a),'Own story editable';
 assert not public.studio_can_manage_story(t.story_b),'Other author rejected';
 assert (select count(*)=1 from public.stories where id in (t.story_a,t.story_b)),'Only own draft visible';
 d:=public.studio_begin_graph(t.story_a);
 assert d.story_id=t.story_a,'Own draft opens';
 begin perform public.studio_begin_graph(t.story_b); raise exception 'Other draft opened'; exception when insufficient_privilege then null; end;
 begin perform public.studio_save_graph_once(t.story_b,1,d.graph,gen_random_uuid()); raise exception 'Other graph saved'; exception when insufficient_privilege then null; end;
 begin perform public.begin_chapter_image_draft(t.node_b); raise exception 'Other image draft opened'; exception when raise_exception then if sqlerrm<>'Not authorized' then raise; end if; end;
 assert (select count(*)=0 from public.chapter_image_sets where id=t.set_b),'Other image set hidden';
 assert (select count(*)=0 from public.chapter_images where id=t.image_b),'Other image hidden';
 assert (select count(*)=0 from public.chapter_image_generation_jobs where id=t.job_b),'Other AI job hidden';
 assert (select count(*)=0 from public.story_node_prose_drafts where node_id=t.node_b),'Other prose hidden';
 begin perform public.update_chapter_image(t.image_b,'Forgery',null,null,null); raise exception 'Other image updated'; exception when raise_exception then if sqlerrm<>'Not authorized' then raise; end if; end;
 begin perform public.move_chapter_image(t.image_b,1,1); raise exception 'Other image moved'; exception when raise_exception then if sqlerrm<>'Not authorized' then raise; end if; end;
 begin perform public.remove_chapter_image(t.image_b); raise exception 'Other image removed'; exception when raise_exception then if sqlerrm<>'Not authorized' then raise; end if; end;
 begin perform public.enqueue_chapter_image_job(t.set_b,'kie','Valid test prompt','Test','1:1',gen_random_uuid()); raise exception 'Other AI job enqueued'; exception when raise_exception then if sqlerrm<>'Not authorized' then raise; end if; end;
 begin perform public.set_chapter_image_job_state(t.job_b,'running',null,null); raise exception 'Other AI job changed'; exception when raise_exception then if sqlerrm<>'Not authorized' then raise; end if; end;
 assert (select count(*)=0 from storage.objects where name like '%'||t.node_b::text||'%' or name like '%'||t.story_b::text||'%'),'Other storage hidden';
 begin insert into storage.objects(bucket_id,name) values('story-public','covers/'||t.story_b::text||'/'||gen_random_uuid()::text||'.webp'); raise exception 'Other cover uploaded'; exception when insufficient_privilege then null; end;
 begin update public.stories set cover_path='covers/'||t.story_b::text||'/00000000-0000-4000-8000-000000000001.webp' where id=t.story_a; raise exception 'Other cover attached'; exception when insufficient_privilege then null; end;
 begin insert into public.story_node_prose_drafts(node_id,body) values(t.node_b,'Forgery') on conflict(node_id) do update set body=excluded.body; raise exception 'Other prose saved'; exception when insufficient_privilege then null; end;
 begin perform public.admin_grant_coins(t.reader_a,1,'Unauthorized',gen_random_uuid()); raise exception 'Creator credited coins'; exception when insufficient_privilege then null; end;
 begin update public.profiles set role='admin' where id=auth.uid(); raise exception 'Role escalation'; exception when insufficient_privilege then null; end;
 update public.stories set tags=array['test'] where id=t.story_a;
 assert (select tags=array['test'] from public.stories where id=t.story_a),'Own metadata saved';
 begin update public.stories set author_id=t.creator_b where id=t.story_a; raise exception 'Author reassigned'; exception when insufficient_privilege then null; end;
 begin insert into public.stories(slug,title,author_id,created_by) values('forged-author','Forgery',t.creator_b,auth.uid()); raise exception 'Forged author'; exception when insufficient_privilege then null; end;
 assert not public.coin_can_read_node(t.node_b),'Creator cannot bypass another story paywall';
end $$;
reset role;
update public.stories set status='published' where id in (select story_a from role_test_ids union all select story_b from role_test_ids);
update public.story_nodes set status='published' where id in (select node_a from role_test_ids union all select node_b from role_test_ids);

select set_config('request.jwt.claim.sub',(select reader_a::text from role_test_ids),true);
set local role authenticated;
do $$ declare t record; begin
 select * into t from role_test_ids;
 assert not public.is_staff(),'Reader has no Studio';
 begin perform public.studio_begin_graph(t.story_a); raise exception 'Reader entered Studio'; exception when insufficient_privilege then null; end;
 begin perform public.admin_manage_user(t.reader_b,'creator',true); raise exception 'Reader changed role'; exception when insufficient_privilege then null; end;
 begin perform public.reader_touch_session(t.node_b); raise exception 'Locked chapter counted'; exception when insufficient_privilege then null; end;
 assert not public.reader_touch_session(t.node_a),'Initial heartbeat not counted';
 assert not public.reader_touch_session(t.node_a),'Immediate retry not counted';
 assert (select count(*)=1 from public.story_read_sessions where story_id=t.story_a),'Retry keeps one session';
 begin perform public.rate_story(t.story_a,5); raise exception 'Unread rating accepted'; exception when insufficient_privilege then null; end;
 begin perform public.story_analytics(30,null,null); raise exception 'Reader got analytics'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Simulate elapsed SERVER time without sleeping or accepting a browser duration.
set local role authenticated;
select public.reader_pause_session((select node_a from role_test_ids));
reset role;
update public.story_read_sessions set last_seen_at=clock_timestamp()-interval '10 seconds' where user_id=(select reader_a from role_test_ids);
set local role authenticated;
do $$ declare previous double precision; begin
 select active_seconds into previous from public.story_read_sessions where user_id=auth.uid();
 perform public.reader_touch_session((select node_a from role_test_ids));
 assert (select active_seconds=previous from public.story_read_sessions where user_id=auth.uid()),'Hidden-tab time excluded';
end $$;
reset role;
update public.story_read_sessions set active_seconds=29,last_seen_at=clock_timestamp()-interval '5 seconds' where user_id=(select reader_a from role_test_ids);
set local role authenticated;
do $$ declare t record; m record; begin
 select * into t from role_test_ids;
 assert public.reader_touch_session(t.node_a),'Thirty seconds qualifies';
 perform public.reader_touch_session(t.node_a);
 perform public.rate_story(t.story_a,5); perform public.rate_story(t.story_a,3);
 assert (select count(*)=1 from public.story_ratings where story_id=t.story_a),'Rating update does not duplicate';
 select * into m from public.story_public_metrics(array[t.story_a]);
 assert m.read_count=1 and m.reader_count=1,'One session and unique reader';
 assert m.rating_average=3 and m.rating_count=1,'Rating aggregate correct';
 begin perform public.rate_story(t.story_a,6); raise exception 'Invalid score accepted'; exception when invalid_parameter_value then null; end;
end $$;
reset role;
update public.story_read_sessions set last_seen_at=clock_timestamp()-interval '31 minutes' where user_id=(select reader_a from role_test_ids);
set local role authenticated;
select public.reader_touch_session((select node_a from role_test_ids));
reset role;
update public.story_read_sessions set active_seconds=29,last_seen_at=clock_timestamp()-interval '5 seconds' where user_id=(select reader_a from role_test_ids) and counted_at is null;
set local role authenticated;
select public.reader_touch_session((select node_a from role_test_ids));
reset role;
select set_config('request.jwt.claim.sub',(select reader_b::text from role_test_ids),true);
set local role authenticated;
select public.reader_touch_session((select node_a from role_test_ids));
reset role;
update public.story_read_sessions set active_seconds=29,last_seen_at=clock_timestamp()-interval '5 seconds' where user_id=(select reader_b from role_test_ids);
set local role authenticated;
select public.reader_touch_session((select node_a from role_test_ids));
reset role;
select set_config('request.jwt.claim.sub',(select creator_a::text from role_test_ids),true);
set local role authenticated;
do $$ declare t record; m record; a jsonb; begin
 select * into t from role_test_ids;
 select * into m from public.story_public_metrics(array[t.story_a]);
 assert m.read_count=3 and m.reader_count=2,'Replay counts sessions, users stay unique';
 begin perform public.rate_story(t.story_a,5); raise exception 'Author rated own story'; exception when insufficient_privilege then null; end;
 a:=public.story_analytics(30,null,null);
 assert (a->>'stories')::integer=1 and a->'users'='null'::jsonb,'Creator analytics scoped';
 assert (a->>'readers')::integer=2,'Creator distinct readers';
end $$;
reset role;

select set_config('request.jwt.claim.sub',(select admin_a::text from role_test_ids),true);
set local role authenticated;
do $$ declare t record; req uuid:=gen_random_uuid(); balance_before bigint; begin
 select * into t from role_test_ids;
 select balance into balance_before from public.coin_wallets where user_id=t.reader_a;
 perform public.admin_grant_coins(t.reader_a,10,'Role test credit',req);
 perform public.admin_grant_coins(t.reader_a,10,'Role test credit',req);
 assert (select balance=balance_before+10 from public.coin_wallets where user_id=t.reader_a),'Coin retry credited once';
 perform public.admin_manage_user(t.reader_b,'creator',true);
 assert (select role='creator' from public.profiles where id=t.reader_b),'Admin promotes Creator';
 perform public.admin_assign_author(t.story_b,t.creator_a);
 assert (select author_id=t.creator_a from public.stories where id=t.story_b),'Admin reassigns author';
 begin perform public.admin_manage_user(t.admin_a,'reader',false); raise exception 'Admin deactivated self'; exception when raise_exception then if sqlerrm<>'You cannot demote or deactivate yourself' then raise; end if; end;
 perform public.admin_manage_user(t.creator_a,'creator',false);
 assert (select count(*)=3 from public.admin_audit_events where actor_id=auth.uid()),'Account and author audit recorded';
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select creator_a::text from role_test_ids),true);
set local role authenticated;
do $$ declare t record; begin
 select * into t from role_test_ids;
 assert not public.is_staff(),'Disabled Creator loses Studio';
 assert not public.studio_can_manage_story(t.story_a),'Disabled Creator loses ownership privileges';
 begin perform public.reader_touch_session(t.node_a); raise exception 'Disabled account tracked'; exception when insufficient_privilege then null; end;
 begin perform public.start_story(t.story_a); raise exception 'Disabled account spent coin'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ declare t record; m record; begin
 select * into t from role_test_ids;
 begin assert (select count(*)=0 from public.studio_graph_drafts),'Anon draft rows hidden'; exception when insufficient_privilege then null; end;
 begin perform public.rate_story(t.story_a,5); raise exception 'Anon rated'; exception when insufficient_privilege then null; end;
 select * into m from public.story_public_metrics(array[t.story_a]);
 assert m.read_count=3 and m.reader_count=2 and m.rating_count=1,'Anonymous aggregate allowed';
end $$;
reset role;
rollback;
