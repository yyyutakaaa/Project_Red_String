-- Story cases as server-side data for the edge functions. Seeded from web/src/cases by
-- web/scripts/sync-cases.mjs (supabase/seed/story_cases.sql). The functions compare the SHA-256 of
-- case_text with the hash recorded in the repository (supabase/functions/_shared/cases/index.ts).
create table if not exists public.story_cases (
  id text primary key,
  case_text text not null,
  updated_at timestamptz not null default now()
);
alter table public.story_cases enable row level security;
revoke all on table public.story_cases from anon, authenticated;
