-- Keep admin audit and reward fulfillment foreign-key lookups indexed.
create index coin_transactions_actor_idx on public.coin_transactions(actor_id);
create index coin_reward_claims_fulfilled_by_idx on public.coin_reward_claims(fulfilled_by);
