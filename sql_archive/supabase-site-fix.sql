-- Add missing columns to site_settings table
DO $$ 
BEGIN 
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS logo_width_desktop INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS logo_width_mobile INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS if not enabled
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy for viewing (everyone)
CREATE POLICY IF NOT EXISTS "Allow public read-only access" ON site_settings
FOR SELECT USING (true);

-- Policy for updating (admins only)
CREATE POLICY IF NOT EXISTS "Allow admins to update settings" ON site_settings
FOR UPDATE USING (auth.uid() IN (SELECT auth_id FROM app_users WHERE role = 'admin'));
END $$;

COMMENT ON COLUMN public.site_settings.favicon_url IS 'Site favicon URL as base64 or storage link';
COMMENT ON COLUMN public.site_settings.logo_width_desktop IS 'Logo width on desktop screens in pixels';
COMMENT ON COLUMN public.site_settings.logo_width_mobile IS 'Logo width on mobile screens in pixels';
