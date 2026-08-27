---
kind: external_dependency
name: Google Gemini Text Generation API
slug: google-gemini-api
category: external_dependency
category_hints:
    - vendor_identity
    - sdk_real_api
scope:
    - '**'
---

Text content generation uses Google's Gemini 1.5 Pro model via the `generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent` endpoint. The API key is injected as `GEMINI_API_KEY` in Supabase Edge Function secrets. The function reads user-configurable `system_prompt`, `temperature`, and `max_tokens` from the `ai_config` table and passes them into the `generationConfig`. If no key is configured, the function returns a mock response instead of failing.