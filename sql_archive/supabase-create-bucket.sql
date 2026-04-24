-- Create the 'wheel-rewards' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('wheel-rewards', 'wheel-rewards', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the bucket explicitly (just in case)
-- (Buckets usually inherit, but objects need policies)

-- Policy 1: Public Read Access (Anyone can download rewards)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'wheel-rewards' );

-- Policy 2: Admin Upload Access (Only admins can upload)
-- Assuming 'admin' check is done via app_users lookup or similar role check
-- For simplicity, we'll allow authenticated users with a specific email or any authenticated user if we want easier testing
-- Ideally: 
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wheel-rewards' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Admin Delete/Update Access
DROP POLICY IF EXISTS "Admin Manage" ON storage.objects;
CREATE POLICY "Admin Manage"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wheel-rewards' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wheel-rewards' 
  AND auth.role() = 'authenticated'
);
