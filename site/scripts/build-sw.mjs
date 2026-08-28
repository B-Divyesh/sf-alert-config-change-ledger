import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist/site');
const manifest = JSON.parse(await readFile(resolve(dist, '.vite/manifest.json'), 'utf8'));
const assets = [...new Set(Object.values(manifest).flatMap((entry) => [entry.file, ...(entry.css || [])]).map((file) => `/${file}`))];
const serviceWorkerPath = resolve(dist, 'sw.js');
const source = await readFile(serviceWorkerPath, 'utf8');
await writeFile(serviceWorkerPath, source.replace('const APP_ASSETS = [];', `const APP_ASSETS = ${JSON.stringify(assets)};`));
