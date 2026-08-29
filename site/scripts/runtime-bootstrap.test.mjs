import assert from 'node:assert/strict';
import test from 'node:test';
import { ensureRustToolchain } from './runtime-bootstrap.mjs';

test('minimum runtime bootstrap installs Rust 1.85.0 before checking when it is absent', () => {
  const calls = [];
  const installed = ensureRustToolchain((command, args, options) => {
    calls.push({ command, args, options });
    return '';
  });

  assert.equal(installed, true);
  assert.deepEqual(calls, [
    { command: 'rustup', args: ['toolchain', 'list'], options: { encoding: 'utf8' } },
    { command: 'rustup', args: ['toolchain', 'install', '1.85.0', '--profile', 'minimal'], options: { stdio: 'inherit' } },
  ]);
});

test('minimum runtime bootstrap does not reinstall an available Rust 1.85.0 toolchain', () => {
  const calls = [];
  const installed = ensureRustToolchain((command, args, options) => {
    calls.push({ command, args, options });
    return 'stable-x86_64-unknown-linux-gnu (active, default)\n1.85.0-x86_64-unknown-linux-gnu\n';
  });

  assert.equal(installed, false);
  assert.deepEqual(calls, [
    { command: 'rustup', args: ['toolchain', 'list'], options: { encoding: 'utf8' } },
  ]);
});
