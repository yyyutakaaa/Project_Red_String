-- One network cannot spend the whole daily AI budget. The question limits are per device and per
-- address, and a script can rotate device ids; this caps what a single network (hashed IP) may spend
-- in a day at a share of the daily limit, so the rest of the budget stays there for everyone else.
--   update public.rs_settings set value = 0.2 where key = 'network_share_of_daily_spend';
-- Remove the row to switch the cap off.
alter table public.usage_log add column if not exists network_key text;
create index if not exists usage_log_network_day_idx on public.usage_log (network_key, "timestamp") where network_key is not null;

insert into public.rs_settings (key, value) values ('network_share_of_daily_spend', 0.2)
on conflict (key) do nothing;

drop function if exists public.rs_reserve_spend(text, text, text, numeric, numeric);

-- Returns the usage_log row id, null when the daily budget is used up, or -1 when this network has
-- used its own share of it.
create or replace function public.rs_reserve_spend(
  p_device_id text,
  p_function text,
  p_model text,
  p_estimate numeric,
  p_limit numeric,
  p_network text default null
)
returns bigint
language plpgsql
set search_path to 'public'
as $function$
declare
  v_spent numeric;
  v_limit numeric;
  v_share numeric;
  v_network_spent numeric;
  v_day timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('rs_daily_spend'));
  select coalesce((select value from rs_settings where key = 'daily_spend_limit_usd'), p_limit) into v_limit;
  select coalesce(sum(estimated_cost_usd), 0) into v_spent from usage_log where "timestamp" >= v_day;
  if v_spent + p_estimate > v_limit then
    return null;
  end if;
  if p_network is not null then
    select value into v_share from rs_settings where key = 'network_share_of_daily_spend';
    if v_share is not null and v_share > 0 and v_share < 1 then
      select coalesce(sum(estimated_cost_usd), 0) into v_network_spent
      from usage_log where network_key = p_network and "timestamp" >= v_day;
      if v_network_spent + p_estimate > v_limit * v_share then
        return -1;
      end if;
    end if;
  end if;
  insert into usage_log (device_id, "function", model, input_tokens, output_tokens, estimated_cost_usd, network_key)
  values (p_device_id, p_function || ':reserved', p_model, 0, 0, p_estimate, p_network)
  returning id into v_id;
  return v_id;
end;
$function$;

revoke execute on function public.rs_reserve_spend(text, text, text, numeric, numeric, text) from public, anon, authenticated;
grant execute on function public.rs_reserve_spend(text, text, text, numeric, numeric, text) to service_role;
