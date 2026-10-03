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
