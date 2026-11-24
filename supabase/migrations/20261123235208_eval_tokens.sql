-- Tokens for the adversarial eval tool (tools/eval). Stored as SHA-256 hashes only.
-- A valid token lets the interrogate function use a model from allowed_models, skip patience
-- limits and return a judge verdict. Only the service role can read this table.
create table if not exists public.eval_tokens (
  token_hash text primary key,
  label text not null,
  allowed_models text[] not null default '{claude-haiku-5-5,mimo-v2.6-flash,gpt-6.2-sol,claude-opus-5-5}',
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.eval_tokens enable row level security;
revoke all on table public.eval_tokens from anon, authenticated;
