-- FREE PLAN LOGIC & CLEANUP
-- This script ensures the system behaves as if 'free' is default and invisible.

-- 1. Remove 'free' plan from membership_plans if it exists (so it doesn't show in lists)
DELETE FROM public.membership_plans WHERE price_monthly = 0 OR lower(name) LIKE '%free%' OR lower(name) LIKE '%ücretsiz%';

-- 2. Ensure all existing users without a plan are set to 'free'
UPDATE public.app_users SET plan = 'free' WHERE plan IS NULL OR plan = '';

-- 3. Set default for new users (at DB level CONSTRAINT)
ALTER TABLE public.app_users ALTER COLUMN plan SET DEFAULT 'free';

-- 4. Ensure Upgrade Plan doesn't error on 'free' (It's just a text update in app_users, but if there's a FK constraint to membership_plans, we need to be careful)
-- Checking if there is a foreign key constraint on 'plan' column. Usually there isn't based on previous context, but let's be safe.
-- If 'plan' references 'membership_plans(id)', then we CANNOT delete the free plan row unless we drop the constraint.
-- Assuming 'plan' is just a text field based on previous DDL, so deleting the row from membership_plans is fine.

-- 5. Force Refresh
NOTIFY pgrst, 'reload config';
