-- Wallet balance is a cached total; immutable ledger entries are the audit source.
create schema if not exists pixinia_private;
revoke all on schema pixinia_private from public, anon, authenticated;
alter table public.story_nodes add column unlock_cost integer not null default 5 check (unlock_cost between 0 and 1000000);
alter table public.story_nodes add column is_premium boolean not null default false;
alter table public.stories add column unlock_cost integer not null default 5 check (unlock_cost between 0 and 1000000);
alter table public.stories add column is_premium boolean not null default false;

create table public.coin_settings (
  id boolean primary key default true check (id),
  reset_cost integer not null default 0 check (reset_cost between 0 and 1000000)
);
insert into public.coin_settings(id) values (true);
create table public.coin_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 100 check (balance between 0 and 1000000000),
  updated_at timestamptz not null default now()
);
create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  kind text not null check (kind in ('welcome','admin_credit','unlock_node','unlock_story','reset_chapter','redeem_reward')),
  reference_id uuid,
  amount bigint not null,
  balance_after bigint not null check (balance_after between 0 and 1000000000),
  actor_id uuid references auth.users(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique(user_id,request_id)
);
create index coin_transactions_user_created_idx on public.coin_transactions(user_id,created_at desc);
create table public.coin_node_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id uuid not null references public.story_nodes(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,node_id)
);
create index coin_node_unlocks_node_idx on public.coin_node_unlocks(node_id);
create table public.coin_story_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,story_id)
);
create index coin_story_unlocks_story_idx on public.coin_story_unlocks(story_id);
create table public.coin_rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null default '' check (length(description)<=2000),
  cost integer not null check (cost between 1 and 1000000),
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.coin_reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references public.coin_rewards(id),
  request_id uuid not null,
  title text not null, cost integer not null,
  status text not null default 'pending' check (status in ('pending','fulfilled')),
  admin_note text not null default '',
  fulfilled_by uuid references auth.users(id), fulfilled_at timestamptz,
  created_at timestamptz not null default now(), unique(user_id,request_id)
);
create index coin_reward_claims_user_idx on public.coin_reward_claims(user_id,created_at desc);
create index coin_reward_claims_reward_idx on public.coin_reward_claims(reward_id);

-- All users, including pre-existing accounts, receive one welcome grant.
create function pixinia_private.provision_wallet() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.coin_wallets(user_id) values(new.id);
  insert into public.coin_transactions(user_id,request_id,kind,amount,balance_after,note)
    values(new.id,gen_random_uuid(),'welcome',100,100,'Saldo awal');
  return new;
end $$;
create trigger coin_wallet_on_signup after insert on auth.users for each row execute function pixinia_private.provision_wallet();
insert into public.coin_wallets(user_id) select id from auth.users;
insert into public.coin_transactions(user_id,request_id,kind,amount,balance_after,note)
  select user_id,gen_random_uuid(),'welcome',100,100,'Saldo awal' from public.coin_wallets;
-- Preserve ownership of chapters already visited before the coin system was added.
insert into public.coin_node_unlocks(user_id,node_id)
 select user_id,current_node_id from public.user_story_progress where current_node_id is not null on conflict do nothing;
insert into public.coin_node_unlocks(user_id,node_id)
 select distinct p.user_id,n.id from public.user_story_progress p
 cross join lateral jsonb_array_elements(p.choices_history) h
 join public.story_nodes n on n.story_id=p.story_id and (n.id::text=h->>'from_node_id' or n.id::text=h->>'to_node_id')
 on conflict do nothing;

-- Helpers cannot be called by clients. Wallet row locks serialize every debit/credit for one user.
create function pixinia_private.lock_wallet(p_user uuid) returns bigint language plpgsql security definer set search_path='' as $$
declare b bigint;
begin
 if auth.uid() is null or auth.uid()<>p_user then raise exception 'Authentication required' using errcode='42501'; end if;
 select balance into b from public.coin_wallets where user_id=p_user for update;
 if not found then raise exception 'Wallet unavailable' using errcode='P0002'; end if;
 return b;
end $$;
create function pixinia_private.spend(p_user uuid,p_request uuid,p_kind text,p_ref uuid,p_cost integer) returns boolean language plpgsql security definer set search_path='' as $$
declare b bigint; t public.coin_transactions;
begin
 b:=pixinia_private.lock_wallet(p_user);
 if p_request is null or p_cost<0 then raise exception 'Invalid transaction'; end if;
 select * into t from public.coin_transactions where user_id=p_user and request_id=p_request;
 if found then
   if t.kind<>p_kind or t.reference_id is distinct from p_ref then raise exception 'Request ID reused' using errcode='22023'; end if;
   return false;
 end if;
 if b<p_cost then raise exception 'Coin tidak cukup' using errcode='P0001'; end if;
 update public.coin_wallets set balance=balance-p_cost,updated_at=now() where user_id=p_user returning balance into b;
 insert into public.coin_transactions(user_id,request_id,kind,reference_id,amount,balance_after,actor_id)
 values(p_user,p_request,p_kind,p_ref,-p_cost,b,p_user);
 return true;
