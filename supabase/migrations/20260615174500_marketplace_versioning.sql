-- ============================================================================
-- Migration: 005_marketplace_versioning
-- Description: Expand App Marketplace schema with versioning, S3 storage URL, and ownership.
-- ============================================================================

-- ─── Helper function to check if the current user is an Admin ────────────────
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
end;
$$;

comment on function public.is_admin is 'Helper function to check if the current user is an Admin based on profiles table.';

-- ─── Alter public.marketplace_apps ───────────────────────────────────────────
alter table public.marketplace_apps
  add column if not exists owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists current_version text not null default '1.0.0',
  add column if not exists download_url text;

comment on column public.marketplace_apps.owner_id is 'Owner/Publisher of the app who has rights to deploy updates.';
comment on column public.marketplace_apps.current_version is 'The latest active version of the app.';
comment on column public.marketplace_apps.download_url is 'Url pointing to the ZIP package in Supabase Storage.';

-- Set owner for existing core apps (seed data fallback to admin or null)
-- In a real DB, owner_id would be populated upon creation.

-- ─── Create public.app_versions table ───────────────────────────────────────
create table if not exists public.app_versions (
  id uuid primary key default gen_random_uuid(),
  app_id text not null references public.marketplace_apps(id) on delete cascade,
  version text not null,
  download_url text not null,
  changelog text,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(app_id, version)
);

comment on table public.app_versions is 'Stores release history and changelogs for marketplace apps.';

-- Enable RLS on app_versions
alter table public.app_versions enable row level security;

-- Policies for app_versions
create policy "app_versions_select_authenticated"
  on public.app_versions for select
  to authenticated
  using (true);

create policy "app_versions_insert_owner_admin"
  on public.app_versions for insert
  to authenticated
  with check (
    public.is_admin() or exists (
      select 1 from public.marketplace_apps
      where id = app_id and owner_id = auth.uid()
    )
  );

-- ─── RLS Policies for marketplace_apps updates ──────────────────────────────
-- Enable updates only for owners and admins
create policy "marketplace_apps_update_owner_admin"
  on public.marketplace_apps for update
  to authenticated
  using (auth.uid() = owner_id or public.is_admin())
  with check (auth.uid() = owner_id or public.is_admin());

-- ─── Supabase Storage app-packages Bucket Setup ──────────────────────────────
-- Insert storage bucket configuration if it doesn't exist (via internal bucket table)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('app-packages', 'app-packages', true, 52428800, '{application/zip,application/x-zip-compressed}')
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = '{application/zip,application/x-zip-compressed}';

-- RLS policies for storage bucket 'app-packages'
create policy "Allow public authenticated read of packages"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'app-packages');

create policy "Allow owners and admins to upload packages"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'app-packages' and (
      public.is_admin() or exists (
        -- Extract the root folder name from the storage path (which is the app_id)
        select 1 from public.marketplace_apps
        where id = (storage.foldername(storage.objects.name))[1] and owner_id = auth.uid()
      )
    )
  );

create policy "Allow owners and admins to delete packages"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'app-packages' and (
      public.is_admin() or exists (
        select 1 from public.marketplace_apps
        where id = (storage.foldername(storage.objects.name))[1] and owner_id = auth.uid()
      )
    )
  );
