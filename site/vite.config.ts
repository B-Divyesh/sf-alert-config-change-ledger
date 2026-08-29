import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const sampleReport = JSON.parse(execFileSync(
  'cargo',
  ['run', '--quiet', '--example', 'web-sample-report'],
  { cwd: process.cwd(), encoding: 'utf8' },
));

export default defineConfig({
  root: resolve(process.cwd(), 'site'),
  publicDir: resolve(process.cwd(), 'site/public'),
  build: {
    outDir: resolve(process.cwd(), 'dist/site'),
    emptyOutDir: true,
    target: 'es2022',
    manifest: true
  },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  define: { __SAMPLE_REPORT__: JSON.stringify(sampleReport) }
});
