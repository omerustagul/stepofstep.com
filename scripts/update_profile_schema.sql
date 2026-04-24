
-- Add subscription_end_date to app_users
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Enable RLS on membership_plans (if not already)
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing read policy if overlapping
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON membership_plans;
DROP POLICY IF EXISTS "Plans are viewable by authenticated users" ON membership_plans;

-- Create policy for reading plans (Authenticated users)
CREATE POLICY "Plans are viewable by authenticated users" 
ON membership_plans FOR SELECT 
TO authenticated 
USING (true);

-- Ensure public read if needed (optional, stick to authenticated first)
