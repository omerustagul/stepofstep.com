-- Create app_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    app_id TEXT NOT NULL,
    app_name TEXT,
    total_seconds BIGINT DEFAULT 0,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    app_id TEXT,
    app_name TEXT,
    action TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for app_usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.app_usage;
CREATE POLICY "Users can view own usage" ON public.app_usage
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own usage" ON public.app_usage;
CREATE POLICY "Users can insert own usage" ON public.app_usage
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own usage" ON public.app_usage;
CREATE POLICY "Users can update own usage" ON public.app_usage
    FOR UPDATE USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

-- Policies for activity_log
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
CREATE POLICY "Users can view own activity" ON public.activity_log
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_log;
CREATE POLICY "Users can insert own activity" ON public.activity_log
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

-- Add simple index for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_timestamp ON public.activity_log(user_id, timestamp DESC);
