-- ============================================================================
-- Migration: create_e2e_workflows
-- Description: Create e2e_workflows table with RLS.
-- ============================================================================

create table if not exists public.e2e_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  workflow_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.e2e_workflows is 'Stores default Automa E2E workflows.';

-- Enable RLS
alter table public.e2e_workflows enable row level security;

-- Read policies for authenticated users
create policy "e2e_workflows_select_authenticated"
  on public.e2e_workflows for select
  to authenticated
  using (true);

-- Manage policies for admin users
create policy "e2e_workflows_manage_admin"
  on public.e2e_workflows for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
