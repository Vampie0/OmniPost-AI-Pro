/**
 * postinstall script to deduplicate React across node_modules.
 * Fixes:
 *   - "Cannot read properties of null (reading 'useContext')" — duplicate React runtime
 *   - "'Flame' cannot be used as a JSX component" — duplicate @types/react (v19 vs v18)
 *
 * In pnpm monorepos with node-linker=hoisted, different packages may resolve
 * different React / @types/react versions. This script removes nested copies
 * so all packages share the single root copy.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NM = path.join(ROOT, 'node_modules');

// ─── Helpers ────────────────────────────────────────────────────────────────

function readVersion(pkgDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  }
  return false;
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

/** Walk one level of node_modules looking for nested copies of `pkgName` */
function findNestedCopies(pkgName) {
  const copies = [];
  const rootPkg = path.join(NM, pkgName);
  if (!fs.existsSync(rootPkg)) return copies;

  const entries = fs.readdirSync(NM, { withFileTypes: true });
  const parts = pkgName.startsWith('@') ? pkgName.split('/') : null;

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.pnpm' || entry.name.startsWith('.')) continue;

    const nested = parts
      ? path.join(NM, entry.name, 'node_modules', parts[0], parts[1])
      : path.join(NM, entry.name, 'node_modules', pkgName);

    if (fs.existsSync(nested) && nested !== rootPkg) {
      copies.push(nested);
    }
  }
  return copies;
}

// ─── Deduplicate runtime React ──────────────────────────────────────────────

const RUNTIME_TARGETS = ['react', 'react-dom'];
let totalRemoved = 0;

for (const target of RUNTIME_TARGETS) {
  const copies = findNestedCopies(target);
  for (const copy of copies) {
    if (copy.includes('.pnpm')) continue;
    if (removeDir(copy)) {
      console.log(`[dedupe] Removed ${target}: ${path.relative(ROOT, copy)}`);
      totalRemoved++;
    }
  }
}

// ─── Fix @types/react version mismatch ──────────────────────────────────────
// Some monorepo deps pull @types/react@18 while Next 15 + React 19 need v19.
// Strategy: find the correct 19.x copy, ensure it's at root.

const TYPES_TARGETS = ['@types/react', '@types/react-dom'];
const REQUIRED_MAJOR = '19';

for (const target of TYPES_TARGETS) {
  const rootDir = path.join(NM, target);
  const rootVersion = readVersion(rootDir);
  if (!rootVersion) continue;

  // If root is already the correct major, just clean nested copies
  if (rootVersion.startsWith(REQUIRED_MAJOR + '.')) {
    for (const copy of findNestedCopies(target)) {
      if (copy.includes('.pnpm')) continue;
      if (removeDir(copy)) {
        console.log(`[dedupe] Removed ${target}: ${path.relative(ROOT, copy)}`);
        totalRemoved++;
      }
    }
    continue;
  }

  // Root is wrong version — find a correct nested copy to promote
  const copies = findNestedCopies(target);
  let correctCopy = null;
  for (const copy of copies) {
    const v = readVersion(copy);
    if (v && v.startsWith(REQUIRED_MAJOR + '.')) {
      correctCopy = copy;
      break;
    }
  }

  if (correctCopy) {
    removeDir(rootDir);
    copyDir(correctCopy, rootDir);
    removeDir(correctCopy);
    console.log(`[dedupe] Replaced ${target} ${rootVersion} → ${readVersion(rootDir)} (from ${path.relative(ROOT, correctCopy)})`);
    totalRemoved++;
  } else {
    console.warn(`[dedupe] WARNING: ${target} is ${rootVersion} but no ${REQUIRED_MAJOR}.x copy found. Run: pnpm add -D @types/react@${REQUIRED_MAJOR} @types/react-dom@${REQUIRED_MAJOR}`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────

if (totalRemoved === 0) {
  console.log('[dedupe] No duplicates found — clean!');
} else {
  console.log(`[dedupe] Cleaned ${totalRemoved} duplicate(s)`);
}
