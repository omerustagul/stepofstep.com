-- ==========================================
-- PORTFOLIO ENHANCEMENTS MIGRATION
-- ==========================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- Add missing columns to portfolios table
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS challenge TEXT;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS solution TEXT;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS results JSONB DEFAULT '[]';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- Data migration: Sync image -> image_url for existing records
UPDATE public.portfolios 
SET image_url = image 
WHERE image_url IS NULL AND image IS NOT NULL;

-- Ensure RLS is active (it should be, but just in case)
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Re-apply/Update policies if needed
DROP POLICY IF EXISTS "Public read" ON public.portfolios;
CREATE POLICY "Public read" ON public.portfolios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon insert" ON public.portfolios;
CREATE POLICY "Anon insert" ON public.portfolios FOR ALL USING (true);

COMMENT ON TABLE public.portfolios IS 'Stores detailed portfolio projects including descriptions, challenges, and results.';
