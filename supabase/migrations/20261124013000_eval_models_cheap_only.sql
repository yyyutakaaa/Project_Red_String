-- Eval token models: cheap OmniaKey models plus DeepSeek direct.
update public.eval_tokens set allowed_models = '{claude-haiku-5-5,mimo-v2.6-flash,deepseek-chat}';
alter table public.eval_tokens alter column allowed_models set default '{claude-haiku-5-5,mimo-v2.6-flash,deepseek-chat}';
