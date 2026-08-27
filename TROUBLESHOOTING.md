# 🛠️ Troubleshooting & FAQ Guide

### Q1: Expo / Metro reports module resolution issues in monorepo?
**Solution:**
Ensure you run `pnpm install` from the **root folder** so that the `.npmrc` hoisted linker resolves dependencies across workspace sub-packages.

---

### Q2: Supabase queries return empty arrays or permission denied?
**Solution:**
Check that **Row Level Security (RLS)** policies are applied correctly by executing `supabase/migrations/20240001000000_initial_schema.sql` in your Supabase SQL editor.

---

### Q3: Admin login says "Access Denied: Admin privileges required"?
**Solution:**
In your Supabase dashboard → **Table Editor** → **profiles**, find your user email and update the `role` column to `super_admin` or `admin`.

---

### Q4: Realtime theme colors do not update on mobile?
**Solution:**
Ensure Realtime replication is enabled on the `app_config` table in your Supabase dashboard (Database → Publications → supabase_realtime).
