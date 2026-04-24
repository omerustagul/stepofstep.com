-- ==========================================
-- WHEEL REWARD & AUTH FIXES
-- ==========================================

-- 1. Update wheel_spins with claiming logic
ALTER TABLE public.wheel_spins ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false;
ALTER TABLE public.wheel_spins ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- 2. Fix RLS policies for wheel_spins (using app_users.auth_id)
DROP POLICY IF EXISTS "User Spin History" ON public.wheel_spins;
CREATE POLICY "User Spin History" ON public.wheel_spins 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE app_users.id = public.wheel_spins.user_id 
            AND app_users.auth_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Fix app_users self-view policy (ensure it's using auth_id)
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
CREATE POLICY "Users can view own profile" ON public.app_users 
    FOR SELECT USING (auth_id = auth.uid());

-- 4. Ensure roles table is accessible
DROP POLICY IF EXISTS "allow_public_select" ON public.roles;
CREATE POLICY "allow_public_select" ON public.roles FOR SELECT USING (true);

-- 5. Fix team_members RLS (allow read for admins)
DROP POLICY IF EXISTS "allow_public_select" ON public.team_members;
CREATE POLICY "allow_public_select" ON public.team_members FOR SELECT USING (true);

-- 6. Add admin check for team_members inserts
DROP POLICY IF EXISTS "allow_public_insert" ON public.team_members;
CREATE POLICY "allow_admin_insert" ON public.team_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.app_users 
        WHERE auth_id = auth.uid() AND role = 'admin'
    )
);
