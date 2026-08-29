import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
assert.equal(process.versions.node, '22.12.0', 'this build must use the lowest supported Node 22 runtime');
execFileSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'build', '--config', 'site/vite.config.ts'], {
  cwd: root,
  stdio: 'inherit',
});
assert.ok(existsSync(resolve(root, 'dist/site/index.html')), 'Vite must emit the static entry point');
