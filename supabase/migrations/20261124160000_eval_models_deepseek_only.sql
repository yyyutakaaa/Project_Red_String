-- One model for everything: deepseek-flash (served by DeepSeek-V4.1-Flash-1017). The eval tool may
-- no longer pick another one.
update public.eval_tokens set allowed_models = '{deepseek-flash}';
alter table public.eval_tokens alter column allowed_models set default '{deepseek-flash}';
