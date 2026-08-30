import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PRODUCT = 'alert-config-change-ledger';
const PRODUCTION_URL = 'https://alert-config-change-ledger.sociobot.in';

function git(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

async function filesBelow(directory, current = directory) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(current, entry.name);
    const name = relative(directory, path).split(sep).join('/');
    if (
      name === 'release.json'
      || name === 'staticwebapp.config.json'
      || name === '.vite'
      || name.startsWith('.vite/')
    ) continue;
    if (entry.isDirectory()) files.push(...await filesBelow(directory, path));
    else if (entry.isFile()) files.push(name);
  }
  return files.sort();
}

export function readSourceIdentity(root = process.cwd()) {
  const sourceCommit = git(root, ['rev-parse', 'HEAD']);
  assert.match(sourceCommit, /^[0-9a-f]{40}$/, 'HEAD must resolve to a full Git commit SHA');
  const sourceDirty = git(root, ['status', '--porcelain', '--untracked-files=no']).length > 0;
  return { sourceCommit, sourceDirty };
}

export async function writeReleaseIdentity(root = process.cwd()) {
  const site = resolve(root, 'dist/site');
  assert.ok(existsSync(resolve(site, 'index.html')), 'build the site before writing release identity');
  const identity = readSourceIdentity(root);
  const artifacts = {};
  for (const name of await filesBelow(site)) {
    artifacts[`/${name}`] = sha256(await readFile(resolve(site, name)));
  }
  const receipt = {
    schemaVersion: 1,
    product: PRODUCT,
    ...identity,
    artifacts,
  };
  await writeFile(resolve(site, 'release.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  await writeFile(resolve(root, 'api/release.json'), `${JSON.stringify({
    schemaVersion: 1,
    product: PRODUCT,
    ...identity,
  }, null, 2)}\n`);
  return receipt;
}

export function verifyCandidateSource(expected, root = process.cwd(), remote = 'origin') {
  assert.match(expected, /^[0-9a-f]{40}$/, 'candidate must be an exact 40-character lowercase Git SHA');
  try {
    git(root, ['cat-file', '-e', `${expected}^{commit}`]);
  } catch {
    throw new Error(`candidate ${expected} is not a commit in this checkout`);
  }
  const head = git(root, ['rev-parse', 'HEAD']);
  assert.equal(head, expected, `checked-out HEAD ${head} does not match candidate ${expected}`);
  const remoteLine = git(root, ['ls-remote', remote, 'refs/heads/main']);
  const remoteCommit = remoteLine.split(/\s+/)[0] || '';
  assert.equal(remoteCommit, expected, `${remote}/main ${remoteCommit || '(missing)'} does not match candidate ${expected}`);
  const changes = git(root, ['status', '--porcelain', '--untracked-files=no']);
  assert.equal(changes, '', `tracked files must be clean before release verification:\n${changes}`);
  return { expected, head, remoteCommit };
}

async function fetchBytes(url) {
  const response = await fetch(url, { cache: 'no-store' });
  assert.equal(response.status, 200, `${url} returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function verifyLiveRelease(expected, liveUrl = PRODUCTION_URL, root = process.cwd()) {
  verifyCandidateSource(expected, root);
  const localPath = resolve(root, 'dist/site/release.json');
  assert.ok(existsSync(localPath), 'dist/site/release.json is missing; run npm run build first');
  const localBytes = await readFile(localPath);
  const local = JSON.parse(localBytes.toString('utf8'));
  assert.equal(local.sourceCommit, expected, 'local release receipt does not match the candidate');
  assert.equal(local.sourceDirty, false, 'local release receipt was built from a dirty tree');

  const base = new URL(liveUrl);
  const receiptUrl = new URL('/release.json', base);
  receiptUrl.searchParams.set('candidate', expected);
  const liveBytes = await fetchBytes(receiptUrl);
  const live = JSON.parse(liveBytes.toString('utf8'));
  assert.deepEqual(live, local, 'live release receipt differs from the local candidate receipt');

  for (const [path, digest] of Object.entries(local.artifacts)) {
    const localArtifact = await readFile(resolve(root, 'dist/site', path.slice(1)));
    assert.equal(sha256(localArtifact), digest, `local artifact digest differs for ${path}`);
    const artifactUrl = new URL(path, base);
    artifactUrl.searchParams.set('candidate', expected);
    assert.equal(sha256(await fetchBytes(artifactUrl)), digest, `live artifact digest differs for ${path}`);
  }

  const apiUrl = new URL('/api/approval-pack', base);
  const apiResponse = await fetch(apiUrl, { method: 'POST', cache: 'no-store' });
  assert.equal(
    apiResponse.headers.get('x-alert-ledger-build'),
    expected,
    `live approval-pack build identity does not match candidate ${expected}`,
  );
  return { sourceCommit: expected, artifactCount: Object.keys(local.artifacts).length, apiStatus: apiResponse.status };
}

async function main() {
  const [command, expected, liveUrl] = process.argv.slice(2);
  if (command === 'write') {
    const receipt = await writeReleaseIdentity();
    process.stdout.write(`Wrote release identity for ${receipt.sourceCommit}${receipt.sourceDirty ? ' (dirty)' : ''}.\n`);
    return;
  }
  if (command === 'verify') {
    assert.ok(expected, 'usage: release-identity.mjs verify <full-candidate-sha> [live-url]');
    const result = await verifyLiveRelease(expected, liveUrl);
    process.stdout.write(`Verified ${result.sourceCommit}: ${result.artifactCount} static artifacts and API status ${result.apiStatus}.\n`);
    return;
  }
  throw new Error('usage: release-identity.mjs write | verify <full-candidate-sha> [live-url]');
}

if (process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))) {
  await main();
}
