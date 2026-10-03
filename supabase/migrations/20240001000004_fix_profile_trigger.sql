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
