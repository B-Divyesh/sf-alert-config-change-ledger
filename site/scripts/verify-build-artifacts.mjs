import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// @claim:build-artifacts
const root = resolve(process.cwd());
execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });

const binary = resolve(root, 'target/release/alert-ledger');
assert.ok(existsSync(binary), 'the release CLI must exist');
const help = execFileSync(binary, ['--help'], { encoding: 'utf8' });
assert.match(help, /Read-only alert configuration snapshot and drift ledger/);

const site = resolve(root, 'dist/site');
const index = resolve(site, 'index.html');
assert.ok(existsSync(index), 'the static site entry point must exist');
const indexHtml = readFileSync(index, 'utf8');
assert.match(indexHtml, /<script type="module" crossorigin src="\/assets\/[^"?]+\.js"><\/script>/);
const assets = readdirSync(resolve(site, 'assets'));
assert.ok(assets.some((asset) => asset.endsWith('.js')), 'the static site must include its JavaScript asset');
assert.ok(assets.some((asset) => asset.endsWith('.css')), 'the static site must include its CSS asset');
