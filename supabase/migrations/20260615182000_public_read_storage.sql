-- ============================================================================
-- Migration: 008_public_read_storage
-- Description: Allow public read access to storage packages for both anon and authenticated users.
-- ============================================================================

-- Update select policy for storage.objects on bucket 'app-packages' to allow public access
drop policy if exists "Allow public authenticated read of packages" on storage.objects;

create policy "Allow public read of packages"
  on storage.objects for select
  using (bucket_id = 'app-packages');
