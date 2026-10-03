-- =============================================================================
-- FIX: Auth Signup Trigger & Admin User Creation
-- Run this in Supabase SQL Editor to fix "Database error creating new user"
-- =============================================================================

-- 1. Drop the old broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Recreate the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile (skip if already exists)
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', 'unknown@placeholder.com'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url);

  -- Auto-create a free subscription for new users
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If profile insert fails, log and continue (auth user still gets created)
  RAISE WARNING 'handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill: Create profiles for any existing auth.users that don't have one
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT
  u.id,
  COALESCE(u.email, 'unknown@placeholder.com'),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, ''), '@', 1)),
  COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Create free subscriptions for backfilled users
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT p.id, 'free', 'active'
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE s.id IS NULL
ON CONFLICT DO NOTHING;

-- 5. Also backfill: if subscriptions table doesn't have INSERT policy for authenticated,
--    make sure the trigger can insert (it runs as SECURITY DEFINER so it should be fine)
--    But let's also add an explicit policy just in case:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
    AND policyname = 'subscriptions_insert_own'
  ) THEN
    CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Insert initial app_config row if it doesn't exist
INSERT INTO public.app_config (app_name, support_email)
VALUES ('SocialPilot AI', 'support@socialpilot.ai')
ON CONFLICT DO NOTHING;

-- 7. Insert initial ai_config row if it doesn't exist
INSERT INTO public.ai_config (text_provider, text_model)
VALUES ('gemini', 'gemini-2.0-flash')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- NOW: Create your admin user
-- =============================================================================
-- Option A: If you already created a user in Supabase Auth UI, just run:
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'admin@admin.com';

-- Option B: If the profile was never created (trigger was broken), create it manually:
-- First, create the auth user in Supabase Auth UI with email/password, then run:

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find the auth user
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@admin.com'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found with email admin@admin.com. Please create one in Supabase Auth UI first.';
    RETURN;
  END IF;

  -- Create or update profile
  INSERT INTO public.profiles (id, email, full_name, role, subscription_tier, credits_remaining, credits_limit)
  VALUES (admin_user_id, 'admin@admin.com', 'Super Admin', 'super_admin', 'agency', 99999, 99999)
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    subscription_tier = 'agency',
    credits_remaining = 99999,
    credits_limit = 99999;

  -- Create subscription
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (admin_user_id, 'agency', 'active')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Admin user configured successfully! Email: admin@admin.com, Role: super_admin';
END $$;
