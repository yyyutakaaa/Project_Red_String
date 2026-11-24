-- Anonymous play statistics. The game sends what players do in a case (rooms opened, evidence found,
-- questions asked and what they revealed, the accusation) with the random device id it already uses
-- for interrogations, so these rows join usage_log. Never typed text, names or account details.
-- Only the events edge function writes here (service role); the browser cannot read or write it.
create table if not exists public.play_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  client_at timestamptz,
  device_id uuid not null,
  session_id uuid not null,
  seq integer not null,
  name text not null check (name ~ '^[a-z_]{2,32}$'),
  case_key text check (char_length(case_key) <= 64),
  props jsonb not null default '{}'::jsonb check (jsonb_typeof(props) = 'object' and pg_column_size(props) < 2000),
  app_version text check (char_length(app_version) <= 40),
  platform text check (char_length(platform) <= 20)
);

create index if not exists play_events_case_name on public.play_events (case_key, name);
create index if not exists play_events_device_time on public.play_events (device_id, received_at);

alter table public.play_events enable row level security;
revoke all on public.play_events from anon, authenticated;

-- Per case: how many devices reached each step. Read it top to bottom to see where players fall away.
create or replace view public.play_case_funnel with (security_invoker = true) as
select
  case_key,
  count(distinct device_id) as players,
  count(distinct device_id) filter (where name = 'room_open') as opened_a_room,
  count(distinct device_id) filter (where name = 'evidence_found') as found_evidence,
  count(distinct device_id) filter (where name = 'question') as asked_a_question,
  count(distinct device_id) filter (where name = 'question' and props ->> 'shown' is not null) as showed_evidence,
  count(distinct device_id) filter (where name = 'clue_revealed') as got_a_clue,
  count(distinct device_id) filter (where name = 'theory_checked') as checked_theory,
  count(distinct device_id) filter (where name = 'hint_used') as used_a_hint,
  count(distinct device_id) filter (where name = 'accusation') as accused,
  count(distinct device_id) filter (where name = 'accusation' and props ->> 'outcome' = 'correct') as solved
from public.play_events
where case_key is not null
group by case_key;

-- Players who left a case without accusing anyone: the last thing they did there, and when.
create or replace view public.play_last_step with (security_invoker = true) as
select distinct on (e.device_id, e.case_key)
  e.case_key,
  e.device_id,
  e.name as last_event,
  e.props as last_props,
  e.received_at as last_seen,
  (select count(*) from public.play_events q
    where q.device_id = e.device_id and q.case_key = e.case_key and q.name = 'question') as questions_asked
from public.play_events e
where e.case_key is not null
  and not exists (
    select 1 from public.play_events a
    where a.device_id = e.device_id and a.case_key = e.case_key and a.name = 'accusation'
  )
order by e.device_id, e.case_key, e.received_at desc, e.seq desc;

-- Evidence shown to suspects: how often each pairing was tried and how often it revealed a clue.
create or replace view public.play_evidence_shows with (security_invoker = true) as
select
  case_key,
  props ->> 'shown' as evidence,
  props ->> 'suspect' as suspect,
  count(*) as shows,
  count(*) filter (where coalesce((props ->> 'clues')::numeric, 0) > 0) as shows_with_a_clue
from public.play_events
where name = 'question' and props ->> 'shown' is not null
group by case_key, props ->> 'shown', props ->> 'suspect';

revoke all on public.play_case_funnel, public.play_last_step, public.play_evidence_shows from anon, authenticated;
