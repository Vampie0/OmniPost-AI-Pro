-- ==============================================================================
-- 20240001000004_notifications_teams_push.sql
-- Production notification backbone + real team membership + device push.
-- Idempotent: safe to run on any state of the database. Run via Supabase
-- dashboard → SQL Editor (or supabase db push for fresh setups).
--
-- Adds:
--   A. profiles.suspension_reason          — admin must state why a user is blocked
--   B. team_members + owner trigger        — REAL membership (multi-team capable)
--   C. push_tokens                         — Expo device push tokens per user
--   D. SECURITY DEFINER RPCs               — invite/accept/remove/leave/list with
--                                            automatic in-app notifications
--   E. notifications RLS extension         — definer functions write inboxes
--   F. pg_net trigger                      — every notification row fans out to
--                                            the send-push edge function
-- ==============================================================================

-- ── A. SUSPENSION REASON ──────────────────────────────────────────────────────
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- ── B. TEAM MEMBERS (real membership) ─────────────────────────────────────────
-- team_id is the OWNER's profile id: every account implicitly owns a workspace,
-- and one user can hold memberships in many teams (multi-team by design).
CREATE TABLE IF NOT EXISTS public.team_members (
    team_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role      TEXT NOT NULL DEFAULT 'editor'
              CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Members may see their own rows; the workspace owner sees all rows of their
-- team; admins have full control. Listing other people's profiles goes through
-- get_team_members() (definer) instead, so profile RLS stays tight.
DROP POLICY IF EXISTS "team_members_select_self_owner_admin" ON public.team_members;
CREATE POLICY "team_members_select_self_owner_admin" ON public.team_members
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR team_id = auth.uid() OR public.is_admin());

-- Writes (join/role) happen ONLY through the SECURITY DEFINER RPCs below.
DROP POLICY IF EXISTS "team_members_delete_self_owner_admin" ON public.team_members;
CREATE POLICY "team_members_delete_self_owner_admin" ON public.team_members
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR team_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "team_members_update_owner_admin" ON public.team_members;
CREATE POLICY "team_members_update_owner_admin" ON public.team_members
    FOR UPDATE TO authenticated
    USING (team_id = auth.uid() OR public.is_admin())
    WITH CHECK (team_id = auth.uid() OR public.is_admin());

