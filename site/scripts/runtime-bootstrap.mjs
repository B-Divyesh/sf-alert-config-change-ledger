export const RUST_TOOLCHAIN = '1.85.0';

function hasToolchain(list, toolchain) {
  return list.split(/\r?\n/).some((line) => line.trim().startsWith(`${toolchain}-`));
}

/**
 * Install the declared minimum Rust version only when the host does not
 * already provide it. `run` is injected so this policy has a direct
 * regression test without downloading a toolchain.
 */
export function ensureRustToolchain(run, toolchain = RUST_TOOLCHAIN) {
  const installed = run('rustup', ['toolchain', 'list'], { encoding: 'utf8' });
  if (hasToolchain(installed, toolchain)) return false;
  run('rustup', ['toolchain', 'install', toolchain, '--profile', 'minimal'], { stdio: 'inherit' });
  return true;
}
