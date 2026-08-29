import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('landing has the required structure and no serious accessibility issues', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Alert Config Ledger — trace alert route changes');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trace every alert route change');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('all routes have no serious accessibility issues or console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-tape', '/404.html']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')), path).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('keyboard users can skip navigation, open the demo, and select a route', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('link', { name: 'Demo', exact: true }).focus();
  const outline = await page.getByRole('link', { name: 'Demo', exact: true }).evaluate((node) => getComputedStyle(node).outlineWidth);
  expect(outline).toBe('3px');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/demo');
  const route = page.getByRole('button', { name: /service = checkout/ });
  await route.focus();
  await page.keyboard.press('Space');
  await expect(route).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Severity changed' })).toBeVisible();
});

test('routing updates the title and focuses the page heading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page).toHaveURL('/privacy');
  await expect(page).toHaveTitle('Privacy — Alert Config Ledger');
  await expect(page.locator('h1')).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('/');
});

test('demo supports selection, empty state, and reset', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /service = checkout/ }).click();
  await expect(page.getByRole('heading', { name: 'Severity changed' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear comparison' }).click();
  await expect(page.getByRole('heading', { name: 'No comparison is loaded' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).last().click();
  await expect(page.getByText('3 changed · 2 matched')).toBeVisible();
});

test('unknown routes show the designed 404 page', async ({ page }) => {
  await page.goto('/missing-tape');
  await expect(page).toHaveTitle('Page not found — Alert Config Ledger');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This route is not in the ledger');
  await expect(page.getByRole('link', { name: 'Return to the ledger' })).toBeVisible();
});

test('390px layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
});

test('primary demo action is fully visible on common desktop first screens', async ({ page }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const box = await page.getByRole('link', { name: 'Try it with sample data' }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('mobile pages reflow at 200% text without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/missing-tape', '/404.html']) {
    await page.goto(path);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(sizes.scroll, `${path} should reflow at 200% text`).toBeLessThanOrEqual(sizes.client);
  }
});

test('every mobile interactive element meets the 44px touch target baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-tape', '/404.html']) {
    await page.goto(path);
    const controls = page.locator([
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'summary',
      '[role="button"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', '));

    for (let index = 0; index < await controls.count(); index += 1) {
      const control = controls.nth(index);
      if (!await control.isVisible()) continue;
      const box = await control.boundingBox();
      const label = (await control.getAttribute('aria-label'))
        || (await control.textContent())?.trim().replace(/\s+/g, ' ')
        || await control.getAttribute('name')
        || `control ${index + 1}`;
      expect(box, `${path}: ${label}`).not.toBeNull();
      expect(box!.width, `${path}: ${label} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${path}: ${label} height`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('deployment policy returns a designed 404 and revalidates mutable art', () => {
  const config = JSON.parse(readFileSync(resolve('site/public/staticwebapp.config.json'), 'utf8'));
  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' });
  expect(existsSync(resolve('site/public/404.html'))).toBe(true);
  const art = config.routes.find((route: { route: string }) => route.route === '/*.webp');
  expect(art.headers['Cache-Control']).not.toContain('immutable');
  expect(art.headers['Cache-Control']).toContain('must-revalidate');

  const notFound = readFileSync(resolve('site/public/404.html'), 'utf8');
  for (const metadata of [
    'name="description"',
    'rel="canonical"',
    'rel="apple-touch-icon"',
    'property="og:title"',
    'property="og:description"',
    'property="og:image"',
    'name="twitter:card"',
    'name="twitter:title"',
    'name="twitter:description"',
    'name="twitter:image"',
  ]) expect(notFound).toContain(metadata);
});

test('mobile wordmark accessible name contains its visible ACL label', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: /^ACL$/ })).toBeVisible();
  await page.goto('/404.html');
  await expect(page.getByRole('link', { name: /^ACL$/ })).toBeVisible();
});

test('publishable crate excludes Node dependency files', () => {
  const files = execFileSync('cargo', ['package', '--allow-dirty', '--list'], { encoding: 'utf8' }).trim().split('\n');
  expect(files.some((file) => file.includes('node_modules/'))).toBe(false);
});

test('production deployment configuration always ships the approval-pack API', () => {
  const deploy = JSON.parse(readFileSync(resolve('swa-cli.config.json'), 'utf8')).configurations.production;
  const config = JSON.parse(readFileSync(resolve('site/public/staticwebapp.config.json'), 'utf8'));
  expect(deploy).toMatchObject({
    appLocation: '.',
    outputLocation: 'dist/site',
    apiLocation: 'api',
    swaConfigLocation: 'dist/site',
    apiLanguage: 'node',
    apiVersion: '20',
    appName: 'sf-alert-config-change-ledger',
    resourceGroup: 'sociobot',
  });
  expect(config.platform).toEqual({ apiRuntime: 'node:20' });
  expect(existsSync(resolve('api/approval-pack/function.json'))).toBe(true);
  expect(readFileSync(resolve('api/approval-pack/function.json'), 'utf8')).toContain('"route": "approval-pack"');
});

test('README token guidance makes no shell-history promise', () => {
  const readme = readFileSync(resolve('README.md'), 'utf8');
  expect(readme).not.toMatch(/does not enter shell history/i);
  expect(readme).toContain('API tokens are read from the environment and are not written to snapshots.');
});

test('sample demo shows attributable drift', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('3 changed · 2 matched')).toBeVisible();
  await expect(page.getByText('grafana:production #live-1842')).toBeVisible();
  await expect(page.getByRole('button', { name: /team = security/ })).toContainText('Route added');
});

