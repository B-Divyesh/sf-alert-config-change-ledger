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

test('mobile header links meet the 44px touch target baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const link of [
    page.getByRole('link', { name: 'Alert Config Ledger home' }),
    page.getByRole('link', { name: 'Demo', exact: true }),
  ]) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
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
  const simplify = (items: Array<{ route: string; fields: string[] | string }>) => items
    .map((item) => ({ route: item.route, fields: Array.isArray(item.fields) ? item.fields.join(', ') : item.fields }))
    .sort((a, b) => a.route.localeCompare(b.route));
  expect(web.matched_routes).toBe(cli.report.matched_routes);
  expect(simplify(web.changes)).toEqual(simplify(cli.report.changes));
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
  let approvalAuthorization = '';
  await page.route('https://api.sociobot.in/**', async (route) => {
    verifyRequest = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.route('**/api/approval-pack', async (route) => {
    approvalAuthorization = route.request().headers().authorization || '';
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
  expect(approvalAuthorization).toBe('Bearer test-license-token');
});

test('unlicensed browsers have no paid-content URL or download action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Download approval report pack' })).toHaveCount(0);
  await expect(page.locator('a[href="/approval-report-template.md"]')).toHaveCount(0);
  expect(existsSync(resolve('site/public/approval-report-template.md'))).toBe(false);
});
