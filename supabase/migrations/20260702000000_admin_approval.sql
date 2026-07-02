-- Migration: Add Admin Approval to Users Table
-- Adds is_admin and is_approved columns to control access to the bot.

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.users.is_admin IS 'If true, this user is the owner and can approve others.';
COMMENT ON COLUMN public.users.is_approved IS 'If true, this user is allowed to use the bot. Admins are automatically approved.';

-- If upgrading an existing database, automatically make the oldest user (the creator) the admin
UPDATE public.users 
SET is_admin = true, is_approved = true 
WHERE telegram_id = (
  SELECT telegram_id FROM public.users ORDER BY created_at ASC LIMIT 1
) 
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE is_admin = true
);
