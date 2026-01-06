-- Add unique_id column to profiles table for ID-based authentication
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unique_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_unique_id ON public.profiles(unique_id);