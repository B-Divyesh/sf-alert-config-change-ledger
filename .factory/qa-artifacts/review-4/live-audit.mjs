import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const origin = 'https://alert-config-change-ledger.sociobot.in';
const outDir = '.factory/qa-artifacts/review-4';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { checkedAt: new Date().toISOString(), origin, firstRead: {}, routes: {}, demo: {}, history: {}, links: [] };

for (const [name, viewport] of Object.entries({ mobile: { width: 390, height: 844 }, desktop: { width: 1366, height: 768 } })) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle' });
  const visibleText = await page.locator('body').evaluate((body, height) => {
    const texts = [];
    for (const element of body.querySelectorAll('h1, h2, h3, p, a, button, li, figcaption')) {
      const rect = element.getBoundingClientRect();
      const text = element.textContent?.trim().replace(/\s+/g, ' ');
      if (text && rect.top >= 0 && rect.bottom <= height && getComputedStyle(element).visibility !== 'hidden') texts.push(text);
    }
    return [...new Set(texts)];
  }, viewport.height);
  report.firstRead[name] = {
    title: await page.title(),
    h1: await page.locator('h1').allTextContents(),
    visibleText,
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    clientWidth: await page.evaluate(() => document.documentElement.clientWidth),
    errors,
  };
  await page.screenshot({ path: `${outDir}/live-first-read-${name}.png`, fullPage: false });
  await context.close();
}

for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html', '/review-4-missing']) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  report.routes[path] = {
    status: response?.status(),
    title: await page.title(),
    lang: await page.locator('html').getAttribute('lang'),
    h1: await page.locator('h1').allTextContents(),
    mainCount: await page.locator('main').count(),
    description: await page.locator('meta[name="description"]').getAttribute('content'),
    canonical: await page.locator('link[rel="canonical"]').getAttribute('href'),
    ogTitle: await page.locator('meta[property="og:title"]').getAttribute('content'),
    ogDescription: await page.locator('meta[property="og:description"]').getAttribute('content'),
    favicon: await page.locator('link[rel="icon"]').getAttribute('href'),
    appleTouch: await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'),
    headingOutline: await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll((nodes) => nodes.map((node) => ({ level: Number(node.tagName.slice(1)), text: node.textContent?.trim().replace(/\s+/g, ' ') }))),
    seriousAxe: axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')).map((item) => item.id),
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    clientWidth: await page.evaluate(() => document.documentElement.clientWidth),
    errors,
  };
  if (path === '/') {
    report.landingCopy = await page.locator('header, main, footer').locator('h1,h2,h3,p,a,button,li,figcaption,label,summary').evaluateAll((nodes) => {
      const values = [];
      for (const node of nodes) {
        if (node.closest('[hidden]') || getComputedStyle(node).display === 'none') continue;
        const text = node.textContent?.trim().replace(/\s+/g, ' ');
        if (text && !values.includes(text)) values.push(text);
      }
      return values;
    });
    const hrefs = await page.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent?.trim().replace(/\s+/g, ' '), href: node.href })));
    report.links = hrefs;
  }
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${outDir}/live-demo-mobile.png`, fullPage: false });
  const initial = {
    url: page.url(),
    h1: await page.locator('h1').innerText(),
    banner: await page.locator('.demo-banner').innerText(),
    summary: await page.getByText('3 changed · 2 matched').innerText(),
    keys: await page.evaluate(() => Object.keys(localStorage).sort()),
    crossOriginRequests: requests.filter((url) => new URL(url).origin !== origin),
  };
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample report' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let downloaded = '';
  for await (const chunk of stream) downloaded += chunk.toString();
  const downloadedReport = JSON.parse(downloaded);
  initial.download = { name: download.suggestedFilename(), changes: downloadedReport.changes.length, matchedRoutes: downloadedReport.matched_routes };
  await page.getByRole('button', { name: 'Clear comparison' }).click();
  const empty = await page.locator('main').innerText();
  await page.getByRole('button', { name: 'Reset demo' }).last().click();
  const reset = await page.getByText('3 changed · 2 matched').isVisible();
  await page.evaluate(() => {
    localStorage.setItem('demo:alert-config-ledger:review-4', 'demo-only');
    localStorage.setItem('review-4:real-sentinel', 'untouched');
  });
  const exitLabel = await page.locator('.demo-banner button').last().innerText();
  await page.locator('.demo-banner button').last().click();
  const afterExit = await page.evaluate(() => ({ url: location.href, keys: Object.keys(localStorage).sort(), sentinel: localStorage.getItem('review-4:real-sentinel') }));
  report.demo = { initial, emptyIncludesRecovery: empty.includes('Reset demo to load the sample again.'), reset, exitLabel, afterExit };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${origin}/demo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('demo:alert-config-ledger:review-4', 'demo-only');
    localStorage.setItem('review-4:real-sentinel', 'untouched');
  });
  await page.getByRole('button', { name: 'Start for real' }).click();
  report.demo.startForReal = await page.evaluate(() => ({ url: location.href, keys: Object.keys(localStorage).sort(), sentinel: localStorage.getItem('review-4:real-sentinel'), focused: document.activeElement?.textContent?.trim() }));
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${origin}/demo`, { waitUntil: 'networkidle' });
  const registration = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL);
  await page.reload({ waitUntil: 'networkidle' });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  report.demo.offline = {
    registration,
    notice: await page.getByText('You are offline. The bundled demo still works.').isVisible(),
    sample: await page.getByText('3 changed · 2 matched').isVisible(),
  };
  await context.setOffline(false);
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight; });
  await page.waitForFunction(() => scrollY > 4000);
  const privacy = page.locator('footer').getByRole('link', { name: 'Privacy' });
  await privacy.evaluate((element) => element.focus({ preventScroll: true }));
  const before = { scroll: await page.evaluate(() => scrollY), focused: await page.evaluate(() => document.activeElement?.textContent?.trim()) };
  await page.keyboard.press('Enter');
  await page.waitForURL(`${origin}/privacy`);
  await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
  const privacyFocus = await page.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.textContent?.trim());
  await page.goBack({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.activeElement?.getAttribute('data-history-focus') === 'footer-privacy');
  const back = { scroll: await page.evaluate(() => scrollY), focused: await page.evaluate(() => document.activeElement?.textContent?.trim()) };
  await page.goForward({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
  const forward = { scroll: await page.evaluate(() => scrollY), focused: await page.evaluate(() => document.activeElement?.textContent?.trim()) };
  report.history = { before, privacyFocus, back, forward };
  await context.close();
}

for (const link of report.links.filter((item) => new URL(item.href).origin === origin)) {
  const response = await fetch(link.href, { redirect: 'manual' });
  link.status = response.status;
}

writeFileSync(`${outDir}/live-audit.json`, `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
