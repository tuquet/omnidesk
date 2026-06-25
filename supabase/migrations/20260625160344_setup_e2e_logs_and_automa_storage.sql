-- 1. Create table e2e_logs
CREATE TABLE IF NOT EXISTS public.e2e_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on e2e_logs
ALTER TABLE public.e2e_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create INSERT policy for e2e_logs
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'e2e_logs' AND policyname = 'Enable insert for anon'
    ) THEN 
        CREATE POLICY "Enable insert for anon" ON public.e2e_logs FOR INSERT TO anon WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'e2e_logs' AND policyname = 'Enable insert for authenticated'
    ) THEN 
        CREATE POLICY "Enable insert for authenticated" ON public.e2e_logs FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'e2e_logs' AND policyname = 'Enable select for anon'
    ) THEN 
        CREATE POLICY "Enable select for anon" ON public.e2e_logs FOR SELECT TO anon USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'e2e_logs' AND policyname = 'Enable select for authenticated'
    ) THEN 
        CREATE POLICY "Enable select for authenticated" ON public.e2e_logs FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 4. Create storage bucket automa-workflows
INSERT INTO storage.buckets (id, name, public)
VALUES ('automa-workflows', 'automa-workflows', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Create storage policy for the bucket
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access to Automa Workflows'
    ) THEN 
        CREATE POLICY "Public Access to Automa Workflows" ON storage.objects FOR SELECT TO public USING (bucket_id = 'automa-workflows');
    END IF;
END $$;
