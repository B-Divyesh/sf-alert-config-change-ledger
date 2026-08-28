import { defineConfig } from 'vite';
import { resolve } from 'node:path';

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
  preview: { host: '127.0.0.1' }
});
