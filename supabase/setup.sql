-- ==============================================================================
-- SocialPilot AI Pro — SUPABASE SETUP SCRIPT
-- ==============================================================================
-- HOW TO USE:
--   1. Open your Supabase Dashboard → SQL Editor (left sidebar)
--   2. Click "New Query"
--   3. Copy-paste this ENTIRE script
--   4. Click "Run" (or press Ctrl+Enter)
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- It creates all tables, RLS policies, triggers, and backfills
-- profiles for any existing auth.users.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMS (safe — skips if already exist)
-- ==============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'agency');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
    CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    CREATE TYPE platform_type AS ENUM ('instagram', 'twitter', 'linkedin', 'facebook', 'tiktok', 'threads');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'promo', 'system');
  END IF;
END $$;

-- ==============================================================================
-- 2. APP CONFIG (White-Label Settings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_name TEXT NOT NULL DEFAULT 'SocialPilot AI',
    logo_url TEXT DEFAULT '',
    primary_color TEXT NOT NULL DEFAULT '#4F46E5',
    secondary_color TEXT NOT NULL DEFAULT '#14B8A6',
    accent_color TEXT NOT NULL DEFAULT '#F43F5E',
    support_email TEXT NOT NULL DEFAULT 'support@example.com',
    feature_flags JSONB NOT NULL DEFAULT '{"revenuecat": true, "social_login": true, "ai_image": true, "ai_text": true}'::jsonb,
    legal_links JSONB NOT NULL DEFAULT '{"terms": "https://example.com/terms", "privacy": "https://example.com/privacy"}'::jsonb,
    is_maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default app_config if empty
INSERT INTO public.app_config (app_name)
SELECT 'SocialPilot AI'
WHERE NOT EXISTS (SELECT 1 FROM public.app_config LIMIT 1);

-- ==============================================================================
-- 3. AI CONFIG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_provider TEXT NOT NULL DEFAULT 'gemini',
    text_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    image_provider TEXT NOT NULL DEFAULT 'replicate',
    image_model TEXT NOT NULL DEFAULT 'stability-ai/sdxl',
    max_tokens INTEGER NOT NULL DEFAULT 2048,
    temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.7,
    system_prompt TEXT NOT NULL DEFAULT 'You are SocialPilot AI, an elite social media manager and copywriter.',
    rate_limit_per_min INTEGER NOT NULL DEFAULT 20,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default ai_config if empty
INSERT INTO public.ai_config (text_provider, text_model)
SELECT 'gemini', 'gemini-2.0-flash'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_config LIMIT 1);

-- ==============================================================================
-- 4. USER PROFILES (the table you need to see & manage users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    credits_remaining INTEGER NOT NULL DEFAULT 50,
    credits_limit INTEGER NOT NULL DEFAULT 50,
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. SUBSCRIPTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. HELPER FUNCTIONS
-- ==============================================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement user credits atomically (called by Edge Functions)
CREATE OR REPLACE FUNCTION public.decrement_user_credits(user_id_param UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits_remaining = credits_remaining - amount,
      updated_at = NOW()
  WHERE id = user_id_param
    AND is_suspended = false
    AND credits_remaining >= amount
  RETURNING credits_remaining INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits or user suspended';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 7. FOLDERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4F46E5',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. POSTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    platforms platform_type[] NOT NULL DEFAULT '{instagram}',
    status post_status NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    analytics JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. TEMPLATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    default_hashtags TEXT[] DEFAULT '{}',
    suggested_platform platform_type NOT NULL DEFAULT 'instagram',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. GENERATED IMAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL DEFAULT '1:1',
    style TEXT NOT NULL DEFAULT 'digital-art',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. ANALYTICS METRICS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_posts_created INTEGER NOT NULL DEFAULT 0,
    total_posts_scheduled INTEGER NOT NULL DEFAULT 0,
    total_ai_generations INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- ==============================================================================
-- 12. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    type notification_type NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 13. AI LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL DEFAULT '',
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 14. ADMIN AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL DEFAULT '',
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 15. ROW LEVEL SECURITY (RLS) — Enable on ALL tables
-- ==============================================================================

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe for re-runs)
DO $$
DECLARE
  pol RECORD;
  tbl TEXT[] := ARRAY[
    'app_config', 'ai_config', 'profiles', 'subscriptions',
    'folders', 'posts', 'templates', 'generated_images',
    'analytics', 'notifications', 'ai_logs', 'admin_audit_logs'
  ];
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY(tbl)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename::TEXT);
  END LOOP;
