-- ============================================================================
-- Migration: 002_marketplace
-- Description: App Marketplace tables for modular feature system.
-- ============================================================================

-- ─── Marketplace Apps Table ─────────────────────────────────────────────────
-- Registry of all available apps in the marketplace.
-- Managed by admins (via Dashboard or Edge Functions), read by all users.

create table if not exists public.marketplace_apps (
  id text primary key,
  name text not null,
  description text not null default '',
  icon_name text not null default 'Box',
  category text not null default 'Utilities'
    check (category in ('Core', 'Productivity', 'Analytics', 'Development', 'Utilities')),
  is_core boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

comment on table public.marketplace_apps is 'Registry of available apps in the marketplace. Core apps cannot be uninstalled.';

-- ─── User Installed Apps Table ──────────────────────────────────────────────
-- Tracks which apps each user has installed.
-- Core apps are auto-installed and cannot be removed (enforced in app logic).

create table if not exists public.user_installed_apps (
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null references public.marketplace_apps(id) on delete cascade,
  installed_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

comment on table public.user_installed_apps is 'Per-user app installations. Core apps are always installed (enforced in app logic).';

-- ─── RLS ────────────────────────────────────────────────────────────────────

-- marketplace_apps: readable by all authenticated users, writable by nobody (admin via service_role)
alter table public.marketplace_apps enable row level security;

create policy "marketplace_apps_select_authenticated"
  on public.marketplace_apps for select
  to authenticated
  using (true);

-- user_installed_apps: users can only manage their own installations
alter table public.user_installed_apps enable row level security;

create policy "user_installed_apps_select_own"
  on public.user_installed_apps for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_installed_apps_insert_own"
  on public.user_installed_apps for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_installed_apps_delete_own"
  on public.user_installed_apps for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ─── Auto-install Core Apps on User Creation ────────────────────────────────
-- When a new user is created, automatically install all core apps.

create or replace function public.handle_install_core_apps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.user_installed_apps (user_id, app_id)
  select new.id, ma.id
  from public.marketplace_apps ma
  where ma.is_core = true
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_user_install_core_apps on auth.users;

create trigger on_user_install_core_apps
  after insert on auth.users
  for each row
  execute function public.handle_install_core_apps();

-- ─── Grants ─────────────────────────────────────────────────────────────────
grant select on public.marketplace_apps to anon, authenticated;
grant select, insert, delete on public.user_installed_apps to authenticated;

-- ─── Seed Data ──────────────────────────────────────────────────────────────
-- Seed from the current APP_REGISTRY in registry.ts

insert into public.marketplace_apps (id, name, description, icon_name, category, is_core, sort_order) values
  ('dashboard',    'Dashboard',             'Central overview and control panel.',                    'Compass',        'Core',          true,  1),
  ('team',         'Team',                  'Manage team members and permissions.',                   'Users',          'Core',          true,  2),
  ('lifecycle',    'Lifecycle',             'Track software development lifecycle stages.',            'List',           'Productivity',  false, 10),
  ('analytics',    'Analytics',             'Data analytics and reporting tools.',                     'ChartBar',       'Analytics',     false, 11),
  ('projects',     'Projects',              'Manage and track ongoing projects.',                      'Folder',         'Productivity',  false, 12),
  ('documents',    'Documents',             'Data library, reports, and document management.',          'Database',       'Productivity',  false, 13),
  ('showcase',     'UI Showcase',           'Component library showcase for developers.',              'Compass',        'Development',   false, 20),
  ('error-pages',  'Error Pages Simulator', 'Test environment for various HTTP error states.',          'AlertTriangle',  'Development',   false, 21)
on conflict (id) do nothing;
