-- Notifications System
-- Table for storing user notifications

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('promo', 'system', 'project', 'achievement', 'info', 'warning', 'success', 'error')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional link to redirect user
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can insert notifications for any user (or system can via service role)
-- For now allowing authenticated users to insert (e.g. triggering an action for themselves or system events)
-- Ideally this should be restricted, but for rapid dev allowing insert self or admin
CREATE POLICY "Users can insert own or Admin all" ON public.notifications
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.app_users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Seed some test notifications
-- (Optional, can be removed)
-- INSERT INTO public.notifications (user_id, type, title, message)
-- SELECT id, 'system', 'Hoş Geldiniz', 'Step Of Step bildirim sistemine hoş geldiniz!'
-- FROM public.app_users
-- LIMIT 1;
