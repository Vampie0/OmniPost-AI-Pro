-- ==============================================================================
-- SocialPilot AI Pro — Complete Database Schema, Security & Realtime Definition
-- Master Migration v3.5 — Zero-Config Ready
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'agency');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');
CREATE TYPE platform_type AS ENUM ('instagram', 'twitter', 'linkedin', 'facebook', 'tiktok', 'threads');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'promo', 'system');

-- ==============================================================================
-- 2. APP CONFIG (Single-Row White-Label Settings)
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

-- ==============================================================================
-- 3. AI CONFIG (Single-Row Centralized AI Settings)
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

  -- Record in analytics
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
-- 13. ADMIN AUDIT LOGS
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
-- ROW LEVEL SECURITY (RLS) — BULLETPROFT POLICIES
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
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- App Config: Public read for all authenticated, write restricted to admins
CREATE POLICY "app_config_select_authenticated" ON public.app_config
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_config_update_admin" ON public.app_config
    FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "app_config_insert_admin" ON public.app_config
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- AI Config: Authenticated can read model names, admins full write
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

-- Posts: Strictly isolated per user_id. Admins have moderation read-only / soft-delete rights
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

-- Admin Audit Logs: Insertable and readable only by admins
CREATE POLICY "admin_audit_logs_admin_only" ON public.admin_audit_logs
    FOR ALL TO authenticated USING (public.is_admin());

-- ==============================================================================
-- AUTOMATIC PROFILE TRIGGER ON AUTH SIGNUP
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
  );

  -- Auto-create a free subscription for new users
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- REALTIME PUBLICATION
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
