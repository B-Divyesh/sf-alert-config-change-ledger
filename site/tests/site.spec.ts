import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('landing has the required structure and no serious accessibility issues', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Alert Config Ledger — compare alert routes');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compare reviewed and live alert routes');
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

test('browser Back and Forward restore focused controls and scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => {
    const scroller = document.scrollingElement!;
    scroller.scrollTop = scroller.scrollHeight;
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(4_000);
  const footerPrivacy = page.locator('footer').getByRole('link', { name: 'Privacy' });
  await footerPrivacy.evaluate((element: HTMLElement) => element.focus({ preventScroll: true }));

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(footerPrivacy).toBeFocused();
  const restoredScroll = await page.evaluate(() => window.scrollY);
  expect(restoredScroll).toBeGreaterThan(400);
  const footerBox = await footerPrivacy.boundingBox();
  expect(footerBox).not.toBeNull();
  expect(footerBox!.y).toBeGreaterThanOrEqual(0);
  expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(844);

  await page.goForward();
  await expect(page).toHaveURL('/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(2);
});

test('each route sets route-specific metadata', async ({ page }) => {
  const expected = {
    '/': ['Alert Config Ledger — compare alert routes', 'Compare reviewed and live alert routes, then show recipient, severity, and route changes.', 'https://alert-config-change-ledger.sociobot.in/'],
    '/demo': ['Demo — Alert Config Ledger', 'Review three sample alert route changes in an isolated browser demo.', 'https://alert-config-change-ledger.sociobot.in/demo'],
    '/privacy': ['Privacy — Alert Config Ledger', 'Learn how Alert Config Ledger keeps alert configuration, demo data, and license data separate.', 'https://alert-config-change-ledger.sociobot.in/privacy'],
    '/terms': ['Terms — Alert Config Ledger', 'Read the terms for the open-source Alert Config Ledger CLI and optional Pro license.', 'https://alert-config-change-ledger.sociobot.in/terms'],
  } as const;
  for (const [path, [title, description, canonical]] of Object.entries(expected)) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
  }
});

test('reduced motion removes scrolling and reel movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  const styles = await page.evaluate(() => {
    const reel = document.querySelector<HTMLElement>('.reel')!;
    return {
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      animationDuration: getComputedStyle(reel).animationDuration,
      animationIterations: getComputedStyle(reel).animationIterationCount,
    };
  });
  expect(styles.scrollBehavior).toBe('auto');
  expect(Number.parseFloat(styles.animationDuration)).toBeLessThanOrEqual(0.00001);
  expect(styles.animationIterations).toBe('1');
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

test('keyboard demo clear and reset keep focus and announce the new state', async ({ page }) => {
  await page.goto('/demo');
  const clear = page.getByRole('button', { name: 'Clear comparison' });
  await clear.focus();
  await page.keyboard.press('Space');

  const emptyHeading = page.getByRole('heading', { name: 'No comparison is loaded' });
  await expect(emptyHeading).toBeFocused();
  await expect(emptyHeading).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#route-status')).toHaveText('Comparison cleared. No comparison is loaded. Reset demo to load the baseline and live snapshots.');

  const reset = page.getByRole('button', { name: 'Reset demo' }).last();
  await reset.focus();
  await page.keyboard.press('Space');
  const ledgerHeading = page.getByRole('heading', { name: 'Changed routes' });
  await expect(ledgerHeading).toBeFocused();
  await expect(ledgerHeading).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#route-status')).toHaveText('Demo reset. Three changed routes and two matched routes are loaded.');
});

test('unknown routes show the designed 404 page', async ({ page }) => {
  await page.goto('/missing-tape');
  await expect(page).toHaveTitle('Page not found — Alert Config Ledger');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page was not found');
  await expect(page.getByRole('link', { name: 'Return to the home page' })).toBeVisible();
});

test('390px layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
});

test('first screen includes the action and all three facts on common desktop viewports', async ({ page }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const box = await page.getByRole('link', { name: 'Try it with sample data' }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    for (const fact of ['Runs offline after the first visit.', 'Recipient endpoints stay redacted.', 'Core CLI needs no license.']) {
      const factBox = await page.getByText(fact, { exact: true }).boundingBox();
      expect(factBox, fact).not.toBeNull();
      expect(factBox!.y + factBox!.height, fact).toBeLessThanOrEqual(viewport.height);
    }
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
  const release = config.routes.find((route: { route: string }) => route.route === '/release.json');
  expect(release.headers['Cache-Control']).toBe('no-store');

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

test('@claim:deployment-shape production deployment configuration ships the site and approval-pack API', () => {
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

test('@claim:demo-exit-clears-state Start for real leaves the demo and removes only demo state', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Alert Config Ledger');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
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
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
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
  const serviceWorker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return registration.active?.scriptURL;
  });
  expect(serviceWorker).toBe('http://127.0.0.1:4173/sw.js');
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
  await page.getByRole('button', { name: 'Verify license' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByText('License active.')).toBeVisible();
  await expect(page.locator('[data-license-status]')).toHaveAttribute('role', 'status');
  await expect(page.locator('[data-license-status]')).toHaveAttribute('aria-live', 'polite');
  await expect(page.getByRole('button', { name: 'Download approval report pack' })).toBeFocused();
  expect(verifyRequest).toContain(`/products/alert-config-change-ledger/verify?license=test-license-token`);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download approval report pack' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('alert-ledger-approval-template.md');
  expect(approvalLicense).toBe('test-license-token');
});

test('keyboard license verification announces invalid, offline, and service-error results', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', async (route) => {
    const token = new URL(route.request().url()).searchParams.get('license');
    if (token === 'offline-token') {
      await route.abort('internetdisconnected');
      return;
    }
    if (token === 'service-error') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }) });
  });
  await page.goto('/');

  const submit = async (token: string) => {
    await page.getByLabel('Have a license? Paste it').fill(token);
    await page.getByRole('button', { name: 'Verify license' }).focus();
    await page.keyboard.press('Space');
  };
  const expectRecovery = async (message: string) => {
    const panel = page.locator('[data-license-panel]');
    await expect(panel).toHaveAttribute('aria-live', 'polite');
    await expect(panel.locator('[data-license-status]')).toHaveText(message);
    await expect(page.getByLabel('Have a license? Paste it')).toBeFocused();
  };

  await submit('invalid-token');
  await expectRecovery('License no longer active.');

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => Object.defineProperty(navigator, 'onLine', { configurable: true, value: false }));
  await submit('offline-token');
  await expectRecovery('You are offline. Connect and try again.');

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await submit('service-error');
  await expectRecovery('License check could not complete. Try again.');
});

test('@claim:sales-closed unlicensed browsers have no checkout or paid-content action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Download approval report pack' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Buy Pro/ })).toHaveCount(0);
  await expect(page.getByText('New license sales are not open in this release.')).toHaveCount(2);
  await expect(page.locator('a[href="/approval-report-template.md"]')).toHaveCount(0);
  expect(existsSync(resolve('site/public/approval-report-template.md'))).toBe(false);
});
