-- RUN THIS ONE FILE IN SUPABASE SQL EDITOR -> Run
-- Fixes: 1) signup trigger + ghost users backfill  2) avatars storage bucket  3) invite index

-- ============================================================================
-- 20240001000004_fix_profile_trigger.sql
-- Fixes: new signups (e.g. registered from the customer app) had an auth.users
-- row but NO public.profiles row, because the old handle_new_user() swallowed
-- every error via WHEN OTHERS — and since a plpgsql EXCEPTION block rolls back
-- to its own savepoint, a failing subscriptions insert also undid the profile
-- insert, silently. This migration:
--   1. Installs a hardened trigger (profile errors propagate loudly; the
--      optional free-subscription row can never roll back the profile).
--   2. Ensures the trigger exists on auth.users (it can be lost during
--      Supabase platform/auth updates).
--   3. Backfills every missing profile + free subscription.
-- Idempotent: safe to run multiple times.
-- ============================================================================

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
  -- Profile row: errors here intentionally propagate (signup fails loudly
  -- instead of silently creating a user without a profile).
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

  -- Free subscription default: best-effort, its own savepoint so it can
  -- never undo the profile insert above.
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

-- (Re)attach the trigger — auth.users triggers can be dropped by platform updates.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Backfill: every auth user without a profile row
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT
  u.id,
  COALESCE(u.email, u.id::text || '@noemail.local'),
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    split_part(COALESCE(u.email, ''), '@', 1),
    'Creator'
  ),
  NULLIF(u.raw_user_meta_data->>'avatar_url', ''),
  CASE
    WHEN u.raw_user_meta_data->>'role' IN ('user', 'admin', 'super_admin')
      THEN (u.raw_user_meta_data->>'role')::user_role
    ELSE 'user'::user_role
  END
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Backfill: free subscription for every profile that has none
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT p.id, 'free', 'active'
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id);

-- Verification (returns 0 when healthy):
-- SELECT COUNT(*) AS orphan_auth_users
-- FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
-- WHERE p.id IS NULL;


-- ==============================================================================
-- Storage: public "avatars" bucket used by the mobile Settings screen
-- (apps/mobile/src/app/settings.tsx uploads to avatars/<user_id>/avatar.<ext>)
-- Idempotent: safe to run repeatedly.
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (avatars are referenced by public URLs in profiles.avatar_url)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');

-- Users upload only into their own <auth.uid()> folder
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users replace (upsert) their own avatar
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users delete their own avatar
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ==============================================================================
-- 20240001000003_backend_sync.sql
-- Idempotent convergence migration. Fixes audit findings:
--  - ai_logs had no producer/policy (History screen reads it, edge fn now writes it)
--  - decrement_user_credits diverged between master-setup.sql and initial schema
--  - team_invites existed only in master-setup.sql with a global unique constraint
-- Safe to run on any state of the database (fresh or already-seeded).
-- ==============================================================================

-- 1. Enums required by team_invites (mirrors master-setup.sql guards)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
    CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_role') THEN
    CREATE TYPE invite_role AS ENUM ('editor', 'viewer');
  END IF;
END $$;

-- 2. AI LOGS: ensure table exists (producer was added to generate-content fn)
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL DEFAULT '',
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_logs_select_own" ON public.ai_logs;
CREATE POLICY "ai_logs_select_own" ON public.ai_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- The edge function writes under the caller's JWT, so own-insert is required
DROP POLICY IF EXISTS "ai_logs_insert_own" ON public.ai_logs;
CREATE POLICY "ai_logs_insert_own" ON public.ai_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. SYNC decrement_user_credits: single canonical body WITH analytics upsert
--    (previously master-setup.sql shipped a copy WITHOUT the analytics write)
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

  -- Record in analytics (requires unique (user_id, date) constraint)
  INSERT INTO public.analytics (user_id, total_ai_generations, credits_used)
  VALUES (user_id_param, 1, amount)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_ai_generations = public.analytics.total_ai_generations + 1,
    credits_used = public.analytics.credits_used + amount;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TEAM INVITES: ship as a migration too (was master-setup-only)
CREATE TABLE IF NOT EXISTS public.team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_name TEXT DEFAULT '',
    role invite_role NOT NULL DEFAULT 'editor',
    status invite_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Replace the global UNIQUE (invitee_email, status): it blocked two different
-- inviters from inviting the same person and broke repeat accepts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_pending_invite'
      AND conrelid = 'public.team_invites'::regclass
  ) THEN
    ALTER TABLE public.team_invites DROP CONSTRAINT unique_pending_invite;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_invite_per_inviter
    ON public.team_invites (inviter_id, invitee_email)
    WHERE status = 'pending';

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_invites_select_inviter_or_invitee" ON public.team_invites;
CREATE POLICY "team_invites_select_inviter_or_invitee" ON public.team_invites
    FOR SELECT TO authenticated
    USING (
      auth.uid() = inviter_id
      OR invitee_email = (auth.jwt() ->> 'email')
      OR public.is_admin()
    );

DROP POLICY IF EXISTS "team_invites_insert_any_authenticated" ON public.team_invites;
CREATE POLICY "team_invites_insert_any_authenticated" ON public.team_invites
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "team_invites_update_invitee_or_admin" ON public.team_invites;
CREATE POLICY "team_invites_update_invitee_or_admin" ON public.team_invites
    FOR UPDATE TO authenticated
    USING (
      invitee_email = (auth.jwt() ->> 'email')
      OR auth.uid() = inviter_id
      OR public.is_admin()
    );

DROP POLICY IF EXISTS "team_invites_delete_admin" ON public.team_invites;
CREATE POLICY "team_invites_delete_admin" ON public.team_invites
    FOR DELETE TO authenticated USING (public.is_admin());
