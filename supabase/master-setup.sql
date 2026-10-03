-- ==============================================================================
-- SocialPilot AI Pro — MASTER SUPABASE SETUP SCRIPT
-- ==============================================================================
-- HOW TO USE:
--   1. Open your Supabase Dashboard -> SQL Editor (left sidebar)
--   2. Click "New Query"
--   3. Copy-paste this ENTIRE script
--   4. Click "Run" (or press Ctrl+Enter)
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- It REPLACES setup-minimal.sql, setup.sql, and new-user-error.sql.
-- It creates ALL tables, RLS policies, triggers, team invites,
-- and backfills profiles for any existing auth.users.
--
-- SECURITY: All tables have RLS enabled. All policies enforce
-- proper data isolation per user with admin override.
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
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
    CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_role') THEN
    CREATE TYPE invite_role AS ENUM ('editor', 'viewer');
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

INSERT INTO public.ai_config (text_provider, text_model)
SELECT 'gemini', 'gemini-2.0-flash'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_config LIMIT 1);

-- ==============================================================================
-- 4. USER PROFILES
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
-- 6. TEAM INVITES (new — supports invite workflow)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.team_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_name TEXT DEFAULT '',
    role invite_role NOT NULL DEFAULT 'editor',
    status invite_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pending invites are unique PER INVITER (global email+status uniqueness broke
-- multi-workspace invites and repeat accepts; see migration 20240001000003)
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_invite_per_inviter
    ON public.team_invites (inviter_id, invitee_email)
    WHERE status = 'pending';

-- ==============================================================================
-- 7. HELPER FUNCTIONS
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

-- Decrement user credits atomically
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

  -- Record in analytics (kept byte-identical with migrations/20240001000003)
  INSERT INTO public.analytics (user_id, total_ai_generations, credits_used)
  VALUES (user_id_param, 1, amount)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_ai_generations = public.analytics.total_ai_generations + 1,
    credits_used = public.analytics.credits_used + amount;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. FOLDERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4F46E5',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. POSTS
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
-- 10. TEMPLATES
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
-- 11. GENERATED IMAGES
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
-- 12. ANALYTICS METRICS
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
-- 13. NOTIFICATIONS
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
-- 14. AI LOGS
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
-- 15. ADMIN AUDIT LOGS
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
-- 16. ROW LEVEL SECURITY (RLS) — Enable on ALL tables
-- ==============================================================================

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
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
    'app_config', 'ai_config', 'profiles', 'subscriptions', 'team_invites',
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

-- ── App Config: Public read, admin write ──
CREATE POLICY "app_config_select_authenticated" ON public.app_config
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_config_update_admin" ON public.app_config
    FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "app_config_insert_admin" ON public.app_config
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ── AI Config: Authenticated read, admin full write ──
CREATE POLICY "ai_config_select_authenticated" ON public.ai_config
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_config_all_admin" ON public.ai_config
    FOR ALL TO authenticated USING (public.is_admin());

-- ── Profiles: Users read/update own. Admins can read/update all ──
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_full" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- ── Subscriptions: Users read own, admin full access ──
CREATE POLICY "subscriptions_select_own_or_admin" ON public.subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "subscriptions_admin_write" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── Team Invites: Admins/inviter can see, invitee can see own, admin full write ──
CREATE POLICY "team_invites_select_inviter_or_invitee" ON public.team_invites
    FOR SELECT TO authenticated
    USING (
      inviter_id = auth.uid()
      OR invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      OR public.is_admin()
    );
CREATE POLICY "team_invites_insert_any_authenticated" ON public.team_invites
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "team_invites_update_invitee_or_admin" ON public.team_invites
    FOR UPDATE TO authenticated
    USING (
      invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      OR public.is_admin()
    )
    WITH CHECK (
      invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      OR public.is_admin()
    );
CREATE POLICY "team_invites_delete_admin" ON public.team_invites
    FOR DELETE TO authenticated USING (public.is_admin());

