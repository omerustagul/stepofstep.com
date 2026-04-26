-- Create message_replies table for messaging loop
CREATE TABLE IF NOT EXISTS public.message_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'user')),
  content text NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Add meeting_link to job_applications
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS meeting_confirmed boolean DEFAULT false;

-- Add RLS policies for message_replies
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read replies to their messages" ON public.message_replies;
CREATE POLICY "Users can read replies to their messages"
  ON public.message_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_messages 
      WHERE id = message_replies.message_id 
      AND email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Users can insert replies to their messages" ON public.message_replies;
CREATE POLICY "Users can insert replies to their messages"
  ON public.message_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contact_messages 
      WHERE id = message_replies.message_id 
      AND email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Admins can read all replies" ON public.message_replies;
CREATE POLICY "Admins can read all replies"
  ON public.message_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_id = auth.uid() 
      AND (role = 'admin' OR role = 'marketing' OR role = 'designer')
    )
  );

DROP POLICY IF EXISTS "Admins can insert replies" ON public.message_replies;
CREATE POLICY "Admins can insert replies"
  ON public.message_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_id = auth.uid() 
      AND (role = 'admin' OR role = 'marketing' OR role = 'designer')
    )
  );

-- Add meeting columns to appointments if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'meeting_link') THEN
        ALTER TABLE public.appointments ADD COLUMN meeting_link text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'meeting_confirmed') THEN
        ALTER TABLE public.appointments ADD COLUMN meeting_confirmed boolean DEFAULT false;
    END IF;
END $$;

-- Allow admins to delete replies (needed for ON DELETE CASCADE when deleting a message)
DROP POLICY IF EXISTS "Admins can delete replies" ON public.message_replies;
CREATE POLICY "Admins can delete replies"
  ON public.message_replies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_id = auth.uid() 
      AND (role = 'admin')
    )
  );

-- Allow admins to delete contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete messages" ON public.contact_messages;
CREATE POLICY "Admins can delete messages"
  ON public.contact_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_id = auth.uid() 
      AND (role = 'admin')
    )
  );

-- Allow users to update their own contact_messages (for reply status updates)
DROP POLICY IF EXISTS "Users can update their own messages" ON public.contact_messages;
CREATE POLICY "Users can update their own messages"
  ON public.contact_messages
  FOR UPDATE
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- Function to handle new replies (Auto-update status)
CREATE OR REPLACE FUNCTION public.handle_new_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- If the sender is a user, mark the message as new (unread) for admins
  IF NEW.sender_role = 'user' THEN
    UPDATE public.contact_messages
    SET 
        status = 'new',
        is_read = false
    WHERE id = NEW.message_id;
  END IF;
  
  -- If the sender is an admin, mark the message as replied
  IF NEW.sender_role = 'admin' THEN
    UPDATE public.contact_messages
    SET 
        status = 'replied',
        replied_at = NOW()
    WHERE id = NEW.message_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for message_replies
DROP TRIGGER IF EXISTS on_new_reply ON public.message_replies;
CREATE TRIGGER on_new_reply
  AFTER INSERT ON public.message_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_reply();

-- Add is_read column to contact_messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contact_messages' AND column_name = 'is_read') THEN
        ALTER TABLE public.contact_messages ADD COLUMN is_read boolean DEFAULT false;
    END IF;
END $$;
