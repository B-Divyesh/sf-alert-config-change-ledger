import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runNpm(args) {
  const result = spawnSync(npm, args, { cwd: process.cwd(), stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Claim commands are intentionally runnable in a fresh clone before a separate
// dependency-install step. Keep both installs locked and only perform them when
// the dependency needed by the following test command is absent.
if (!existsSync(resolve('node_modules/@playwright/test/package.json'))) {
  console.log('Bootstrapping site test dependencies from package-lock.json…');
  runNpm(['ci', '--ignore-scripts']);
}

if (!existsSync(resolve('api/node_modules/@azure/data-tables/package.json'))) {
  console.log('Bootstrapping API test dependencies from api/package-lock.json…');
  runNpm(['ci', '--prefix', 'api', '--ignore-scripts']);
}
