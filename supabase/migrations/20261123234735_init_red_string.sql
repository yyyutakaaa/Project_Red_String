-- Project Red String: backend tables.
-- Only the edge functions (service role) read and write these tables. RLS is enabled with no
-- policies, and table privileges are revoked from anon/authenticated, so the browser cannot query them.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- rate_limits: one counter per device (or per IP) per time window, e.g. "m:2026-11-24T10:05" or "d:2026-11-24"
create table if not exists public.rate_limits (
  device_id text not null,
  "window" text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (device_id, "window")
);
create index if not exists rate_limits_updated_at_idx on public.rate_limits (updated_at);

-- ---------------------------------------------------------------------------
-- usage_log: every model call, with token counts and an estimated cost for the daily spend ceiling
create table if not exists public.usage_log (
  id bigint generated always as identity primary key,
  "timestamp" timestamptz not null default now(),
  device_id text not null,
  "function" text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0
);
create index if not exists usage_log_timestamp_idx on public.usage_log ("timestamp");

-- ---------------------------------------------------------------------------
-- generated_cases: AI-written cases. case_json is set once a draft passes the validator.
create table if not exists public.generated_cases (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  case_json jsonb,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'repairing', 'ready', 'failed')),
  attempts integer not null default 0,
  preferences jsonb not null default '{}'::jsonb,
  draft_json jsonb,
  last_errors jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists generated_cases_device_idx on public.generated_cases (device_id, created_at desc);

-- ---------------------------------------------------------------------------
-- conversations: server-side interrogation state per save (one game run), case and suspect.
-- patience_used is enforced here, so reloading a save in the browser cannot reset it.
create table if not exists public.conversations (
  save_id uuid not null,
  case_key text not null,
  suspect_id text not null,
  device_id text not null,
  patience_used integer not null default 0,
  mood text not null default 'calm' check (mood in ('calm', 'nervous', 'angry', 'broken')),
  shown_evidence text[] not null default '{}',
  revealed_clues text[] not null default '{}',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (save_id, case_key, suspect_id)
);

alter table public.rate_limits enable row level security;
alter table public.usage_log enable row level security;
alter table public.generated_cases enable row level security;
alter table public.conversations enable row level security;

revoke all on table public.rate_limits, public.usage_log, public.generated_cases, public.conversations from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs used by the edge functions. EXECUTE is granted to service_role only.

-- Increment the minute and day counters for a key and report whether the request is allowed.
create or replace function public.rs_hit_rate_limit(
  p_key text,
  p_minute_window text,
  p_day_window text,
  p_minute_limit integer,
  p_day_limit integer
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_minute integer;
  v_day integer;
begin
  insert into rate_limits (device_id, "window", count) values (p_key, p_minute_window, 1)
  on conflict (device_id, "window") do update set count = rate_limits.count + 1, updated_at = now()
  returning count into v_minute;

  insert into rate_limits (device_id, "window", count) values (p_key, p_day_window, 1)
  on conflict (device_id, "window") do update set count = rate_limits.count + 1, updated_at = now()
  returning count into v_day;

  -- occasional cleanup of stale windows
  if random() < 0.02 then
    delete from rate_limits where updated_at < now() - interval '3 days';
  end if;

  return jsonb_build_object(
    'allowed', v_minute <= p_minute_limit and v_day <= p_day_limit,
    'minute_count', v_minute,
    'day_count', v_day,
    'minute_exceeded', v_minute > p_minute_limit,
    'day_exceeded', v_day > p_day_limit
  );
end;
$$;

-- Increment a single counter (used for "5 generations per device per day").
create or replace function public.rs_hit_counter(p_key text, p_window text, p_limit integer)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into rate_limits (device_id, "window", count) values (p_key, p_window, 1)
  on conflict (device_id, "window") do update set count = rate_limits.count + 1, updated_at = now()
  returning count into v_count;
  return jsonb_build_object('allowed', v_count <= p_limit, 'count', v_count, 'remaining', greatest(0, p_limit - v_count));
end;
$$;

-- Undo one counter increment (e.g. a generation that failed before calling the model).
create or replace function public.rs_release_counter(p_key text, p_window text)
returns void
language sql
security invoker
set search_path = public
as $$
  update rate_limits set count = greatest(0, count - 1), updated_at = now()
  where device_id = p_key and "window" = p_window;
$$;

-- Estimated spend since 00:00 UTC today.
create or replace function public.rs_daily_spend_usd()
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(estimated_cost_usd), 0)::numeric
  from usage_log
  where "timestamp" >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
