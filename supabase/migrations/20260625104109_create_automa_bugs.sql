-- 1. Tạo bảng lưu trữ thông tin bug từ Automa
CREATE TABLE public.automa_bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    screenshot_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS (Row Level Security) nhưng cho phép Insert không giới hạn (ẩn danh) từ Automa
ALTER TABLE public.automa_bugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.automa_bugs
    FOR INSERT WITH CHECK (true);

-- 2. Tạo Public Storage Bucket có tên 'bug_assets'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bug_assets', 'bug_assets', true);

-- Cho phép upload ảnh ẩn danh (anon)
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'bug_assets');

-- Cho phép ai cũng có quyền đọc ảnh
CREATE POLICY "Allow public read" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'bug_assets');
