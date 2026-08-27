---
kind: external_dependency
name: Replicate Image Generation
slug: replicate
category: external_dependency
category_hints:
    - vendor_identity
    - sdk_real_api
scope:
    - '**'
---

Image generation is delegated to Replicate using the SDXL model version `39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b`. The token is provided via the `REPLICATE_API_TOKEN` environment secret on the Supabase Edge Function. Requests are POSTed to `/v1/predictions` with `prompt`, `aspect_ratio`, and style modifiers; the resulting image URL is stored in the `generated_images` table. A fallback Unsplash placeholder is returned when no token is configured.