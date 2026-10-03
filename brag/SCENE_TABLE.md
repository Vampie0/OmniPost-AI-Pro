# SocialPilot AI Pro — Launch Film · Scene Table
Runtime: **6m 22s** · 1920×1080 · 30fps · H.264 + AAC · 30.5 MB
Music bed: `music-bg.mp3` (29s source) seamlessly looped via ffmpeg to 382s with 1.5s fade-in / 4s fade-out.

Every scene is a self-contained `<section>` in `video/index.html`. To re-shoot a single scene, edit only that section and its timeline block — no other scene depends on it.

| # | Scene | Platform frame | Start | Duration | Key beats | Elements animated |
|---|-------|---------------|-------|----------|-----------|-------------------|
| 1 | HOOK · "41 screens · 3 platforms · One AI engine" | Kinetic type | 0s | 8s | Bold stat fade → 4 platform pills pop → tagline | `s1lead`, `s1w1/w2`, `s1p1-p4`, `s1tag` |
| 2 | BRAND HERO · SocialPilot AI Pro | Kinetic type | 8s | 10s | Logo scale-in with back.out → name reveal → tagline + 2 pills | `s2logo`, `s2name`, `s2tag`, `s2p1/p2` |
| 3 | MOBILE AUTH | iPhone × 3 | 18s | 20s | Login → Register → Onboarding (niche picker) | 3 iPhones stagger + 3 callouts |
| 4 | MOBILE HOME · Command Center | iPhone | 38s | 14s | Greeting fade, credits counter ticks to 247, 4 stat cards, recent posts | `s4hero`, `s4cred` counter, `s4bar` fill, `s4s1-s4`, `s4cta` |
| 5 | **MOBILE GENERATE · flagship AI Studio** | iPhone × 2 | 52s | 24s | Character-by-character prompt typing → Generate pulse → 3 output variations slide in | `s5typed`, `s5caret` blink, `s5gen`, `s5out`, 3 output cards |
| 6 | POST DETAIL + CALENDAR | iPhone × 2 split | 76s | 20s | Post preview + calendar grid, day selected, 4 scheduled items | `s6sel`, `s6day`, 3 callouts |
| 7 | MOBILE ANALYTICS | iPhone | 96s | 16s | KPIs → line chart draws → platform bars fill (Twitter/IG/LI/TikTok) | `s7s1/s2`, `s7line` (SVG path draw), `s7area`, `.pf-bar × 4` |
| 8 | SETTINGS SWEEP · Profile + Settings + Security | iPhone × 3 | 112s | 20s | Profile card → 5-palette theme picker with tap → Security sessions | `s8d2/d3`, swatch selection pulses |
| 9 | CONNECTED ACCOUNTS | iPhone | 132s | 14s | 5 platform OAuth cards cascade in | `.conn × 5` |
| 10 | NOTES → AI REWRITE | iPhone × 2 | 146s | 14s | 4 note cards → right phone reveals rewrite | `.note-card`, `s10d2` |
| 11 | HISTORY + STUDIO MENU | iPhone × 2 | 160s | 16s | 6 history rows → 10 studio tiles grid | `.hist-row × 6`, `s11d2`, `.studio-tile × 10` |
| 12 | TEAM · Roles & Permissions | **Android** | 176s | 14s | Team roster (Owner/Admin/Editor/Viewer) + invite | `.team-row × 5` |
| 13 | PAYWALL · 4 tiers | **Android** | 190s | 14s | Free/Starter/Pro/Agency tier cards, Pro pulses | `.tier × 4` |
| 14 | NOTIFICATIONS + TEST CONNECTION | iPhone × 2 | 204s | 12s | 5 notif rows → 5-step diagnostic all green | `.notif × 5`, `s14d2`, `.test-row × 5`, `s14 .test-banner` |
| 15 | ADMIN LOGIN | Browser (macOS Chrome) | 216s | 12s | Split hero/login panel, sign-in button pulses | `.browser` scale-in |
| 16 | ADMIN DASHBOARD · KPIs + charts | Browser | 228s | 22s | 4 KPIs with counter animation → MRR line chart → donut platform split | `.kpi × 4` with `data-count` tween, `s16line` SVG draw, donut 4 arcs |
| 17 | ADMIN USERS · Role edit | Browser + modal | 250s | 20s | 5-row users table with role badges → click Luna row → modal opens with role pills + credit refill | `tbody tr × 5`, `#s17r5` outline pulse, `#s17modal` scale-in |
| 18 | ADMIN TEMPLATES + POSTS | Browser | 270s | 18s | 8 template cards stagger in → recent posts table | `.tpl × 8`, `tbody tr × 3` |
| 19 | ADMIN ANALYTICS | Browser | 288s | 16s | 3 chart cards · bar heights grow · share bars fill · top-posts table | `.bar × 20`, `.share-bar × 4`, table rows |
| 20 | WHITE LABEL STUDIO | Browser | 304s | 20s | Brand name/color/font/radius/feature toggles + live preview pane | `.wl-sw` selection pulses, feature toggle |
| 21 | ADMIN MISC · Settings + Notifications + Test | Browser × 3 tiles | 324s | 12s | 3 admin panels side-by-side | `.admin-tile × 3`, `.at-row` cascade |
| 22 | PLATFORM LINEUP | iPhone + Android + Browser | 336s | 12s | 3 device frames slide up in stagger · "Shared packages" tagline | `s22d1/d2/d3`, `s22tag` |
| 23 | FEATURE BADGES RECAP | Motion graphic | 348s | 14s | 16 feature chips fly in stagger | `#s23 .chip × 16` |
| 24 | **CONTACT FINALE** · Ali Aslam @vampie | Brand card | 362s | 20s | Name + orange @vampie pill → divider wipe → 4 contact rows sequentially (WhatsApp → Email → GitHub → LinkedIn) → CTA + footer | `s24by`, `s24name`, `s24handle` (glow pulse), `s24 .divider` scaleX, `s24r1-r4`, `s24cta`, `s24foot`, `s24brand` |

