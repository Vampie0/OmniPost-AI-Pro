const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outputFile = path.join(root, 'PROJECT_EXPORT_MASTER.txt');

console.log('🚀 Generating Complete Master Project Export File...\n');

// Folders / files to ignore
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.expo',
  'dist',
  'build',
  '.turbo',
  '.pnpm-store',
  'android',
  'ios'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.cjs',
  '.mjs',
  '.json',
  '.sql',
  '.md',
  '.css',
  '.yaml',
  '.yml',
  '.toml'
]);

// 1. Generate Visual Folder Tree
function generateDirectoryTree(dir, prefix = '') {
  let output = '';
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const validEntries = entries.filter(
    (e) => !IGNORED_DIRS.has(e.name) && !e.name.startsWith('.') && e.name !== 'PROJECT_EXPORT_MASTER.txt'
  );

  validEntries.forEach((entry, index) => {
    const isLast = index === validEntries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    output += `${prefix}${connector}${entry.name}\n`;

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      output += generateDirectoryTree(path.join(dir, entry.name), newPrefix);
    }
  });

  return output;
}

// 2. Collect All Code Files
function collectFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        collectFiles(fullPath, fileList);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTENSIONS.has(ext) && entry.name !== 'PROJECT_EXPORT_MASTER.txt') {
        fileList.push(fullPath);
      }
    }
  });

  return fileList;
}

// Build Export Text Buffer
let exportBuffer = '';

// A. MASTER ARCHITECTURAL SUMMARY FOR ANY AI
exportBuffer += `================================================================================
SOCIALPILOT AI PRO (v3.0) — COMPLETE MONOREPO MASTER CONTEXT & CODEBASE EXPORT
================================================================================
Generated: ${new Date().toISOString()}
Target Product: White-Label AI-Powered Social Media Management Suite ($49–$79 Template)
Stack: React Native (Expo SDK 57 / RN 0.86 / React 19.2) + Next.js 14+ App Router + Supabase (PostgreSQL + RLS + Realtime)

KEY ARCHITECTURAL HIGHLIGHTS FOR AI:
1. 5 LUXURY THEME PALETTES (0% HARDCODED COLORS):
   - Sunset Ember (#06070B, #FF5E3A -> #FFAE00)
   - Cyber Mint (#040605, #00F5A0 -> #00D2FF)
   - Cyberpunk Velvet (#07050D, #FF2A85 -> #8B5CF6)
   - Titanium Azure (#030712, #38BDF8 -> #6366F1)
   - Stealth Titanium (#000000, #F4F4F5 -> #A1A1AA)
   * All mobile & admin components strictly consume dynamic tokens from useTheme() / theme.colors.*

2. HIGH-TECH CUSTOM UI & ANIMATIONS:
   - UIverse "rare-cow-16" LuminousOrbLoader (360° rotating multi-stop aura with scale+opacity blur simulation).
   - Custom 60fps Sliding Neon Toggle Switch (CustomToggle.tsx with persistent memory).
   - 3D Celestial Galaxy Animated Splash Screen with orbiting Instagram, X, LinkedIn, TikTok planets.
   - Laser-glowing focused inputs with password eye show/hide toggle.
   - Universal Multi-Press Debounce Lock (useSafePress.ts + SafeTouchable.tsx preventing duplicate screen pushes).

3. CUSTOMER CONVENIENCE MODULES:
   - International PhoneInput.tsx with all global dialing codes (+92, +1, +44, +971, etc.) & flags.
   - Creator Notes & Scratchpad Hub (/notes) with persistent SecureStore storage & "Expand with AI" studio export.
   - Multi-Account & Multi-Page Selection OAuth Sheet (/connected-accounts).
   - Full-Month Calendar Scheduler (/post/[id] with past dates disabled).
   - Multi-Country Payment Paywall (/paywall with Card, Apple/Google Pay, PayPal options).
   - Studio Side Drawer (/studio-menu) & Master Settings Hub (/settings).

4. CROSS-PLATFORM REALTIME WHITE-LABEL:
   - Web Admin updates app_config -> Mobile receives Realtime WebSocket broadcast -> Instant live branding/color switch without reload.

================================================================================
MONOREPO COMPLETE DIRECTORY TREE STRUCTURE
================================================================================
socialpilot-ai-pro/
${generateDirectoryTree(root)}

================================================================================
MONOREPO SOURCE CODE & CONFIGURATION FILES
================================================================================
`;

const allFiles = collectFiles(root);
console.log(`📦 Bundling ${allFiles.length} files into export...`);

allFiles.forEach((filePath) => {
  const relativePath = path.relative(root, filePath).replace(/\\/g, '/');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  exportBuffer += `\n================================================================================\n`;
  exportBuffer += `FILE: ${relativePath}\n`;
  exportBuffer += `================================================================================\n`;
  exportBuffer += fileContent;
  exportBuffer += `\n`;
});

// Write to final single output file
fs.writeFileSync(outputFile, exportBuffer, 'utf8');

const stats = fs.statSync(outputFile);
const sizeKB = (stats.size / 1024).toFixed(2);

console.log(`\n✅ SUCCESS! Master Export generated: PROJECT_EXPORT_MASTER.txt`);
console.log(`📊 Total Files Included: ${allFiles.length}`);
console.log(`📁 Export File Size: ${sizeKB} KB`);
console.log(`\n👉 File location: ${outputFile}\n`);