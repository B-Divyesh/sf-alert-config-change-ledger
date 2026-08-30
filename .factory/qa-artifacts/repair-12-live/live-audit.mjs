import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const base = 'https://alert-config-change-ledger.sociobot.in';
const out = '.factory/qa-artifacts/repair-12-live';
const evidence = { checkedAt: new Date().toISOString(), routes: {}, errors: [] };
const browser = await chromium.launch({ headless: true });

async function inspect(path, expectedStatus) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  const result = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    h1: document.querySelectorAll('h1').length,
    main: document.querySelectorAll('main').length,
    missingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
    unlabeledButtons: [...document.querySelectorAll('button')].filter((button) => !(button.textContent || '').trim() && !button.getAttribute('aria-label')).length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  Object.assign(result, {
    status: response?.status(),
    errors,
    seriousCritical: axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')).map((item) => item.id),
  });
  evidence.routes[path] = result;
  assert.equal(result.status, expectedStatus, path);
  assert.equal(result.lang, 'en', path);
  assert.equal(result.h1, 1, path);
  assert.equal(result.main, 1, path);
  assert.equal(result.missingAlt, 0, path);
  assert.equal(result.unlabeledButtons, 0, path);
  assert.equal(result.overflow, 0, path);
  const expected404Resource = expectedStatus === 404
    && result.errors.every((message) => /failed to load resource.*404/i.test(message));
  assert.ok(result.errors.length === 0 || expected404Resource, `${path}: ${result.errors.join('; ')}`);
  assert.deepEqual(result.seriousCritical, [], path);
  await context.close();
}

try {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html']) await inspect(path, 200);
  await inspect('/missing-release-ledger', 404);

  const desktop = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const landing = await desktop.newPage();
  await landing.goto(base, { waitUntil: 'networkidle' });
  await landing.screenshot({ path: `${out}/landing-desktop-1366x768.png` });
  const firstScreen = [
    'Compare reviewed and live alert routes',
    'For platform teams who need to prove whether live alert routes match the reviewed baseline.',
    'Try it with sample data',
    'Runs offline after the first visit.',
    'Recipient endpoints stay redacted.',
    'Core CLI needs no license.',
  ];
  for (const text of firstScreen) {
    const box = await landing.getByText(text, { exact: true }).boundingBox();
    assert.ok(box && box.y >= 0 && box.y + box.height <= 768, `desktop first screen hides: ${text}`);
  }
  await landing.keyboard.press('Tab');
  assert.equal(await landing.evaluate(() => document.activeElement?.textContent?.trim()), 'Skip to main content');
  assert.equal(await landing.evaluate(() => getComputedStyle(document.activeElement).outlineWidth), '3px');
  await landing.keyboard.press('Enter');
  assert.equal(await landing.evaluate(() => document.activeElement?.id), 'main');
  await desktop.close();

  const demoContext = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const demo = await demoContext.newPage();
  const requests = [];
  const demoErrors = [];
  demo.on('request', (request) => requests.push(request.url()));
  demo.on('console', (message) => { if (message.type() === 'error') demoErrors.push(message.text()); });
  demo.on('pageerror', (error) => demoErrors.push(error.message));
  await demo.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await demo.screenshot({ path: `${out}/demo-mobile-390x844.png`, fullPage: true });
  const mobile = await demo.evaluate(() => {
    const controls = [...document.querySelectorAll('a[href],button,input:not([type="hidden"])')]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { label: element.getAttribute('aria-label') || element.textContent?.trim(), width: box.width, height: box.height };
      });
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      controlsBelow44: controls.filter((control) => control.width < 44 || control.height < 44),
      storageKeys: Object.keys(localStorage),
    };
  });
  assert.equal(mobile.overflow, 0);
  assert.deepEqual(mobile.controlsBelow44, []);
  assert.ok(mobile.storageKeys.every((key) => key.startsWith('demo:alert-config-ledger:')));
  assert.deepEqual(requests.filter((url) => new URL(url).origin !== new URL(base).origin), []);

  const clear = demo.getByRole('button', { name: 'Clear comparison' });
  await clear.focus();
  await demo.keyboard.press('Space');
  assert.equal(await demo.evaluate(() => document.activeElement?.id), 'demo-state-title');
  assert.equal(await demo.locator('#route-status').textContent(), 'Comparison cleared. No comparison is loaded. Reset demo to load the baseline and live snapshots.');
  const reset = demo.getByRole('button', { name: 'Reset demo' }).last();
  await reset.focus();
  await demo.keyboard.press('Space');
  assert.equal(await demo.evaluate(() => document.activeElement?.id), 'ledger-title');
  assert.equal(await demo.locator('#route-status').textContent(), 'Demo reset. Three changed routes and two matched routes are loaded.');
  assert.deepEqual(demoErrors, []);

  await demo.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  assert.equal(await demo.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
  evidence.mobile = mobile;
  evidence.demo = {
    requests: requests.length,
    crossOriginRequests: requests.filter((url) => new URL(url).origin !== new URL(base).origin),
    errors: demoErrors,
    keyboardClearTarget: 'demo-state-title',
    keyboardResetTarget: 'ledger-title',
    text200Overflow: 0,
  };
  await demoContext.close();

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offline = await offlineContext.newPage();
  await offline.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  const worker = await offline.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return {
      active: registration.active?.scriptURL,
      installing: registration.installing?.scriptURL || null,
      waiting: registration.waiting?.scriptURL || null,
    };
  });
  await offline.reload();
  await offlineContext.setOffline(true);
  const offlineResponse = await offline.reload({ waitUntil: 'domcontentloaded' });
  evidence.offline = {
    worker,
    status: offlineResponse?.status(),
    notice: await offline.getByText('You are offline. The bundled demo still works.').textContent(),
    summary: await offline.getByText('3 changed · 2 matched').textContent(),
  };
  assert.equal(worker.active, `${base}/sw.js`);
  assert.equal(worker.installing, null);
  assert.equal(worker.waiting, null);
  assert.equal(evidence.offline.status, 200);
  await offline.screenshot({ path: `${out}/demo-mobile-offline.png`, fullPage: true });
  await offlineContext.setOffline(false);
  await offlineContext.close();

  const reducedContext = await browser.newContext({ reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  await reduced.goto(`${base}/demo`);
  evidence.reducedMotion = await reduced.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    reelDuration: getComputedStyle(document.querySelector('.reel')).animationDuration,
    reelIterations: getComputedStyle(document.querySelector('.reel')).animationIterationCount,
  }));
  assert.equal(evidence.reducedMotion.scrollBehavior, 'auto');
  assert.ok(Number.parseFloat(evidence.reducedMotion.reelDuration) <= 0.00001);
  assert.equal(evidence.reducedMotion.reelIterations, '1');
  await reducedContext.close();

  const linksContext = await browser.newContext();
  const links = new Set();
  const linkPage = await linksContext.newPage();
  for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html']) {
    await linkPage.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    for (const href of await linkPage.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => node.href))) links.add(href);
  }
  evidence.links = [];
  for (const href of [...links].sort()) {
    if (href.startsWith('mailto:')) {
      evidence.links.push({ href, status: 'mailto' });
      continue;
    }
    const response = await linksContext.request.get(href);
    evidence.links.push({ href, status: response.status() });
    assert.ok(response.status() < 400, `${href} returned ${response.status()}`);
  }
  await linksContext.close();

  evidence.result = 'PASS';
  await writeFile(`${out}/live-audit.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