-- Every new profile implicitly owns its own workspace.
CREATE OR REPLACE FUNCTION public.ensure_owner_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.id, 'owner')
  ON CONFLICT (team_id, user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_ensure_owner_membership ON public.profiles;
CREATE TRIGGER profiles_ensure_owner_membership
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_owner_membership();

-- Backfill existing accounts.
INSERT INTO public.team_members (team_id, user_id, role)
SELECT id, id, 'owner' FROM public.profiles
ON CONFLICT (team_id, user_id) DO NOTHING;

-- ── C. PUSH TOKENS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token      TEXT NOT NULL UNIQUE,
    platform   TEXT NOT NULL DEFAULT 'android',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_user_own" ON public.push_tokens;
CREATE POLICY "push_tokens_user_own" ON public.push_tokens
    FOR ALL TO authenticated USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── E. NOTIFICATIONS WRITE ACCESS for definer RPCs ────────────────────────────
-- (SECURITY DEFINER functions run as postgres and bypass RLS, but we still let
--  the owning user read/manage their inbox — existing notifications_user_own
--  policy already covers that. Nothing to change; documented here.)

-- ── D. TEAM RPCs (atomic + auto-notification) ─────────────────────────────────

-- Invite flow gate: returns the profile id for an email, or NULL.
-- SECURITY DEFINER so the inviter can check registration without broad
-- profile read access. Only callable by authenticated users.
CREATE OR REPLACE FUNCTION public.find_profile_by_email(target_email TEXT)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE email = target_email
$$;
REVOKE ALL ON FUNCTION public.find_profile_by_email(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_profile_by_email(TEXT) TO authenticated;

-- Send a team invite: validates registration, membership and duplicates, then
-- writes team_invites + a notification for the invitee — atomically.
CREATE OR REPLACE FUNCTION public.send_team_invite(
    invitee_email TEXT,
    invitee_name  TEXT DEFAULT '',
    inv_role      TEXT DEFAULT 'editor'
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_inviter  UUID := auth.uid();
    v_email    TEXT := lower(btrim(send_team_invite.invitee_email));
    v_name     TEXT := nullif(btrim(coalesce(send_team_invite.invitee_name, '')), '');
    v_role     TEXT := send_team_invite.inv_role;
    v_invitee  UUID;
    v_invite   UUID;
BEGIN
    IF v_inviter IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;
    IF v_email = '' THEN
        RAISE EXCEPTION 'invalid_email';
    END IF;
    IF v_role NOT IN ('editor', 'viewer') THEN
        RAISE EXCEPTION 'invalid_role';
    END IF;

    SELECT id INTO v_invitee FROM public.profiles WHERE email = v_email;
    IF v_invitee IS NULL THEN
        RETURN 'not_registered';
    END IF;
    IF v_invitee = v_inviter THEN
        RETURN 'self_invite';
    END IF;
    IF EXISTS (SELECT 1 FROM public.team_members
               WHERE team_id = v_inviter AND user_id = v_invitee) THEN
        RETURN 'already_member';
    END IF;
    IF EXISTS (SELECT 1 FROM public.team_invites
               WHERE inviter_id = v_inviter
                 AND invitee_email = v_email
                 AND status = 'pending') THEN
        RETURN 'already_invited';
    END IF;

    INSERT INTO public.team_invites (inviter_id, invitee_email, invitee_name, role, status)
    VALUES (v_inviter, v_email, v_name, v_role::invite_role, 'pending')
    RETURNING id INTO v_invite;

    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
        v_invitee,
        'Team Invitation',
        'You have been invited to join a team workspace. Open Team to review.',
        'info',
        jsonb_build_object('kind', 'team_invite', 'invite_id', v_invite,
                           'inviter_id', v_inviter)
    );

    RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.send_team_invite(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_team_invite(TEXT, TEXT, TEXT) TO authenticated;

-- Accept: validates the invite belongs to my email, creates real membership,
-- notifies the inviter.
CREATE OR REPLACE FUNCTION public.accept_team_invite(target_invite_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    rec        RECORD;
    my_email   TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;
    SELECT email INTO my_email FROM public.profiles WHERE id = auth.uid();

    SELECT * INTO rec FROM public.team_invites
    WHERE id = target_invite_id AND status = 'pending';

    IF NOT FOUND OR rec.invitee_email <> my_email THEN
        RETURN 'invalid_invite';
    END IF;

    UPDATE public.team_invites
    SET status = 'accepted', updated_at = NOW()
    WHERE id = target_invite_id;

    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (rec.inviter_id, auth.uid(), rec.role::TEXT)
    ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role;

    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
        rec.inviter_id,
        'Invite Accepted',
        'A teammate accepted your invitation and joined your workspace.',
        'success',
        jsonb_build_object('kind', 'team_invite_accepted', 'member_id', auth.uid())
    );

    RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.accept_team_invite(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(UUID) TO authenticated;

-- Decline: marks invite declined, notifies inviter.
CREATE OR REPLACE FUNCTION public.decline_team_invite(target_invite_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    rec       RECORD;
    my_email  TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;
    SELECT email INTO my_email FROM public.profiles WHERE id = auth.uid();

    SELECT * INTO rec FROM public.team_invites
    WHERE id = target_invite_id AND status = 'pending';

    IF NOT FOUND OR rec.invitee_email <> my_email THEN
        RETURN 'invalid_invite';
    END IF;

    UPDATE public.team_invites
    SET status = 'declined', updated_at = NOW()
    WHERE id = target_invite_id;

    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
        rec.inviter_id,
        'Invite Declined',
        'A teammate declined your invitation.',
        'info',
        jsonb_build_object('kind', 'team_invite_declined')
    );

    RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.decline_team_invite(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_team_invite(UUID) TO authenticated;

-- Owner/admin removes a member (never the owner row), with notification.
CREATE OR REPLACE FUNCTION public.remove_team_member(p_team UUID, p_user UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;
    IF p_team <> auth.uid() AND NOT public.is_admin() THEN
        RETURN 'forbidden';
    END IF;
    IF p_user = p_team THEN
        RETURN 'cannot_remove_owner';
    END IF;

    DELETE FROM public.team_members WHERE team_id = p_team AND user_id = p_user;
    IF NOT FOUND THEN
        RETURN 'not_found';
    END IF;

    -- Retire any pending invite so the email can be re-invited later.
    DELETE FROM public.team_invites
    WHERE inviter_id = p_team
      AND invitee_email = (SELECT email FROM public.profiles WHERE id = p_user)
      AND status = 'pending';

    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
        p_user,
        'Removed from Team',
        'Your access to a team workspace has been revoked by the owner.',
        'warning',
        jsonb_build_object('kind', 'team_removed', 'team_id', p_team)
    );

    RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.remove_team_member(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_team_member(UUID, UUID) TO authenticated;

-- Member leaves voluntarily; owner gets notified.
CREATE OR REPLACE FUNCTION public.leave_team(p_team UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;
    IF p_team = auth.uid() THEN
        RETURN 'cannot_leave_own_team';
    END IF;

    DELETE FROM public.team_members WHERE team_id = p_team AND user_id = auth.uid();
    IF NOT FOUND THEN
        RETURN 'not_member';
    END IF;

    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
        p_team,
        'Member Left Team',
        'A teammate left your workspace.',
        'info',
        jsonb_build_object('kind', 'team_left', 'member_id', auth.uid())
    );

    RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.leave_team(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_team(UUID) TO authenticated;

-- List members of a team (owner or an actual member only).
CREATE OR REPLACE FUNCTION public.get_team_members(p_team UUID)
RETURNS TABLE (
    user_id    UUID,
    full_name  TEXT,
    email      TEXT,
    avatar_url TEXT,
    role       TEXT,
    joined_at  TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT tm.user_id, p.full_name::TEXT, p.email, p.avatar_url, tm.role, tm.joined_at
  FROM public.team_members tm
  JOIN public.profiles p ON p.id = tm.user_id
  WHERE tm.team_id = p_team
    AND (tm.user_id = auth.uid() OR tm.team_id = auth.uid() OR public.is_admin())
  ORDER BY (tm.role = 'owner') DESC, tm.joined_at ASC
$$;
REVOKE ALL ON FUNCTION public.get_team_members(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_members(UUID) TO authenticated;

-- All workspaces the caller belongs to (own + joined) — powers multi-team UI.
CREATE OR REPLACE FUNCTION public.get_my_teams()
RETURNS TABLE (
    team_id      UUID,
    owner_name   TEXT,
    owner_email  TEXT,
    my_role      TEXT,
    member_count BIGINT,
    joined_at    TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT tm.team_id,
         op.full_name::TEXT,
         op.email,
         tm.role,
         (SELECT count(*) FROM public.team_members m2 WHERE m2.team_id = tm.team_id),
         tm.joined_at
  FROM public.team_members tm
  JOIN public.profiles op ON op.id = tm.team_id
  WHERE tm.user_id = auth.uid()
  ORDER BY tm.joined_at ASC
$$;
REVOKE ALL ON FUNCTION public.get_my_teams() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_teams() TO authenticated;

-- Pending invites received by me, with inviter identity (definer join).
CREATE OR REPLACE FUNCTION public.get_received_invites()
RETURNS TABLE (
    invite_id    UUID,
    inviter_id   UUID,
    inviter_name TEXT,
    role         TEXT,
    created_at   TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT ti.id, ti.inviter_id, ip.full_name::TEXT, ti.role::TEXT, ti.created_at
  FROM public.team_invites ti
  JOIN public.profiles ip ON ip.id = ti.inviter_id
  WHERE ti.status = 'pending'
    AND ti.invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ORDER BY ti.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.get_received_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_received_invites() TO authenticated;

-- Sent invites with current status (own rows only — plain RLS already allows
-- this via team_invites policies; kept for symmetry with received invites).

-- ── F. PUSH DISPATCH TRIGGER (pg_net → send-push edge function) ──────────────
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net unavailable, push fan-out trigger skipped: %', SQLERRM;
END $$;

-- NOTE: outer DO block uses a tagged $do$ quote because the function body
-- inside it uses plain $$ — nested identical $$ tags would close early.
DO $do$ BEGIN
IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN

  CREATE OR REPLACE FUNCTION public.dispatch_push()
  RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    PERFORM net.http_post(
      url     := 'https://ifalbnkgclloyahjgssd.supabase.co/functions/v1/send-push',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := jsonb_build_object('notification_id', NEW.id)
    );
    RETURN NEW;
  END $$;

  DROP TRIGGER IF EXISTS notifications_dispatch_push ON public.notifications;
  CREATE TRIGGER notifications_dispatch_push
    AFTER INSERT ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.dispatch_push();

  RAISE NOTICE 'push fan-out trigger installed';
ELSE
  RAISE NOTICE 'pg_net missing — install it from Database → Extensions, then re-run section F';
END IF;
END $do$;

-- ── REALTIME: team_members for live member lists ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'team_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
  END IF;
END $$;
