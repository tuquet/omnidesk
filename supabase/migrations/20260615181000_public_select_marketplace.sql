-- ============================================================================
-- Migration: 007_public_select_marketplace
-- Description: Allow public read (select) access to marketplace_apps and app_versions for both anon and authenticated users.
-- ============================================================================

-- 1. Update select policy for marketplace_apps to allow public access
drop policy if exists "marketplace_apps_select_authenticated" on public.marketplace_apps;

create policy "marketplace_apps_select_public"
  on public.marketplace_apps for select
  using (true);

-- 2. Update select policy for app_versions to allow public access
drop policy if exists "app_versions_select_authenticated" on public.app_versions;

create policy "app_versions_select_public"
  on public.app_versions for select
  using (true);
