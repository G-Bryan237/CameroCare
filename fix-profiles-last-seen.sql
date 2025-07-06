-- Fix profiles table to add last_seen column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing profiles to have a last_seen timestamp
UPDATE public.profiles 
SET last_seen = NOW() 
WHERE last_seen IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);
