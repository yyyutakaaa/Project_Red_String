-- DeepSeek renamed its chat model: deepseek-chat is now served by deepseek-flash.
update public.eval_tokens set allowed_models = '{claude-haiku-5-5,mimo-v2.6-flash,deepseek-chat,deepseek-flash}';
alter table public.eval_tokens alter column allowed_models set default '{claude-haiku-5-5,mimo-v2.6-flash,deepseek-chat,deepseek-flash}';
