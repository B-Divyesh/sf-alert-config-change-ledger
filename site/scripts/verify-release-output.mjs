import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// @claim:release-identity
const root = resolve(process.cwd());
execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
const expected = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const receipt = JSON.parse(readFileSync(resolve(root, 'dist/site/release.json'), 'utf8'));
assert.equal(receipt.sourceCommit, expected);
assert.equal(receipt.sourceDirty, false, 'a clean-clone release must record a clean source tree');
assert.ok(Object.keys(receipt.artifacts).length >= 10, 'the receipt must cover the deployed static files');
for (const [path, digest] of Object.entries(receipt.artifacts)) {
  const contents = readFileSync(resolve(root, 'dist/site', path.slice(1)));
  assert.equal(createHash('sha256').update(contents).digest('hex'), digest, path);
}
const api = JSON.parse(readFileSync(resolve(root, 'api/release.json'), 'utf8'));
assert.equal(api.sourceCommit, expected);
assert.equal(api.sourceDirty, false);
