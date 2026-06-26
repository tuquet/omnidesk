-- Migration: Create user_preferences table

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  home_screen_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.user_preferences is 'Stores user-specific preferences like home screen layout.';

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own"
  on public.user_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_preferences_delete_own"
  on public.user_preferences for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- trigger for updated_at
create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row
  execute function public.handle_updated_at();

grant select, insert, update, delete on public.user_preferences to authenticated;
