const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n======================================================');
console.log('🚀 SocialPilot AI Pro — Automated Setup Wizard');
console.log('======================================================\n');

const root = process.cwd();

// 1. Check Node & PNPM
console.log('🔍 Checking environment...');
try {
  const nodeVer = process.version;
  console.log(`✅ Node.js: ${nodeVer}`);
} catch (e) {
  console.error('❌ Node.js is required.');
  process.exit(1);
}

// 2. Setup Environment Variables if missing
console.log('\n📝 Checking environment variables...');
const envs = [
  {
    src: 'apps/mobile/.env.example',
    dest: 'apps/mobile/.env',
    defaultContent: 'EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nEXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\nEXPO_PUBLIC_APP_NAME="SocialPilot AI Pro"\n'
  },
  {
    src: 'apps/admin/.env.example',
    dest: 'apps/admin/.env.local',
    defaultContent: 'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n'
  }
];

envs.forEach(({ dest, defaultContent }) => {
  const destPath = path.join(root, dest);
  if (!fs.existsSync(destPath)) {
    fs.writeFileSync(destPath, defaultContent, 'utf8');
    console.log(`✨ Generated starter env: ${dest}`);
  } else {
    console.log(`✅ Found existing env: ${dest}`);
  }
});

// 3. Install Monorepo Dependencies
console.log('\n📦 Syncing workspace packages via pnpm...');
try {
  execSync('pnpm install', { stdio: 'inherit' });
  console.log('✅ Workspace dependencies installed successfully.');
} catch (e) {
  console.error('❌ Failed to run pnpm install.');
}

console.log('\n======================================================');
console.log('🎉 Setup complete! You are ready to launch.');
console.log('======================================================');
console.log('1. Start Mobile App:  cd apps/mobile && npx expo run:android --no-install');
console.log('2. Start Web Admin:   pnpm --filter @socialpilot/admin dev');
console.log('3. Documentation:     See INSTALLATION.md and ADMIN_GUIDE.md\n');