## Coverage checklist (every screen in the repo, verified)

### Mobile — 28 routes
- (auth) login / register / forgot-password / update-password / onboarding → **S3**
- (tabs) index (Home) / generate / calendar / analytics / profile → **S4, S5, S6, S7, S8**
- connected-accounts → **S9**
- notes → **S10**
- history / studio-menu → **S11**
- team → **S12**
- paywall → **S13**
- notifications / notification-settings → **S14**
- test-connection → **S14** (paired)
- security → **S8** (paired)
- edit-profile → **S8** (paired)
- settings → **S8**
- post/[id] → **S6**

### Admin — 13 routes
- (auth) login → **S15**
- (dashboard) index → **S16**
- (dashboard) users (role edit + credit grant + suspend + CSV) → **S17**
- (dashboard) posts / templates → **S18**
- (dashboard) analytics → **S19**
- (dashboard) subscriptions → **S20**
- (dashboard) ai-settings → **S20** (paired)
- (dashboard) white-label → **S20**
- (dashboard) settings / notifications → **S21**
- (dashboard) test-connection → **S21**
- unauthorized → covered conceptually in S15 middleware note

### Supabase backend
- 14 tables with RLS + policies → surface in S9 (connected accounts) + S14/S21 (test-connection diagnostics) + S16/S19 (analytics data)
- Edge functions `generate-content` + `generate-image` → S5 (typing prompt → variations)
- Trigger `handle_new_user` → S3 (register creates profile) + S17 (users table rows)

## Where to edit
- **Timing / scene order** → `video/index.html` — each `<section>` has `data-start` + `data-duration`; the `sceneWindow(id, start, dur)` helper drives scene opacity. Keep them in sync.
- **Copy inside a mockup** → the `<section>` itself — every label, badge, and button is real text you can edit.
- **Palette** → CSS at the top of the file. Currently `sunset` (Obsidian Ember & Liquid Gold) — swap to `emerald`, `violet`, `azure`, or `stealth` from `packages/tokens/src/index.ts`.
- **Music** → `D:\personal-apps\bgm\music-bg.mp3` was looped via:
  ```
  ffmpeg -stream_loop -1 -i music-bg.mp3 -t 382 -c:a libmp3lame -b:a 192k \
    -af "afade=t=in:st=0:d=1.5,afade=t=out:st=378:d=4" bgm-loop.mp3
  ```
  Re-run with a different `-t` value if you change total duration.

## Re-render a single scene
HyperFrames renders the whole `index.html` in one pass, so you can't re-render one scene alone. But you CAN `hyperframes preview` for browser review, tweak a scene's HTML, then re-render the whole film (~10 min wall time on this hardware).
