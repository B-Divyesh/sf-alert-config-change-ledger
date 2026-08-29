import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureRustToolchain, RUST_TOOLCHAIN } from './runtime-bootstrap.mjs';

// @claim:minimum-runtimes
const root = resolve(process.cwd());
const manifest = readFileSync(resolve(root, 'Cargo.toml'), 'utf8');
assert.match(manifest, /^rust-version = "1\.85"$/m, 'Cargo.toml must declare Rust 1.85');

ensureRustToolchain((command, args, options) => execFileSync(command, args, { cwd: root, ...options }));
execFileSync('rustup', ['run', RUST_TOOLCHAIN, 'cargo', 'check', '--locked', '--bin', 'alert-ledger'], {
  cwd: root,
  stdio: 'inherit',
});
execFileSync('npx', ['--yes', '--package=node@22.12.0', 'node', 'site/scripts/minimum-node-build.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
assert.ok(existsSync(resolve(root, 'dist/site/index.html')), 'Node 22.12.0 must create the site entry point');
