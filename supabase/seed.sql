-- ==============================================================================
-- SocialPilot AI Pro — Seed Data (Zero-Config Defaults)
-- ==============================================================================

-- Default White-Label Branding Configuration
INSERT INTO public.app_config (app_name, primary_color, secondary_color, accent_color, support_email, feature_flags, legal_links)
VALUES (
    'SocialPilot AI Pro',
    '#4F46E5',
    '#14B8A6',
    '#F43F5E',
    'support@socialpilot.ai',
    '{"revenuecat": true, "social_login": true, "ai_image": true, "ai_text": true}'::jsonb,
    '{"terms": "https://example.com/terms", "privacy": "https://example.com/privacy"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Default AI Configuration (Gemini 2.0 Flash Presets)
INSERT INTO public.ai_config (text_provider, text_model, image_provider, image_model, max_tokens, temperature, rate_limit_per_min)
VALUES ('gemini', 'gemini-2.0-flash', 'replicate', 'stability-ai/sdxl', 2048, 0.7, 20)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 12 Social Media Post Templates Across Multiple Categories
-- ==============================================================================
INSERT INTO public.templates (title, category, prompt_template, tags, default_hashtags, suggested_platform, is_featured, is_premium)
VALUES
    -- Video / Reels
    ('Viral Hook & Reel Script', 'Video',
     'Create a 30-second high-retention Instagram Reel script about: {{topic}}. Include a scroll-stopping hook in the first 2 seconds, 3 key points, and a strong CTA.',
     ARRAY['viral', 'reels', 'video', 'engagement'],
     ARRAY['#reelsviral', '#contentcreator', '#growthhacks'],
     'instagram', true, false),

    ('TikTok Trend Script', 'Video',
     'Write a 15-60 second TikTok script about {{topic}} using current trending formats. Include hook, value delivery, and CTA.',
     ARRAY['tiktok', 'trending', 'video'],
     ARRAY['#fyp', '#viral', '#trending'],
     'tiktok', true, false),

    -- Business / Thought Leadership
    ('Thought Leadership Thread', 'Business',
     'Write a 5-tweet engaging thread sharing key lessons about: {{topic}}. Use storytelling, data points, and actionable insights.',
     ARRAY['leadership', 'twitter', 'thread'],
     ARRAY['#buildinpublic', '#founders', '#productivity'],
     'twitter', true, false),

    ('LinkedIn Carousel Post', 'Business',
     'Write an insightful 5-slide carousel breakdown on: {{topic}}. Each slide should have a clear headline and 2-3 bullet points.',
     ARRAY['linkedin', 'carousel', 'professional'],
     ARRAY['#leadership', '#innovation', '#technology'],
     'linkedin', true, true),

    -- Marketing / Sales
    ('Promotional Product Launch', 'Marketing',
     'Write a high-converting announcement post for a product launch: {{topic}}. Include urgency, social proof, and clear CTA.',
     ARRAY['launch', 'product', 'marketing'],
     ARRAY['#launchday', '#specialoffer', '#newrelease'],
     'instagram', false, false),

    ('Flash Sale Announcement', 'Marketing',
     'Create an urgent flash sale post about: {{topic}}. Emphasize scarcity, discount value, and time limit.',
     ARRAY['sale', 'promo', 'urgent'],
     ARRAY['#flashsale', '#limitedoffer', '#deals'],
     'instagram', false, false),

    -- Engagement / Community
    ('Poll & Engagement Post', 'Engagement',
     'Create an engaging poll post about {{topic}} with 4 options. Include a controversial take to drive comments.',
     ARRAY['poll', 'engagement', 'community'],
     ARRAY['#poll', '#community', '#votnow'],
     'twitter', false, false),

    ('User-Generated Content Prompt', 'Engagement',
     'Write a post encouraging followers to share their experiences related to: {{topic}}. Include a branded hashtag challenge.',
     ARRAY['ugc', 'community', 'challenge'],
     ARRAY['#ugc', '#communitychallenge', '#shareyourstory'],
     'instagram', false, false),

    -- Educational / How-To
    ('Step-by-Step Tutorial Post', 'Educational',
     'Write a clear step-by-step tutorial post about: {{topic}}. Use numbered steps, emojis for visual breaks, and a save-this-post CTA.',
     ARRAY['tutorial', 'howto', 'educational'],
     ARRAY['#tutorial', '#howto', '#learntoday'],
     'instagram', true, false),

    ('Industry Insights Breakdown', 'Educational',
     'Create a data-driven LinkedIn post analyzing trends in: {{topic}}. Include 3 statistics and your expert take.',
     ARRAY['insights', 'data', 'analysis'],
     ARRAY['#industryinsights', '#datadriven', '#trends'],
     'linkedin', false, true),

    -- Lifestyle / Behind-the-Scenes
    ('Behind-the-Scenes Story', 'Lifestyle',
     'Write an authentic behind-the-scenes post about: {{topic}}. Show vulnerability, process, and human side of the brand.',
     ARRAY['bts', 'authentic', 'storytelling'],
     ARRAY['#behindthescenes', '#authentic', '#brandstory'],
     'instagram', false, false),

    ('Motivational Monday Post', 'Lifestyle',
     'Create an inspiring Monday motivation post about: {{topic}}. Include a powerful quote and actionable challenge for the week.',
     ARRAY['motivation', 'monday', 'inspiration'],
     ARRAY['#motivationmonday', '#weeklygoals', '#mindset'],
     'twitter', false, false);

-- ==============================================================================
-- Super-Admin Seed Instructions (run manually after creating auth user)
-- ==============================================================================
-- To create a super-admin, first sign up via Supabase Auth, then run:
--   UPDATE public.profiles SET role = 'super_admin', credits_remaining = 99999, credits_limit = 99999
--   WHERE email = 'your-admin@email.com';
