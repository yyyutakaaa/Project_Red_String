import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedCore = path.resolve(here, '../supabase/functions/_shared/core');

export default defineConfig({
  plugins: [react()],
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
