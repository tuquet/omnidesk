-- ============================================================================
-- Migration: 006_seed_wordpress_sync
-- Description: Seed the wordpress-sync marketplace app and upgrade default admin account to ADMIN role.
-- ============================================================================

-- 1. Upgrade the default admin account (a23fb5f5-f37c-47fc-8f6a-4d2d1f7cba73) to ADMIN role
update public.profiles
set role = 'ADMIN'
where id = 'a23fb5f5-f37c-47fc-8f6a-4d2d1f7cba73';

-- 2. Seed the wordpress-sync app with owner_id set to the default admin account
insert into public.marketplace_apps (
  id,
  name,
  description,
  icon_name,
  category,
  is_core,
  sort_order,
  owner_id,
  current_version
) values (
  'wordpress-sync',
  'WordPress Sync',
  'WordPress GitOps content & media synchronization workspace.',
  'RefreshCw',
  'Development',
  false,
  100,
  'a23fb5f5-f37c-47fc-8f6a-4d2d1f7cba73',
  '1.0.0'
)
on conflict (id) do update set
  owner_id = excluded.owner_id,
  name = excluded.name,
  description = excluded.description,
  icon_name = excluded.icon_name,
  category = excluded.category,
  is_core = excluded.is_core,
  sort_order = excluded.sort_order;