$$;

-- Atomically reserve one question for (save, case, suspect). Returns the state before the reservation.
create or replace function public.rs_claim_question(
  p_save_id uuid,
  p_case_key text,
  p_suspect_id text,
  p_device_id text,
  p_patience_max integer
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row conversations%rowtype;
begin
  insert into conversations (save_id, case_key, suspect_id, device_id)
  values (p_save_id, p_case_key, p_suspect_id, p_device_id)
  on conflict (save_id, case_key, suspect_id) do nothing;

  select * into v_row from conversations
  where save_id = p_save_id and case_key = p_case_key and suspect_id = p_suspect_id
  for update;

  if v_row.device_id <> p_device_id then
    return jsonb_build_object('ok', false, 'reason', 'device_mismatch');
  end if;

  if v_row.patience_used >= p_patience_max then
    return jsonb_build_object('ok', false, 'reason', 'patience_exhausted', 'patience_used', v_row.patience_used);
  end if;

  update conversations set patience_used = patience_used + 1, updated_at = now()
  where save_id = p_save_id and case_key = p_case_key and suspect_id = p_suspect_id;

  return jsonb_build_object(
    'ok', true,
    'patience_used_before', v_row.patience_used,
    'mood', v_row.mood,
    'shown_evidence', to_jsonb(v_row.shown_evidence),
    'revealed_clues', to_jsonb(v_row.revealed_clues),
    'messages', v_row.messages
  );
end;
$$;

-- Give a reserved question back (provider error or timeout: the suspect fell silent).
create or replace function public.rs_release_question(p_save_id uuid, p_case_key text, p_suspect_id text)
returns void
language sql
security invoker
set search_path = public
as $$
  update conversations set patience_used = greatest(0, patience_used - 1), updated_at = now()
  where save_id = p_save_id and case_key = p_case_key and suspect_id = p_suspect_id;
$$;

-- Store a completed exchange. Keeps the last 40 messages.
create or replace function public.rs_record_turn(
  p_save_id uuid,
  p_case_key text,
  p_suspect_id text,
  p_messages jsonb,
  p_shown_evidence text,
  p_revealed text[],
  p_mood text
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update conversations c set
    messages = (
      select coalesce(jsonb_agg(m order by ord), '[]'::jsonb) from (
        select m, ord from jsonb_array_elements(c.messages || p_messages) with ordinality as t(m, ord)
        order by ord desc limit 40
      ) recent
    ),
    shown_evidence = case
      when p_shown_evidence is null or p_shown_evidence = any(c.shown_evidence) then c.shown_evidence
      else array_append(c.shown_evidence, p_shown_evidence) end,
    revealed_clues = (select coalesce(array_agg(distinct x), '{}') from unnest(c.revealed_clues || coalesce(p_revealed, '{}')) as x),
    mood = coalesce(p_mood, c.mood),
    updated_at = now()
  where c.save_id = p_save_id and c.case_key = p_case_key and c.suspect_id = p_suspect_id;
end;
$$;

revoke execute on function public.rs_hit_rate_limit(text, text, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.rs_hit_counter(text, text, integer) from public, anon, authenticated;
revoke execute on function public.rs_release_counter(text, text) from public, anon, authenticated;
revoke execute on function public.rs_daily_spend_usd() from public, anon, authenticated;
revoke execute on function public.rs_claim_question(uuid, text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.rs_release_question(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.rs_record_turn(uuid, text, text, jsonb, text, text[], text) from public, anon, authenticated;

grant execute on function public.rs_hit_rate_limit(text, text, text, integer, integer) to service_role;
grant execute on function public.rs_hit_counter(text, text, integer) to service_role;
grant execute on function public.rs_release_counter(text, text) to service_role;
grant execute on function public.rs_daily_spend_usd() to service_role;
grant execute on function public.rs_claim_question(uuid, text, text, text, integer) to service_role;
grant execute on function public.rs_release_question(uuid, text, text) to service_role;
grant execute on function public.rs_record_turn(uuid, text, text, jsonb, text, text[], text) to service_role;
