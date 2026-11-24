-- Cloud saves for signed-in players. One row per account and save slot (1-3). The slot itself is
-- the same JSON the game keeps in localStorage. Players can only see and change their own rows.
create table if not exists public.cloud_saves (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 2000000),
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

alter table public.cloud_saves enable row level security;

revoke all on public.cloud_saves from anon, authenticated;
grant select, insert, update, delete on public.cloud_saves to authenticated;

create policy "cloud_saves_select_own" on public.cloud_saves
  for select to authenticated using (user_id = (select auth.uid()));
create policy "cloud_saves_insert_own" on public.cloud_saves
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "cloud_saves_update_own" on public.cloud_saves
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "cloud_saves_delete_own" on public.cloud_saves
  for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.cloud_saves_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cloud_saves_touch on public.cloud_saves;
create trigger cloud_saves_touch before insert or update on public.cloud_saves
  for each row execute function public.cloud_saves_touch();
