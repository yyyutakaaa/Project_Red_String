-- The eval token may only pick the cheap models (gpt-6.2-sol removed for cost).
update public.eval_tokens set allowed_models = '{claude-haiku-5-5,mimo-v2.6-flash}';
alter table public.eval_tokens alter column allowed_models set default '{claude-haiku-5-5,mimo-v2.6-flash}';
