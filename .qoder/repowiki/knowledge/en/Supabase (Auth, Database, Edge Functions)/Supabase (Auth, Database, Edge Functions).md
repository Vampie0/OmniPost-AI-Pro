---
kind: external_dependency
name: Supabase (Auth, Database, Edge Functions)
slug: supabase
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

Supabase is the backend platform for SocialPilot AI Pro. It provides: (1) PostgreSQL database with RLS policies and Realtime subscriptions for posts, notifications, templates, and analytics; (2) Auth service used by both Next.js admin and Expo mobile apps via @supabase/supabase-js; (3) Deno-based Edge Functions (`generate-content`, `generate-image`) that authenticate users via Supabase JWT and call downstream AI providers. The schema defines roles (`user`, `admin`, `super_admin`), subscription tiers (`free`, `starter`, `pro`, `agency`), and a credit system (`credits_remaining`, `credits_limit`) decremented through the `decrement_user_credits` RPC after each AI generation.