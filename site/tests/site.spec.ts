import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing has the required structure and no serious accessibility issues', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Alert Config Ledger — trace alert route changes');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trace every alert route change');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
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
  await page.route('https://api.sociobot.in/**', async (route) => {
    verifyRequest = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.goto('/');
  await page.getByLabel('Have a license? Paste it').fill('test-license-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('License active.')).toBeVisible();
  expect(verifyRequest).toContain(`/products/alert-config-change-ledger/verify?license=test-license-token`);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download approval report pack' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('alert-ledger-approval-template.md');
});