-- ── Posts: User owns their posts, admin moderation ──
CREATE POLICY "posts_user_own" ON public.posts
    FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "posts_admin_moderate" ON public.posts
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "posts_admin_delete" ON public.posts
    FOR DELETE TO authenticated USING (public.is_admin());

-- ── Folders: Users manage own only ──
CREATE POLICY "folders_user_own" ON public.folders
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── Templates: Public read active, admin write ──
CREATE POLICY "templates_select_active" ON public.templates
    FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());
CREATE POLICY "templates_admin_write" ON public.templates
    FOR ALL TO authenticated USING (public.is_admin());

-- ── Generated Images: Users manage own ──
CREATE POLICY "generated_images_user_own" ON public.generated_images
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── Notifications: Users manage own, admin broadcast insert ──
CREATE POLICY "notifications_user_own" ON public.notifications
    FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_admin_insert" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ── Analytics: Users read/insert own, admin read all ──
CREATE POLICY "analytics_select_own_or_admin" ON public.analytics
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "analytics_insert_own" ON public.analytics
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "analytics_update_own" ON public.analytics
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ── AI Logs: Users read own only ──
CREATE POLICY "ai_logs_select_own" ON public.ai_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- generate-content writes the audit row under the caller's JWT, so own-insert
-- is required or History is permanently empty on a fresh project.
-- Mirrors migrations/20240001000003_backend_sync.sql
CREATE POLICY "ai_logs_insert_own" ON public.ai_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── Admin Audit Logs: Admin only ──
CREATE POLICY "admin_audit_logs_admin_only" ON public.admin_audit_logs
    FOR ALL TO authenticated USING (public.is_admin());

-- ==============================================================================
-- 17. AUTOMATIC PROFILE TRIGGER ON AUTH SIGNUP (hardened — kept identical
--     with migrations/20240001000004_fix_profile_trigger.sql: profile errors
--     propagate loudly; the subscription default runs in its own savepoint so
--     it can never silently roll back the profile row)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := COALESCE(NEW.email, NEW.id::text || '@noemail.local');
  v_name  TEXT := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Creator'
  );
  v_role  user_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('user', 'admin', 'super_admin')
      THEN (NEW.raw_user_meta_data->>'role')::user_role
    ELSE 'user'::user_role
  END;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    v_email,
    v_name,
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = NEW.id) THEN
      INSERT INTO public.subscriptions (user_id, tier, status)
      VALUES (NEW.id, 'free', 'active');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: subscription default skipped for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 18. AUTO-UPDATE updated_at TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.app_config;
DROP TRIGGER IF EXISTS set_updated_at ON public.ai_config;
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS set_updated_at ON public.posts;
DROP TRIGGER IF EXISTS set_updated_at ON public.team_invites;

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
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.team_invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 19. BACKFILL: Create profiles for existing auth.users without one
-- ==============================================================================

INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT
  u.id,
  COALESCE(u.email, 'unknown@placeholder.com'),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, ''), '@', 1)),
  COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.id IS NOT NULL;

-- Backfill free subscriptions
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT p.id, 'free', 'active'
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE s.id IS NULL;

-- ==============================================================================
-- 20. PROMOTE TO SUPER ADMIN
-- ==============================================================================
-- To promote your account to super_admin, uncomment and run:
--
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'YOUR_EMAIL_HERE';
--

-- ==============================================================================
-- 21. REALTIME PUBLICATION
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'templates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ai_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_logs;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'team_invites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_invites;
  END IF;
END $$;

-- ==============================================================================
-- 22. STORAGE: PUBLIC "avatars" BUCKET (mobile Settings profile picture)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ==============================================================================
-- DONE! Verify with:
--   SELECT count(*) FROM public.profiles;
--   SELECT id, email, role, subscription_tier, credits_remaining FROM public.profiles;
--   SELECT * FROM pg_policies WHERE schemaname = 'public';
-- ==============================================================================
