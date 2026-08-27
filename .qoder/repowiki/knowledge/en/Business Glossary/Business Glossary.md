---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### credits
- Definition：User-scoped consumption units tracked in `profiles.credits_remaining` and `profiles.credits_limit`. Each text generation deducts 1 credit and each image generation deducts 2 credits via the `decrement_user_credits` RPC. Free-tier users start with 50 credits; higher subscription tiers increase the limit.
- Aliases：credit balance、user credits

### subscription_tier
- Definition：Enum defining user billing levels: `free`, `starter`, `pro`, `agency`. Stored on `profiles.subscription_tier` and controls access to premium features such as templates marked `is_premium = true`.
- Aliases：tier、plan

### post_status
- Definition：Lifecycle state of a scheduled post: `draft`, `scheduled`, `publishing`, `published`, `failed`. Used to track the publishing pipeline across platforms.
- Aliases：post state、status

### platform_type
- Definition：Supported social networks for posting: `instagram`, `twitter`, `linkedin`, `facebook`, `tiktok`, `threads`. Posts can target multiple platforms simultaneously via a TEXT[] column.
- Aliases：social platform、channel

### ai_config
- Definition：Centralized configuration table controlling which AI provider/model is active (`text_provider`, `image_provider`, `text_model`, `image_model`), plus generation parameters (`temperature`, `max_tokens`, `system_prompt`). Admins manage it; authenticated users read it to drive the generate-content and generate-image flows.
- Aliases：AI settings、model config

### app_config
- Definition：White-label and feature flags table: app name/logo/colors, support links, and toggles for `enable_revenuecat`, `enable_social_login`, and `maintenance_mode`. Read by clients at runtime to adapt UI and behavior.
- Aliases：white-label config、feature flags

### RLS
- Definition：Row-Level Security policies enforced by Supabase that restrict data access per user. Every table has policies scoped to `auth.uid()` or `public.is_admin()`, ensuring users can only read/update their own rows while admins have full access.
- Aliases：row-level security、policies
