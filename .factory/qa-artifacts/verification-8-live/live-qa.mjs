import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const base = 'https://alert-config-change-ledger.sociobot.in';
const browser = await chromium.launch({ headless: true });
const evidence = { base, checkedAt: new Date().toISOString(), routes: {}, errors: [] };

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.on('console', message => { if (message.type() === 'error') evidence.errors.push(`console: ${message.text()}`); });
page.on('pageerror', error => evidence.errors.push(`pageerror: ${error.message}`));

for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-tape', '/404.html']) {
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  evidence.routes[path] = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    h1Count: document.querySelectorAll('h1').length,
    h1: document.querySelector('h1')?.textContent?.trim(),
    mainCount: document.querySelectorAll('main').length,
    missingAlt: [...document.querySelectorAll('img')].filter(image => !image.hasAttribute('alt')).length,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  evidence.routes[path].status = response?.status();
  evidence.routes[path].axeSeriousCritical = axe.violations
    .filter(item => ['serious', 'critical'].includes(item.impact || ''))
    .map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.length }));
}

await page.goto(`${base}/`);
await page.keyboard.press('Tab');
evidence.keyboard = {
  firstFocus: await page.evaluate(() => document.activeElement?.textContent?.trim()),
  firstOutline: await page.evaluate(() => getComputedStyle(document.activeElement).outline),
};
await page.keyboard.press('Enter');
evidence.keyboard.skipTarget = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id }));
await page.keyboard.press('Tab');
evidence.keyboard.nextFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
evidence.keyboard.nextOutline = await page.evaluate(() => getComputedStyle(document.activeElement).outline);
await page.keyboard.press('Enter');
await page.waitForURL(`${base}/demo`);
const checkout = page.getByRole('button', { name: /service = checkout/ });
await checkout.focus();
await page.keyboard.press('Space');
evidence.keyboard.routePressed = await checkout.getAttribute('aria-pressed');
evidence.keyboard.detailHeading = await page.getByRole('heading', { name: 'Severity changed' }).textContent();

const demoContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const demo = await demoContext.newPage();
const requests = [];
const responses = [];
demo.on('request', request => requests.push({ method: request.method(), url: request.url(), type: request.resourceType() }));
demo.on('response', response => responses.push({ url: response.url(), status: response.status() }));
await demo.goto(`${base}/demo`, { waitUntil: 'networkidle' });
await demo.screenshot({ path: '.factory/qa-artifacts/verification-8-live/demo-desktop.png', fullPage: true });
const downloadPromise = demo.waitForEvent('download');
await demo.getByRole('button', { name: 'Download sample report' }).click();
const download = await downloadPromise;
const stream = await download.createReadStream();
let downloaded = '';
for await (const chunk of stream) downloaded += chunk.toString();
const report = JSON.parse(downloaded);
await demo.getByRole('button', { name: 'Clear comparison' }).click();
const emptyHeading = await demo.getByRole('heading', { name: 'No comparison is loaded' }).textContent();
await demo.getByRole('button', { name: 'Reset demo' }).last().click();
evidence.demo = {
  banner: await demo.getByText('Demo — sample data, nothing is saved').first().textContent(),
  summary: await demo.getByText('3 changed · 2 matched').textContent(),
  emptyHeading,
  downloadName: download.suggestedFilename(),
  downloadedChanges: report.changes.length,
  storageKeys: await demo.evaluate(() => Object.keys(localStorage)),
  requests,
  responses,
  crossOriginRequests: requests.filter(item => new URL(item.url).origin !== new URL(base).origin),
  plaintextContactHits: (downloaded.match(/@example|hooks\.|pagerduty\.com/gi) || []).length,
};

const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const offlinePage = await offlineContext.newPage();
await offlinePage.goto(`${base}/demo`);
evidence.offline = {};
evidence.offline.worker = await offlinePage.evaluate(async () => {
  const registration = await navigator.serviceWorker.ready;
  await registration.update();
  return registration.active?.scriptURL;
});
await offlinePage.reload();
await offlineContext.setOffline(true);
await offlinePage.reload({ waitUntil: 'domcontentloaded' });
evidence.offline.message = await offlinePage.getByText('You are offline. The bundled demo still works.').textContent();
evidence.offline.summary = await offlinePage.getByText('3 changed · 2 matched').textContent();
await offlinePage.screenshot({ path: '.factory/qa-artifacts/verification-8-live/demo-mobile-offline.png', fullPage: true });
await offlineContext.setOffline(false);

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobile = await mobileContext.newPage();
await mobile.goto(`${base}/demo`, { waitUntil: 'networkidle' });
await mobile.screenshot({ path: '.factory/qa-artifacts/verification-8-live/demo-mobile.png', fullPage: true });
evidence.mobile = await mobile.evaluate(() => {
  const controls = [...document.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"],[tabindex]:not([tabindex="-1"])')]
    .filter(element => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    })
    .map(element => {
      const box = element.getBoundingClientRect();
      return { label: element.getAttribute('aria-label') || element.textContent?.trim().replace(/\s+/g, ' '), width: box.width, height: box.height };
    });
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    controlsBelow44: controls.filter(item => item.width < 44 || item.height < 44),
  };
});
await mobile.goto(`${base}/`);
await mobile.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
evidence.mobile.text200 = await mobile.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));

const reducedContext = await browser.newContext({ reducedMotion: 'reduce' });
const reduced = await reducedContext.newPage();
await reduced.goto(`${base}/demo`);
evidence.reducedMotion = await reduced.evaluate(() => ({
  scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  reelDuration: getComputedStyle(document.querySelector('.reel')).animationDuration,
  reelIterations: getComputedStyle(document.querySelector('.reel')).animationIterationCount,
}));

await writeFile('.factory/qa-artifacts/verification-8-live/live-qa.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
await browser.close();