test('@claim:demo-privacy demo stays same-origin and isolated', async ({ page }) => {
  const crossOrigin: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') crossOrigin.push(request.url());
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: /team = payments/ }).click();
  expect(crossOrigin).toEqual([]);
  expect(await page.locator('body').textContent()).not.toContain('@example.test');
  expect(await page.locator('body').textContent()).not.toContain('hooks.example.test');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual([expect.stringMatching(/^demo:alert-config-ledger:/)]);
});

test('@claim:demo-exit-clears-state leaving the demo removes only demo state', async ({ page }) => {
  await page.goto('/demo');
  const initialKeys = await page.evaluate(() => {
    localStorage.setItem('demo:alert-config-ledger:extra', 'sample-only');
    localStorage.setItem('sb_license_verdict:alert-config-change-ledger', '{"valid":true}');
    return Object.keys(localStorage).sort();
  });
  expect(initialKeys).toEqual([
    'demo:alert-config-ledger:extra',
    'demo:alert-config-ledger:state',
    'sb_license_verdict:alert-config-change-ledger',
  ]);

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/#install');
  const storage = await page.evaluate(() => ({
    demoKeys: Object.keys(localStorage).filter((key) => key.startsWith('demo:alert-config-ledger:')),
    realVerdict: localStorage.getItem('sb_license_verdict:alert-config-change-ledger'),
  }));
  expect(storage.demoKeys).toEqual([]);
  expect(storage.realVerdict).toBe('{"valid":true}');
});

test('@claim:report-download exports the sample report', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample report' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('alert-ledger-sample-report.json');
  const stream = await download.createReadStream();
  let content = '';
  for await (const chunk of stream!) content += chunk.toString();
  expect(JSON.parse(content).changes).toHaveLength(3);
});

test('@claim:web-cli-parity web demo reports the CLI sample comparison', async ({ page }) => {
  const cli = JSON.parse(execFileSync(resolve('target/debug/alert-ledger'), ['demo', '--json'], { encoding: 'utf8' }));
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample report' }).click();
  const stream = await (await downloadPromise).createReadStream();
  let content = '';
  for await (const chunk of stream!) content += chunk.toString();
  const web = JSON.parse(content);
  expect(web).toEqual(cli.report);
});

test('public install instructions include a usable source acquisition step', async ({ page }) => {
  await page.goto('/#install');
  const source = page.getByRole('link', { name: /Get the source on GitHub/ });
  await expect(source).toHaveAttribute('href', 'https://github.com/B-Divyesh/sf-alert-config-change-ledger');
  await expect(page.locator('.command-block code')).toContainText('git clone https://github.com/B-Divyesh/sf-alert-config-change-ledger.git');
});

test('@claim:offline-reload bundled demo reloads offline', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('You are offline. The bundled demo still works.')).toBeVisible();
  await expect(page.getByText('3 changed · 2 matched')).toBeVisible();
  await context.setOffline(false);
});

test('@claim:paid-template valid licenses reveal the report pack', async ({ page }) => {
  let verifyRequest = '';
  let approvalLicense = '';
  await page.route('https://api.sociobot.in/**', async (route) => {
    verifyRequest = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.route('**/api/approval-pack', async (route) => {
    approvalLicense = route.request().headers()['x-alert-ledger-license'] || '';
    await route.fulfill({ status: 200, contentType: 'text/markdown', body: '# Alert route approval\n' });
  });
  await page.goto('/');
  await page.getByLabel('Have a license? Paste it').fill('test-license-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('License active.')).toBeVisible();
  expect(verifyRequest).toContain(`/products/alert-config-change-ledger/verify?license=test-license-token`);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download approval report pack' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('alert-ledger-approval-template.md');
  expect(approvalLicense).toBe('test-license-token');
});

test('@claim:sales-closed unlicensed browsers have no checkout or paid-content action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Download approval report pack' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Buy Pro/ })).toHaveCount(0);
  await expect(page.getByText('New license sales are not open in this release.')).toHaveCount(2);
  await expect(page.locator('a[href="/approval-report-template.md"]')).toHaveCount(0);
  expect(existsSync(resolve('site/public/approval-report-template.md'))).toBe(false);
});
