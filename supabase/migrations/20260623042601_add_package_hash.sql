-- ============================================================================
-- Migration: add_package_hash
-- Description: Add package_hash column to public.marketplace_apps and public.app_versions.
-- ============================================================================

-- Add package_hash column to public.marketplace_apps
alter table public.marketplace_apps
  add column if not exists package_hash text;

comment on column public.marketplace_apps.package_hash is 'SHA-256 hash of the currently deployed app package zip.';

-- Add package_hash column to public.app_versions
alter table public.app_versions
  add column if not exists package_hash text;

comment on column public.app_versions.package_hash is 'SHA-256 hash of the specific version app package zip.';
