# 🚀 SocialPilot AI Pro — Quick Start & Installation Guide

Thank you for purchasing **SocialPilot AI Pro**! Follow this step-by-step guide to get your Mobile App and Web Admin Panel live in **under 30 minutes**.

---

## 📋 Prerequisites
- **Node.js**: v18+ or v20+ installed
- **pnpm**: `npm install -g pnpm`
- **Supabase Account**: Free account at [supabase.com](https://supabase.com)

---

## ⚡ Step 1: Automated One-Command Setup
Open your terminal in the project root folder and run:
```bash
node scripts/setup-all.cjs
```

---

## 🗄️ Step 2: Supabase Database Setup
1. Create a new Supabase Project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/20240001000000_initial_schema.sql` from this project, paste the entire SQL, and click **Run**.
4. Open `supabase/seed.sql`, paste its content into the SQL Editor, and click **Run**.
5. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public key**

---

## 🔑 Step 3: Configure Environment Keys

### 1. Mobile App (`apps/mobile/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_APP_NAME="SocialPilot AI Pro"
```

### 2. Web Admin (`apps/admin/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📱 Step 4: Running the Mobile App
```bash
cd apps/mobile
npx expo run:android --no-install
```
*(Or `npx expo start` to preview with Expo Go on your mobile device).*

---

## 🖥️ Step 5: Running the Web Admin Panel
```bash
pnpm --filter @socialpilot/admin dev
```
Open **http://localhost:3001/login** in your browser.

---

## 👑 First-Time Admin Account Creation
1. Register a new account inside the mobile app or via Supabase Auth.
2. In Supabase Table Editor → `profiles`, change your user's `role` from `user` to **`super_admin`**.
3. Now log in to **http://localhost:3001/login** with those credentials to access the master control suite.
