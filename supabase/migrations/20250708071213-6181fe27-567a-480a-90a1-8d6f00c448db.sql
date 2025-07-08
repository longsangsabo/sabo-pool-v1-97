-- Add is_demo_user column to profiles table if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT false;

-- Add email_verified column if not exists  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;