-- The daily AI budget can be set in the database, overriding DAILY_SPEND_LIMIT_USD in the function
-- secrets. While the game is not public there is no practical limit (1000 USD a day).
-- Lower it later with:  update public.rs_settings set value = 5 where key = 'daily_spend_limit_usd';
-- Remove the row to go back to the function secret.
create table if not exists public.rs_settings (
  key text primary key,
  value numeric not null
);
alter table public.rs_settings enable row level security;
revoke all on public.rs_settings from anon, authenticated;

insert into public.rs_settings (key, value) values ('daily_spend_limit_usd', 1000)
on conflict (key) do update set value = excluded.value;

create or replace function public.rs_reserve_spend(p_device_id text, p_function text, p_model text, p_estimate numeric, p_limit numeric)
returns bigint
language plpgsql
set search_path to 'public'
as $function$
declare
  v_spent numeric;
  v_limit numeric;
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('rs_daily_spend'));
  select coalesce((select value from rs_settings where key = 'daily_spend_limit_usd'), p_limit) into v_limit;
  select coalesce(sum(estimated_cost_usd), 0) into v_spent
  from usage_log
  where "timestamp" >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if v_spent + p_estimate > v_limit then
    return null;
  end if;
  insert into usage_log (device_id, "function", model, input_tokens, output_tokens, estimated_cost_usd)
  values (p_device_id, p_function || ':reserved', p_model, 0, 0, p_estimate)
  returning id into v_id;
  return v_id;
end;
$function$;
