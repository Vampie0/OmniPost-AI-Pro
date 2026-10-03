-- ============================================================================
-- SocialPilot AI Pro — Full Database Health Check
-- Paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run.
-- Returns ONE result grid: section | item | status | details
-- Statuses: PASS = healthy, WARN = should look at it, FAIL = broken, INFO = data.
-- Read-only: changes nothing. Sort/filter by status = FAIL first.
-- ============================================================================

-- A) Tables the app expects (+ approx row counts), and unexpected extras
SELECT 'A. Tables'::text AS section, t.tbl::text AS item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public' AND c.relname = t.tbl AND c.relkind = 'r')
       THEN 'PASS'::text ELSE 'FAIL'::text END AS status,
  COALESCE((SELECT round(c.reltuples)::bigint::text FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = t.tbl AND c.relkind = 'r'), 'table missing') || ' rows (approx)'::text AS details
FROM (VALUES ('profiles'),('subscriptions'),('posts'),('templates'),('analytics'),
             ('ai_config'),('ai_logs'),('app_config'),('team_invites'),
             ('notifications'),('folders'),('generated_images'),('admin_audit_logs')) AS t(tbl)

UNION ALL
SELECT 'A. Tables', 'extra: ' || c.relname::text, 'INFO', 'not in the expected list'
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND c.relname NOT IN ('profiles','subscriptions','posts','templates','analytics',
                        'ai_config','ai_logs','app_config','team_invites',
                        'notifications','folders','generated_images','admin_audit_logs')

UNION ALL
-- B) RLS enabled + policy count on every public table
SELECT 'B. RLS', c.relname,
  CASE WHEN NOT c.relrowsecurity THEN 'FAIL'
       WHEN (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname::text) = 0 THEN 'WARN'
       ELSE 'PASS' END,
  'rls=' || c.relrowsecurity::text ||
  ', policies=' || (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname::text)::text
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'

UNION ALL
-- C) Critical functions (existence, SECURITY DEFINER, pinned search_path)
SELECT 'C. Functions', f.fname,
  CASE WHEN NOT EXISTS (SELECT 1 FROM pg_proc pr JOIN pg_namespace n ON n.oid = pr.pronamespace
                        WHERE n.nspname = 'public' AND pr.proname = f.fname) THEN 'FAIL'
       WHEN f.fname = 'handle_new_user' AND NOT (SELECT pr.prosecdef AND pr.proconfig @> ARRAY['search_path=public']
            FROM pg_proc pr JOIN pg_namespace n ON n.oid = pr.pronamespace
            WHERE n.nspname = 'public' AND pr.proname = 'handle_new_user' LIMIT 1) THEN 'WARN'
       ELSE 'PASS' END,
  COALESCE((SELECT 'secdef=' || pr.prosecdef::text || ', config=' || COALESCE(pr.proconfig::text, 'none')
            FROM pg_proc pr JOIN pg_namespace n ON n.oid = pr.pronamespace
            WHERE n.nspname = 'public' AND pr.proname = f.fname LIMIT 1), 'not found')
FROM (VALUES ('handle_new_user'),('decrement_user_credits'),('is_admin')) AS f(fname)

UNION ALL
-- D) Triggers: signup profile-creation trigger + updated_at touchers
SELECT 'D. Triggers', 'on_auth_user_created (auth.users)',
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE tg.tgname = 'on_auth_user_created' AND n.nspname = 'auth'
                      AND c.relname = 'users' AND NOT tg.tgisinternal AND tg.tgenabled = 'O')
       THEN 'PASS' ELSE 'FAIL' END,
  COALESCE((SELECT 'enabled=' || tg.tgenabled::text FROM pg_trigger tg
            JOIN pg_class c ON c.oid = tg.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE tg.tgname = 'on_auth_user_created' AND n.nspname = 'auth' AND NOT tg.tgisinternal LIMIT 1),
           'MISSING — new signups get NO profile row! Run migration 20240001000004.')

UNION ALL
SELECT 'D. Triggers', 'set_updated_at on ' || t.tbl,
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE tg.tgname = 'set_updated_at' AND n.nspname = 'public'
                      AND c.relname = t.tbl AND NOT tg.tgisinternal)
       THEN 'PASS' ELSE 'WARN' END, ''
FROM (VALUES ('profiles'),('posts'),('subscriptions'),('app_config'),('ai_config')) AS t(tbl)

UNION ALL
-- E) Column drift detector (columns the app code queries directly)
SELECT 'E. Columns', k.tbl || '.' || k.col,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = k.tbl AND column_name = k.col)
       THEN 'PASS' ELSE 'FAIL' END, ''
FROM (VALUES
  ('profiles','credits_remaining'),('profiles','credits_limit'),('profiles','subscription_tier'),
  ('profiles','is_suspended'),('profiles','onboarding_completed'),('profiles','avatar_url'),
  ('posts','scheduled_at'),('posts','status'),('posts','platforms'),('posts','media_urls'),
  ('ai_logs','prompt'),('ai_logs','response'),('ai_logs','tokens_used'),('ai_logs','user_id'),
  ('team_invites','status'),('team_invites','invitee_email'),
  ('subscriptions','current_period_end'),('subscriptions','cancel_at_period_end'),
  ('app_config','app_name')) AS k(tbl, col)

UNION ALL
-- F) Enums: required labels must exist (app inserts these exact values)
SELECT 'F. Enums', 'user_role has user/admin/super_admin',
  CASE WHEN (SELECT count(*) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
             WHERE t.typname = 'user_role' AND e.enumlabel IN ('user','admin','super_admin')) = 3
       THEN 'PASS' ELSE 'FAIL' END,
  COALESCE((SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'user_role'), 'type missing')

