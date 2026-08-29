import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repository = resolve(process.cwd());
const temporaryRoot = mkdtempSync(join(tmpdir(), 'alert-ledger-clean-claims-'));
const clone = join(temporaryRoot, 'repo');

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: clone,
    encoding: capture ? 'utf8' : undefined,
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (capture) {
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
  }
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`);
  return result;
}

try {
  run('git', ['clone', '--no-local', '--depth', '1', repository, clone]);
  assert.equal(existsSync(join(clone, 'node_modules')), false, 'the cloned checkout must start without root dependencies');
  assert.equal(existsSync(join(clone, 'api/node_modules')), false, 'the cloned checkout must start without API dependencies');

  const claims = JSON.parse(readFileSync(join(clone, '.factory/claims.json'), 'utf8'));
  let firstNpmClaim = true;

  for (const claim of claims) {
    // This runner is the clean-claim-bootstrap command itself. Running it
    // again inside its clean clone would recurse forever, so this invocation
    // accounts for that one ledger entry and runs every other command once.
    if (claim.id === 'clean-claim-bootstrap') continue;
    const [command, ...args] = claim.test.split(' ');
    console.log(`\n@claim:${claim.id} — ${claim.test}`);
    const result = run(command, args, { capture: firstNpmClaim && command === 'npm' });
    if (firstNpmClaim && command === 'npm') {
      assert.match(result.stdout || '', /Bootstrapping site test dependencies from package-lock\.json/);
      assert.match(result.stdout || '', /Bootstrapping API test dependencies from api\/package-lock\.json/);
      assert.equal(existsSync(join(clone, 'node_modules/@playwright/test/package.json')), true);
      assert.equal(existsSync(join(clone, 'api/node_modules/@azure/data-tables/package.json')), true);
      firstNpmClaim = false;
    }
  }

  assert.equal(firstNpmClaim, false, 'the claims ledger must include an npm browser claim');
  console.log('\nClean-clone claim regression passed: every ledger command ran once.');
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
