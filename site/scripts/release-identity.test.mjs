import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { verifyCandidateSource } from './release-identity.mjs';

function git(directory, args) {
  return execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
}

async function repositoryFixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'alert-ledger-release-'));
  const remote = resolve(root, 'remote.git');
  const checkout = resolve(root, 'checkout');
  execFileSync('git', ['init', '--bare', remote]);
  execFileSync('git', ['init', '-b', 'main', checkout]);
  git(checkout, ['config', 'user.name', 'Release test']);
  git(checkout, ['config', 'user.email', 'release-test@example.invalid']);
  await writeFile(resolve(checkout, 'artifact.txt'), 'candidate\n');
  git(checkout, ['add', 'artifact.txt']);
  git(checkout, ['commit', '-m', 'candidate']);
  git(checkout, ['remote', 'add', 'origin', remote]);
  git(checkout, ['push', '-u', 'origin', 'main']);
  return { root, checkout, candidate: git(checkout, ['rev-parse', 'HEAD']) };
}

test('release identity accepts the exact checked-out candidate published on main', async (t) => {
  const fixture = await repositoryFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  assert.deepEqual(verifyCandidateSource(fixture.candidate, fixture.checkout), {
    expected: fixture.candidate,
    head: fixture.candidate,
    remoteCommit: fixture.candidate,
  });
});

test('release identity rejects a one-character candidate transcription error', async (t) => {
  const fixture = await repositoryFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const replacement = fixture.candidate.endsWith('0') ? '1' : '0';
  const nonexistent = `${fixture.candidate.slice(0, -1)}${replacement}`;
  assert.throws(
    () => verifyCandidateSource(nonexistent, fixture.checkout),
    new RegExp(`candidate ${nonexistent} is not a commit in this checkout`),
  );
});

test('release identity rejects a local commit that is not the remote candidate', async (t) => {
  const fixture = await repositoryFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  await writeFile(resolve(fixture.checkout, 'artifact.txt'), 'unpublished candidate\n');
  git(fixture.checkout, ['add', 'artifact.txt']);
  git(fixture.checkout, ['commit', '-m', 'unpublished']);
  const unpublished = git(fixture.checkout, ['rev-parse', 'HEAD']);
  assert.throws(
    () => verifyCandidateSource(unpublished, fixture.checkout),
    /origin\/main .* does not match candidate/,
  );
});
