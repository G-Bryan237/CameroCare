-- Fix for missing columns in profiles table
-- This script adds the missing columns that the app expects

-- First, let's see what columns exist
-- Run this in your Supabase SQL editor to check current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- Add missing columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100), 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Update existing profiles to extract names from user_metadata
-- This is a one-time migration script
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE auth.users.id = profiles.id),
    CASE 
      WHEN (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE auth.users.id = profiles.id) IS NOT NULL
           AND (SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE auth.users.id = profiles.id) IS NOT NULL
      THEN CONCAT(
        (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE auth.users.id = profiles.id),
        ' ',
        (SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE auth.users.id = profiles.id)
      )
      ELSE NULL
    END
  ),
  first_name = (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE auth.users.id = profiles.id),
  last_name = (SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE auth.users.id = profiles.id)
WHERE full_name IS NULL OR first_name IS NULL OR last_name IS NULL;

-- Update the trigger function to handle new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, full_name, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      CASE 
        WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL 
             AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL
        THEN CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')
        ELSE NEW.email
      END
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'first_name', 
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
