-- Bảng hosted_workflows: Lưu trữ workflows được publish bởi user (publisher).
-- Consumer fetch bằng host_id (public access).

CREATE TABLE IF NOT EXISTS public.hosted_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  name text NOT NULL DEFAULT 'Untitled',
  description text DEFAULT '',
  drawflow jsonb NOT NULL DEFAULT '{}'::jsonb,
  table_data jsonb DEFAULT '[]'::jsonb,
  global_data jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  version text DEFAULT '1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hosted_workflows ENABLE ROW LEVEL SECURITY;

-- Policy: Owner can do everything (CRUD)
CREATE POLICY "Users can manage own hosted workflows"
  ON public.hosted_workflows
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Anyone can read hosted workflows (public access for consumers)
CREATE POLICY "Anyone can read hosted workflows by host_id"
  ON public.hosted_workflows
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Indexes
CREATE INDEX idx_hosted_workflows_host_id ON public.hosted_workflows(host_id);
CREATE INDEX idx_hosted_workflows_user_id ON public.hosted_workflows(user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_hosted_workflows_updated
  BEFORE UPDATE ON public.hosted_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.hosted_workflows IS 'Stores hosted workflows published by users. Consumers fetch by host_id.';
