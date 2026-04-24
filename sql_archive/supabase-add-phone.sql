-- Add phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'phone') THEN
        ALTER TABLE public.app_users ADD COLUMN phone TEXT;
    END IF;
END $$;

-- Verify other columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.app_users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
