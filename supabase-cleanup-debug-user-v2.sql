-- Robust cleanup for debug user that handles Foreign Key constraints
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID based on email
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'debug_agent_001@gmail.com';

    IF target_user_id IS NOT NULL THEN
        -- 1. Delete dependent records from public tables
        -- Add any other tables that reference auth.users here
        DELETE FROM public.wheel_spins WHERE user_id = target_user_id;
        DELETE FROM public.activity_log WHERE user_id = target_user_id;
        DELETE FROM public.app_usage WHERE user_id = target_user_id;
        
        -- Delete from app_users (which caused the error)
        DELETE FROM public.app_users WHERE auth_id = target_user_id;
        
        -- 2. Finally delete the user from auth.users
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RAISE NOTICE 'User debug_agent_001@gmail.com and related data deleted successfully.';
    ELSE
        RAISE NOTICE 'User not found, nothing to delete.';
    END IF;
END $$;