end $$;
create function public.coin_can_read_node(p_node uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_staff() or exists(
   select 1 from public.story_nodes n join public.stories s on s.id=n.story_id
   where n.id=p_node and n.status='published' and s.status='published' and s.visibility='public'
   and ((n.unlock_cost=0 and not n.is_premium and not s.is_premium)
    or exists(select 1 from public.coin_node_unlocks u where u.node_id=n.id and u.user_id=auth.uid())
    or exists(select 1 from public.coin_story_unlocks u where u.story_id=n.story_id and u.user_id=auth.uid()))
 );
$$;
create function pixinia_private.unlock_node(p_node uuid,p_request uuid) returns void language plpgsql security definer set search_path='' as $$
declare n public.story_nodes;
begin
 perform pixinia_private.lock_wallet(auth.uid());
 select * into n from public.story_nodes where id=p_node and status='published' and exists(
 select 1 from public.stories s where s.id=story_id and s.status='published' and s.visibility='public') for share;
 if not found then raise exception 'Node unavailable' using errcode='P0002'; end if;
 if public.coin_can_read_node(n.id) then return; end if;
 perform pixinia_private.spend(auth.uid(),p_request,'unlock_node',n.id,n.unlock_cost);
 insert into public.coin_node_unlocks(user_id,node_id) values(auth.uid(),n.id) on conflict do nothing;
end $$;
create function public.coin_unlock_node(p_node_id uuid,p_request_id uuid) returns bigint language plpgsql security definer set search_path='' as $$
begin
 perform pixinia_private.unlock_node(p_node_id,p_request_id);
 return (select balance from public.coin_wallets where user_id=auth.uid());
end $$;
create function public.coin_unlock_story(p_story_id uuid,p_request_id uuid) returns bigint language plpgsql security definer set search_path='' as $$
declare s public.stories;
begin
 perform pixinia_private.lock_wallet(auth.uid());
 select * into s from public.stories where id=p_story_id and status='published' and visibility='public' and is_premium for share;
 if not found then raise exception 'Premium comic unavailable'; end if;
 if exists(select 1 from public.coin_story_unlocks where user_id=auth.uid() and story_id=s.id) then
 return (select balance from public.coin_wallets where user_id=auth.uid()); end if;
 perform pixinia_private.spend(auth.uid(),p_request_id,'unlock_story',s.id,s.unlock_cost);
 insert into public.coin_story_unlocks(user_id,story_id) values(auth.uid(),s.id);
 return (select balance from public.coin_wallets where user_id=auth.uid());
end $$;

-- Preserve the old progress implementation inside a non-exposed schema; new wrappers enforce payment.
alter function public.start_story(uuid) set schema pixinia_private;
alter function public.apply_story_choice(uuid,uuid) set schema pixinia_private;
revoke all on function pixinia_private.start_story(uuid),pixinia_private.apply_story_choice(uuid,uuid) from public,anon,authenticated;
create function public.start_story(p_story_id uuid) returns public.user_story_progress language plpgsql security definer set search_path='' as $$
declare n uuid; p public.user_story_progress;
begin
 perform pixinia_private.lock_wallet(auth.uid());
 select * into p from public.user_story_progress where user_id=auth.uid() and story_id=p_story_id for update;
 if found then return p; end if;
 select id into n from public.story_nodes where story_id=p_story_id and is_start and status='published';
 perform pixinia_private.unlock_node(n,gen_random_uuid());
 return pixinia_private.start_story(p_story_id);
end $$;
create function public.apply_story_choice(p_story_id uuid,p_choice_id uuid) returns public.user_story_progress language plpgsql security definer set search_path='' as $$
declare c public.story_choices; p public.user_story_progress;
begin
 perform pixinia_private.lock_wallet(auth.uid());
 select * into c from public.story_choices where id=p_choice_id and story_id=p_story_id and condition_json='{}'::jsonb for share;
 if not found then raise exception 'Choice unavailable'; end if;
 select * into p from public.user_story_progress where user_id=auth.uid() and story_id=p_story_id for update;
 if not found or p.current_node_id<>c.node_id then raise exception 'Progress changed' using errcode='40001'; end if;
 if not public.coin_can_read_node(c.node_id) then raise exception 'Unlock source chapter first' using errcode='42501'; end if;
 perform pixinia_private.unlock_node(c.next_node_id,gen_random_uuid());
 return pixinia_private.apply_story_choice(p_story_id,p_choice_id);
end $$;
create function public.coin_reset_chapter(p_node_id uuid,p_request_id uuid) returns public.user_story_progress language plpgsql security definer set search_path='' as $$
declare n public.story_nodes; p public.user_story_progress; cost integer;
begin
 perform pixinia_private.lock_wallet(auth.uid());
 select * into n from public.story_nodes where id=p_node_id and status='published' and exists(
 select 1 from public.stories s where s.id=story_id and s.status='published' and s.visibility='public');
 if not found or not public.coin_can_read_node(n.id) then raise exception 'Unlock chapter first' using errcode='42501'; end if;
 select reset_cost into cost from public.coin_settings where id=true for share;
 if not pixinia_private.spend(auth.uid(),p_request_id,'reset_chapter',n.id,cost) then
 select * into p from public.user_story_progress where user_id=auth.uid() and story_id=n.story_id; return p; end if;
 -- Start a new branch from the selected owned chapter. Ownership of paid content is preserved.
 insert into public.user_story_progress(user_id,story_id,current_node_id,choices_history,completed_at)
 values(auth.uid(),n.story_id,n.id,'[]'::jsonb,case when n.node_type='ending' then now() end)
 on conflict(user_id,story_id) do update set current_node_id=n.id,choices_history='[]'::jsonb,
 completed_at=case when n.node_type='ending' then now() end,updated_at=now() returning * into p;
 return p;
end $$;

create function public.coin_redeem_reward(p_reward_id uuid,p_request_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.coin_rewards; claim uuid;
begin
 perform pixinia_private.lock_wallet(auth.uid());
 select id into claim from public.coin_reward_claims where user_id=auth.uid() and request_id=p_request_id;
 if found then
 if not exists(select 1 from public.coin_reward_claims where id=claim and reward_id=p_reward_id) then raise exception 'Request ID reused'; end if;
 return claim; end if;
 select * into r from public.coin_rewards where id=p_reward_id and active for share;
 if not found then raise exception 'Reward unavailable'; end if;
 perform pixinia_private.spend(auth.uid(),p_request_id,'redeem_reward',r.id,r.cost);
 insert into public.coin_reward_claims(user_id,reward_id,request_id,title,cost) values(auth.uid(),r.id,p_request_id,r.title,r.cost) returning id into claim;
 return claim;
end $$;
create function public.admin_grant_coins(p_user_id uuid,p_amount integer,p_note text,p_request_id uuid) returns bigint language plpgsql security definer set search_path='' as $$
declare b bigint; t public.coin_transactions;
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_request_id is null or p_amount is null or p_amount not between 1 and 1000000 or p_note is null or length(trim(p_note)) not between 3 and 500 then raise exception 'Invalid credit'; end if;
 select balance into b from public.coin_wallets where user_id=p_user_id for update;
 if not found then raise exception 'User unavailable'; end if;
 select * into t from public.coin_transactions where user_id=p_user_id and request_id=p_request_id;
 if found then
 if t.kind<>'admin_credit' or t.actor_id<>auth.uid() or t.amount<>p_amount or t.note<>trim(p_note) then raise exception 'Request ID reused'; end if;
 return b; end if;
 update public.coin_wallets set balance=balance+p_amount,updated_at=now() where user_id=p_user_id returning balance into b;
 insert into public.coin_transactions(user_id,request_id,kind,amount,balance_after,actor_id,note)
 values(p_user_id,p_request_id,'admin_credit',p_amount,b,auth.uid(),trim(p_note));
 return b;
end $$;
create function public.admin_set_coin_price(p_kind text,p_id uuid,p_cost integer,p_premium boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_cost is null or p_cost not between 0 and 1000000 then raise exception 'Invalid price'; end if;
 if p_kind='reset' then if p_cost<>0 then raise exception 'Reset chapter gratis'; end if; update public.coin_settings set reset_cost=0 where id=true;
 elsif p_kind='node' then update public.story_nodes set unlock_cost=p_cost,is_premium=coalesce(p_premium,false) where id=p_id;
 elsif p_kind='story' then update public.stories set unlock_cost=p_cost,is_premium=coalesce(p_premium,false) where id=p_id;
 else raise exception 'Invalid price kind'; end if;
 if not found then raise exception 'Pricing target unavailable'; end if;
end $$;
create function public.admin_save_coin_reward(p_id uuid,p_title text,p_description text,p_cost integer,p_active boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_cost is null or p_cost not between 1 and 1000000 then raise exception 'Invalid reward cost'; end if;
 if p_id is null then insert into public.coin_rewards(title,description,cost,active) values(trim(p_title),p_description,p_cost,p_active) returning id into v_id;
 else update public.coin_rewards set title=trim(p_title),description=p_description,cost=p_cost,active=p_active where id=p_id returning id into v_id; end if;
 if v_id is null then raise exception 'Reward unavailable'; end if;
 return v_id;
end $$;
create function public.admin_fulfill_coin_reward(p_claim_id uuid,p_note text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_note is null or length(trim(p_note)) not between 3 and 500 then raise exception 'Note required'; end if;
 update public.coin_reward_claims set status='fulfilled',admin_note=trim(p_note),fulfilled_by=auth.uid(),fulfilled_at=now() where id=p_claim_id and status='pending';
end $$;

-- Only checked RPCs can write wallets, ledger, ownership and reward claims.
do $$ declare t text; begin
 foreach t in array array['coin_settings','coin_wallets','coin_transactions','coin_node_unlocks','coin_story_unlocks','coin_rewards','coin_reward_claims'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on table public.%I from anon,authenticated',t);
 execute format('grant select on table public.%I to authenticated',t);
 end loop;
end $$;
grant select on public.coin_settings,public.coin_rewards to anon;
create policy "read coin settings" on public.coin_settings for select to anon,authenticated using(true);
create policy "read own wallet" on public.coin_wallets for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy "read own ledger" on public.coin_transactions for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy "read own node unlocks" on public.coin_node_unlocks for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy "read own story unlocks" on public.coin_story_unlocks for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy "read active rewards" on public.coin_rewards for select to anon,authenticated using(active or public.is_admin());
create policy "read own claims" on public.coin_reward_claims for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());

-- Restrictive policies AND with existing editorial/public policies: a public reader needs ownership.
create policy "coin asset access" on public.story_assets as restrictive for select to anon,authenticated using(public.is_staff() or public.coin_can_read_node(node_id));
create policy "coin panel access" on public.story_asset_panels as restrictive for select to anon,authenticated using(public.is_staff() or exists(select 1 from public.story_assets a where a.id=asset_id and public.coin_can_read_node(a.node_id)));
create policy "coin choice access" on public.story_choices as restrictive for select to anon,authenticated using(public.is_staff() or public.coin_can_read_node(node_id));
create policy "coin image set access" on public.chapter_image_sets as restrictive for select to anon,authenticated using(public.is_staff() or public.coin_can_read_node(node_id));
create policy "coin image access" on public.chapter_images as restrictive for select to anon,authenticated using(public.is_staff() or exists(select 1 from public.chapter_image_sets s where s.id=set_id and public.coin_can_read_node(s.node_id)));
-- Old public Storage panels must no longer bypass ownership. Covers stay readable through a signed cover route.
update storage.buckets set public=false where id='story-public';
create policy "coin storage access" on storage.objects as restrictive for select to anon,authenticated using(
 bucket_id not in ('story-public','story-private') or public.is_staff()
 or exists(select 1 from public.stories st where st.status='published' and st.visibility='public' and bucket_id='story-public' and (st.cover_path=name or st.cover_path='story-public/'||name))
 or exists(select 1 from public.story_assets a where a.storage_bucket=bucket_id and a.storage_path=name and a.status='published' and public.coin_can_read_node(a.node_id))
 or exists(select 1 from public.chapter_images i join public.chapter_image_sets s on s.id=i.set_id where bucket_id='story-private' and i.storage_path=name and s.status='published' and public.coin_can_read_node(s.node_id))
);
create policy "read coin media" on storage.objects for select to anon,authenticated using(
 (bucket_id='story-public' and exists(select 1 from public.stories st where st.status='published' and st.visibility='public' and (st.cover_path=name or st.cover_path='story-public/'||name)))
 or exists(select 1 from public.story_assets a where a.storage_bucket=bucket_id and a.storage_path=name and a.status='published' and public.coin_can_read_node(a.node_id))
);

revoke all on all functions in schema pixinia_private from public,anon,authenticated;
do $$ declare f text; begin
 foreach f in array array['coin_can_read_node(uuid)','coin_unlock_node(uuid,uuid)','coin_unlock_story(uuid,uuid)','start_story(uuid)','apply_story_choice(uuid,uuid)','coin_reset_chapter(uuid,uuid)','coin_redeem_reward(uuid,uuid)','admin_grant_coins(uuid,integer,text,uuid)','admin_set_coin_price(text,uuid,integer,boolean)','admin_save_coin_reward(uuid,text,text,integer,boolean)','admin_fulfill_coin_reward(uuid,text)'] loop
 execute 'revoke all on function public.'||f||' from public,anon,authenticated';
 execute 'grant execute on function public.'||f||' to authenticated';
 end loop;
end $$;
grant execute on function public.coin_can_read_node(uuid) to anon;