UNION ALL
SELECT 'F. Enums', 'subscription_tier has free/starter/pro/agency',
  CASE WHEN (SELECT count(*) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
             WHERE t.typname = 'subscription_tier' AND e.enumlabel IN ('free','starter','pro','agency')) = 4
       THEN 'PASS' ELSE 'FAIL' END,
  COALESCE((SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'subscription_tier'), 'type missing')

UNION ALL
SELECT 'F. Enums', 'subscription_status has active/past_due/canceled/trialing/incomplete',
  CASE WHEN (SELECT count(*) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
             WHERE t.typname = 'subscription_status' AND e.enumlabel IN ('active','past_due','canceled','trialing','incomplete')) = 5
       THEN 'PASS' ELSE 'FAIL' END,
  COALESCE((SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'subscription_status'), 'type missing')

UNION ALL
SELECT 'F. Enums', 'invite_role has editor/viewer',
  CASE WHEN (SELECT count(*) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
             WHERE t.typname = 'invite_role' AND e.enumlabel IN ('editor','viewer')) = 2
       THEN 'PASS' ELSE 'FAIL' END,
  COALESCE((SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'invite_role'), 'type missing')

UNION ALL
SELECT 'F. Enums', 'post_status has draft/scheduled/publishing/published/failed',
  CASE WHEN (SELECT count(*) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
             WHERE t.typname = 'post_status' AND e.enumlabel IN ('draft','scheduled','publishing','published','failed')) = 5
       THEN 'PASS' ELSE 'FAIL' END,
  COALESCE((SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'post_status'), 'type missing')

UNION ALL
SELECT 'F. Enums', 'platform_type has instagram/twitter/linkedin/facebook/tiktok/threads',
  CASE WHEN (SELECT count(*) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
             WHERE t.typname = 'platform_type' AND e.enumlabel IN ('instagram','twitter','linkedin','facebook','tiktok','threads')) = 6
       THEN 'PASS' ELSE 'FAIL' END,
  COALESCE((SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'platform_type'), 'type missing')

UNION ALL
-- G) Storage buckets + whether avatars is public (app reads public URLs)
SELECT 'G. Storage', 'bucket: ' || b.name,
  CASE WHEN b.name = 'avatars' AND b.public THEN 'PASS'
       WHEN b.name = 'avatars' THEN 'FAIL'
       ELSE 'INFO' END,
  'public=' || b.public::text ||
  ', policies referencing bucket=' || (SELECT count(*) FROM pg_policies p
      WHERE p.schemaname = 'storage' AND p.tablename = 'objects'
        AND COALESCE(p.qual, '') || COALESCE(p.with_check, '') LIKE '%' || b.name || '%')::text
FROM storage.buckets b

UNION ALL
-- H) Indexes the app relies on
SELECT 'H. Indexes', i.idxname,
  CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i.idxname)
       THEN 'PASS' ELSE 'WARN' END, ''
FROM (VALUES ('unique_pending_invite_per_inviter')) AS i(idxname)

UNION ALL
-- I) Data integrity: ghost users, orphan rows, missing defaults
SELECT 'I. Data', 'auth users WITHOUT profile row (ghost users)',
  CASE WHEN (SELECT count(*) FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL) = 0
       THEN 'PASS' ELSE 'FAIL' END,
  (SELECT count(*)::text FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL) || ' orphan(s)'

UNION ALL
SELECT 'I. Data', 'profiles WITHOUT auth user (orphans)',
  CASE WHEN (SELECT count(*) FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id WHERE u.id IS NULL) = 0
       THEN 'PASS' ELSE 'WARN' END,
  (SELECT count(*)::text FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id WHERE u.id IS NULL) || ' orphan(s)'

UNION ALL
SELECT 'I. Data', 'profiles missing free subscription row',
  CASE WHEN (SELECT count(*) FROM public.profiles p WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id)) = 0
       THEN 'PASS' ELSE 'WARN' END,
  (SELECT count(*)::text FROM public.profiles p WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id)) || ' profile(s)'

UNION ALL
SELECT 'I. Data', 'users with negative credits',
  CASE WHEN (SELECT count(*) FROM public.profiles WHERE credits_remaining < 0) = 0
       THEN 'PASS' ELSE 'WARN' END,
  (SELECT count(*)::text FROM public.profiles WHERE credits_remaining < 0) || ' user(s)'

UNION ALL
SELECT 'I. Data', 'app_config seed row exists (mobile branding/config)',
  CASE WHEN EXISTS (SELECT 1 FROM public.app_config LIMIT 1) THEN 'PASS' ELSE 'FAIL' END,
  (SELECT count(*)::text FROM public.app_config) || ' row(s)'

UNION ALL
SELECT 'I. Data', 'ai_config seed row exists (admin AI settings)',
  CASE WHEN EXISTS (SELECT 1 FROM public.ai_config LIMIT 1) THEN 'PASS' ELSE 'FAIL' END,
  (SELECT count(*)::text FROM public.ai_config) || ' row(s)'

UNION ALL
-- J) Full RLS policy dump (the "rules" — review wording/coverage)
SELECT 'J. Policy list', tablename::text || ' → ' || policyname::text, 'INFO',
  'cmd=' || cmd || ', roles=' || array_to_string(roles, ',') ||
  ', using=' || COALESCE(left(qual, 90), '-') || ', check=' || COALESCE(left(with_check, 60), '-')
FROM pg_policies WHERE schemaname = 'public'

ORDER BY 1, 3, 2;  -- section, then FAIL before PASS
