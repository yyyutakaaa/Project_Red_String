import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Plugin } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedCore = path.resolve(here, '../supabase/functions/_shared/core');

// The commit this build comes from. Vercel and GitHub Actions pass it in; local builds ask git.
function buildCommit(): string {
  const fromEnv = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD', { cwd: here, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

// Writes dist/version.json: the commit, the build time, and every file in the build with its sha256.
// The desktop app compares this with the copy on the live site, and when the live one is newer it
// downloads exactly these files and checks each hash before switching to them.
function versionFile(): Plugin {
  let outDir = 'dist';
  return {
    name: 'red-string-version-file',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files: Record<string, string> = {};
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else {
            const rel = path.relative(outDir, full).split(path.sep).join('/');
            if (rel !== 'version.json') files[rel] = createHash('sha256').update(readFileSync(full)).digest('hex');
          }
        }
      };
      walk(outDir);
      const manifest = { commit: buildCommit(), builtAt: new Date().toISOString(), files };
      writeFileSync(path.join(outDir, 'version.json'), JSON.stringify(manifest, null, 2) + '\n');
    },
  };
}

export default defineConfig({
  plugins: [react(), versionFile()],
  resolve: {
    alias: [
      { find: /^zod$/, replacement: path.resolve(here, 'node_modules/zod') },
      { find: /^@shared\/(.*)$/, replacement: `${sharedCore}/$1` },
    ],
  },
  server: {
    port: 5173,
    fs: { allow: [path.resolve(here, '..')] },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
