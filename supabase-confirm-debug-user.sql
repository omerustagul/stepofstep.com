-- Confirm the debug user account locally for testing
-- This sets the email_confirmed_at timestamp, bypassing the email verification requirement
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'debug_agent_001@gmail.com';