END $$;

-- App Config: Public read for all authenticated, write restricted to admins
CREATE POLICY "app_config_select_authenticated" ON public.app_config
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_config_update_admin" ON public.app_config
    FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "app_config_insert_admin" ON public.app_config
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- AI Config: Authenticated can read, admins full write
CREATE POLICY "ai_config_select_authenticated" ON public.ai_config
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_config_all_admin" ON public.ai_config
    FOR ALL TO authenticated USING (public.is_admin());

-- Profiles: Users read/update own only. Admins can read all and update roles/credits/suspension
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_full" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- Subscriptions: Users read own, admins read all
CREATE POLICY "subscriptions_select_own_or_admin" ON public.subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "subscriptions_admin_write" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_admin());

-- Posts: Strictly isolated per user_id. Admins have moderation/delete rights
CREATE POLICY "posts_user_own" ON public.posts
    FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "posts_admin_moderate" ON public.posts
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "posts_admin_delete" ON public.posts
    FOR DELETE TO authenticated USING (public.is_admin());

-- Folders: Users manage own only
CREATE POLICY "folders_user_own" ON public.folders
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Templates: Public read for active rows, write restricted to admins
CREATE POLICY "templates_select_active" ON public.templates
    FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());
CREATE POLICY "templates_admin_write" ON public.templates
    FOR ALL TO authenticated USING (public.is_admin());

-- Generated Images: Users manage own
CREATE POLICY "generated_images_user_own" ON public.generated_images
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Notifications: Users manage own, admins can insert for broadcast
CREATE POLICY "notifications_user_own" ON public.notifications
    FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_admin_insert" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Analytics: Users read own, admins read all
CREATE POLICY "analytics_select_own_or_admin" ON public.analytics
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "analytics_insert_own" ON public.analytics
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "analytics_update_own" ON public.analytics
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- AI Logs: Users read own only
CREATE POLICY "ai_logs_select_own" ON public.ai_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admin Audit Logs: Insertable and readable only by admins
CREATE POLICY "admin_audit_logs_admin_only" ON public.admin_audit_logs
    FOR ALL TO authenticated USING (public.is_admin());

-- ==============================================================================
-- 16. AUTOMATIC PROFILE TRIGGER ON AUTH SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-create a free subscription for new users
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (safe for re-runs), then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 17. AUTO-UPDATE updated_at TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers (safe for re-runs)
DROP TRIGGER IF EXISTS set_updated_at ON public.app_config;
DROP TRIGGER IF EXISTS set_updated_at ON public.ai_config;
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS set_updated_at ON public.posts;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.app_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 18. BACKFILL: Create profiles for existing auth.users without one
-- ==============================================================================

INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'avatar_url',
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL;

-- Also create free subscriptions for backfilled users
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT p.id, 'free', 'active'
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE s.id IS NULL;

-- ==============================================================================
-- 19. PROMOTE FIRST USER TO SUPER ADMIN (if any users exist)
-- ==============================================================================
-- If you already have an admin account in auth.users, uncomment the next line
-- and replace with your email to promote yourself to super_admin:
--
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'YOUR_EMAIL_HERE';
--

-- ==============================================================================
-- 20. REALTIME PUBLICATION
-- ==============================================================================

-- Safely add tables to Realtime (skip if already added)
DO $$
BEGIN
  -- app_config
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
  END IF;
  -- templates
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'templates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;
  END IF;
  -- profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  -- posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  -- ai_logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ai_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_logs;
  END IF;
END $$;

-- ==============================================================================
-- DONE! Verify with:
--   SELECT count(*) FROM public.profiles;
--   SELECT id, email, role, subscription_tier, credits_remaining FROM public.profiles;
-- ==============================================================================
