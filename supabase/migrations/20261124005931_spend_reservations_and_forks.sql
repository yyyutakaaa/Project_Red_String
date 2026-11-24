-- 1. Spend ceiling without a race: a model call first reserves its worst-case cost in usage_log under an
--    advisory lock (refused when today's total plus the estimate would pass the limit), then settles the
--    row to the real cost. A call that fails keeps its estimate (or its partial cost), so failed or
--    interrupted calls still count toward the ceiling.
-- 2. Save forks: "save to another slot" gives the copy a new run id. The first time the copy questions a
--    suspect, rs_claim_question copies the parent run's state (patience, mood, shown evidence, clues,
--    transcript), so a copied save can neither reset patience nor lose progress.

create or replace function public.rs_reserve_spend(
  p_device_id text,
  p_function text,
  p_model text,
  p_estimate numeric,
  p_limit numeric
) returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_spent numeric;
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('rs_daily_spend'));
  select coalesce(sum(estimated_cost_usd), 0) into v_spent
  from usage_log
  where "timestamp" >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if v_spent + p_estimate > p_limit then
    return null;
  end if;
  insert into usage_log (device_id, "function", model, input_tokens, output_tokens, estimated_cost_usd)
  values (p_device_id, p_function || ':reserved', p_model, 0, 0, p_estimate)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.rs_settle_spend(
  p_id bigint,
  p_function text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_cost numeric
) returns void
language sql
security invoker
set search_path = public
as $$
  update usage_log
  set "function" = p_function, input_tokens = p_input_tokens, output_tokens = p_output_tokens, estimated_cost_usd = p_cost
  where id = p_id;
$$;

drop function if exists public.rs_claim_question(uuid, text, text, text, integer);

create or replace function public.rs_claim_question(
  p_save_id uuid,
  p_case_key text,
  p_suspect_id text,
  p_device_id text,
  p_patience_max integer,
  p_parent_save_id uuid default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row conversations%rowtype;
  v_parent conversations%rowtype;
  v_inserted boolean;
begin
  insert into conversations (save_id, case_key, suspect_id, device_id)
  values (p_save_id, p_case_key, p_suspect_id, p_device_id)
  on conflict (save_id, case_key, suspect_id) do nothing;
  v_inserted := found;

  if v_inserted and p_parent_save_id is not null and p_parent_save_id <> p_save_id then
    select * into v_parent from conversations
    where save_id = p_parent_save_id and case_key = p_case_key and suspect_id = p_suspect_id;
    if found and v_parent.device_id = p_device_id then
      update conversations set
        patience_used = v_parent.patience_used,
        mood = v_parent.mood,
        shown_evidence = v_parent.shown_evidence,
        revealed_clues = v_parent.revealed_clues,
        messages = v_parent.messages,
        updated_at = now()
      where save_id = p_save_id and case_key = p_case_key and suspect_id = p_suspect_id;
    end if;
  end if;

  select * into v_row from conversations
  where save_id = p_save_id and case_key = p_case_key and suspect_id = p_suspect_id
  for update;

  if v_row.device_id <> p_device_id then
    return jsonb_build_object('ok', false, 'reason', 'device_mismatch');
  end if;

  if v_row.patience_used >= p_patience_max then
    return jsonb_build_object(
      'ok', false,
      'reason', 'patience_exhausted',
      'patience_used', v_row.patience_used,
      'revealed_clues', to_jsonb(v_row.revealed_clues)
    );
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

revoke execute on function public.rs_reserve_spend(text, text, text, numeric, numeric) from public, anon, authenticated;
revoke execute on function public.rs_settle_spend(bigint, text, integer, integer, numeric) from public, anon, authenticated;
revoke execute on function public.rs_claim_question(uuid, text, text, text, integer, uuid) from public, anon, authenticated;
grant execute on function public.rs_reserve_spend(text, text, text, numeric, numeric) to service_role;
grant execute on function public.rs_settle_spend(bigint, text, integer, integer, numeric) to service_role;
grant execute on function public.rs_claim_question(uuid, text, text, text, integer, uuid) to service_role;
