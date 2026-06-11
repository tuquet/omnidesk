-- ============================================================================
-- Migration: 001_profiles
-- Description: Create profiles table extending auth.users with display info.
-- ============================================================================

-- ─── Profiles Table ─────────────────────────────────────────────────────────
-- Extends auth.users with application-specific user data.
-- Uses auth.uid() for RLS, not user_metadata (which is user-editable).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'USER' check (role in ('GUEST', 'USER', 'ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles extending auth.users with display name, avatar, and role.';

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- All authenticated users can read all profiles (for team views, avatars, etc.)
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Users can insert their own profile (for the trigger fallback)
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- ─── Auto-create Profile on Signup ──────────────────────────────────────────
-- Trigger function runs as SECURITY INVOKER (not DEFINER) for safety.
-- Creates a profile row when a new user signs up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'preferred_username',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    case
      when new.is_anonymous then 'GUEST'
      else 'USER'
    end
  );
  return new;
end;
$$;

-- Drop existing trigger if it exists (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─── Updated_at Trigger ─────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- ─── Grants ─────────────────────────────────────────────────────────────────
-- Explicitly grant access to anon and authenticated roles.
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
