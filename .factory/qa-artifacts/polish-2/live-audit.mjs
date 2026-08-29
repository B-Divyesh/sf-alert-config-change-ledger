import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const base = 'https://alert-config-change-ledger.sociobot.in';
const out = '.factory/qa-artifacts/polish-2/live';
const expectedMetadata = {
  '/': ['Alert Config Ledger — compare alert routes', 'Compare reviewed and live alert routes, then show recipient, severity, and route changes.', `${base}/`],
  '/demo': ['Demo — Alert Config Ledger', 'Review three sample alert route changes in an isolated browser demo.', `${base}/demo`],
  '/privacy': ['Privacy — Alert Config Ledger', 'Learn how Alert Config Ledger keeps alert configuration, demo data, and license data separate.', `${base}/privacy`],
  '/terms': ['Terms — Alert Config Ledger', 'Read the terms for the open-source Alert Config Ledger CLI and optional Pro license.', `${base}/terms`],
};
const evidence = { base, checkedAt: new Date().toISOString(), routes: {}, consoleErrors: [] };
const browser = await chromium.launch({ headless: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspectRoute(context, path, expectedStatus, metadata) {
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  const result = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
    twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
    lang: document.documentElement.lang,
    h1Count: document.querySelectorAll('h1').length,
    h1: document.querySelector('h1')?.textContent?.trim(),
    mainCount: document.querySelectorAll('main').length,
    missingAlt: [...document.querySelectorAll('img')].filter((image) => !image.hasAttribute('alt')).length,
  }));
  result.status = response?.status();
  result.axeSeriousCritical = axe.violations
    .filter((item) => ['serious', 'critical'].includes(item.impact || ''))
    .map((item) => item.id);
  result.consoleErrors = errors;
  evidence.routes[path] = result;
  assert(result.status === expectedStatus, `${path} returned ${result.status}`);
  assert(result.lang === 'en' && result.h1Count === 1 && result.mainCount === 1, `${path} structure failed`);
  assert(result.missingAlt === 0, `${path} has an image without alt text`);
  assert(result.axeSeriousCritical.length === 0, `${path} has serious/critical Axe findings`);
  const onlyExpected404 = expectedStatus === 404
    && errors.every((message) => /404|failed to load resource/i.test(message));
  assert(errors.length === 0 || onlyExpected404, `${path} logged unexpected console errors`);
  if (metadata) {
    const [title, description, canonical] = metadata;
    assert(result.title === title, `${path} title differs`);
    assert(result.description === description, `${path} description differs`);
    assert(result.canonical === canonical, `${path} canonical differs`);
    assert(result.ogTitle === title && result.twitterTitle === title, `${path} social title differs`);
    assert(result.ogDescription === description && result.twitterDescription === description, `${path} social description differs`);
  }
  await page.close();
}

try {
  const routeContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  for (const [path, metadata] of Object.entries(expectedMetadata)) await inspectRoute(routeContext, path, 200, metadata);
  await inspectRoute(routeContext, '/404.html', 200);
  await inspectRoute(routeContext, '/missing-ledger-page', 404);

  const landing = await routeContext.newPage();
  await landing.goto(`${base}/`, { waitUntil: 'networkidle' });
  const required = [
    'Compare reviewed and live alert routes',
    'For platform teams who need to prove whether live alert routes match the reviewed baseline.',
    'Try it with sample data',
    'Loads three sample route changes in an isolated demo.',
    'Runs offline after the first visit.',
    'Recipient endpoints stay redacted.',
    'Core CLI needs no license.',
  ];
  evidence.firstScreen = {};
  for (const text of required) {
    const box = await landing.getByText(text, { exact: true }).boundingBox();
    evidence.firstScreen[text] = box;
    assert(box && box.y >= 0 && box.y + box.height <= 768, `first-screen text is below the fold: ${text}`);
  }
  const body = await landing.locator('body').innerText();
  for (const removed of ['Trace every alert route change', 'tape 01', 'Baseline on reel A', 'Live state on reel B', 'Playback / actual command', 'See drift before the handoff', 'A / B / source', 'Side A / install', 'Write protect / on', 'Side B / optional', 'Snapshot exports', 'Normalize routes', 'Compare sources']) {
    assert(!body.includes(removed), `removed review copy returned: ${removed}`);
  }
  await landing.screenshot({ path: `${out}/landing-desktop-1366x768.png`, fullPage: false });

  await landing.keyboard.press('Tab');
  evidence.keyboard = {
    firstFocus: await landing.evaluate(() => document.activeElement?.textContent?.trim()),
    firstOutline: await landing.evaluate(() => getComputedStyle(document.activeElement).outline),
  };
  assert(evidence.keyboard.firstFocus === 'Skip to main content', 'skip link was not first');
  await landing.keyboard.press('Enter');
  assert(await landing.evaluate(() => document.activeElement?.id) === 'main', 'skip link did not focus main');
  await landing.getByRole('link', { name: 'Privacy' }).first().click();
  assert(await landing.title() === expectedMetadata['/privacy'][0], 'privacy title did not update');
  assert(await landing.locator('h1').evaluate((node) => node === document.activeElement), 'route heading did not receive focus');
  await landing.goBack();
  assert(new URL(landing.url()).pathname === '/', 'back navigation did not restore home');

  const hrefs = await landing.locator('a[href]').evaluateAll((links) => [...new Set(links.map((link) => link.href).filter((href) => href.startsWith('http')))]);
  evidence.links = [];
  for (const href of hrefs) {
    const response = await routeContext.request.get(href);
    evidence.links.push({ href, status: response.status() });
    assert(response.status() < 400, `dead link ${href}: ${response.status()}`);
  }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${base}/`, { waitUntil: 'networkidle' });
  evidence.mobileFirstScreen = { overflow: await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
  assert(evidence.mobileFirstScreen.overflow <= 0, 'landing overflows at 390px');
  for (const text of required) {
    const box = await mobile.getByText(text, { exact: true }).boundingBox();
    assert(box && box.y + box.height <= 844, `mobile first-screen text is below the fold: ${text}`);
  }
  await mobile.screenshot({ path: `${out}/landing-mobile-390x844.png`, fullPage: false });
  await mobile.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  evidence.mobileFirstScreen.text200Overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(evidence.mobileFirstScreen.text200Overflow <= 0, 'landing overflows at 200% text');

  const demoContext = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const demo = await demoContext.newPage();
  const requests = [];
  demo.on('request', (request) => requests.push(request.url()));
  await demo.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await demo.screenshot({ path: `${out}/demo-mobile-390x844.png`, fullPage: false });
  assert(await demo.title() === expectedMetadata['/demo'][0], '?demo=1 did not enter demo metadata');
  await demo.getByText('Demo — sample data, nothing is saved').waitFor();
  await demo.getByText('3 changed · 2 matched').waitFor();
  await demo.evaluate(() => {
    localStorage.setItem('demo:alert-config-ledger:extra', 'sample-only');
    localStorage.setItem('real-mode-sentinel', 'keep');
  });
  const downloadPromise = demo.waitForEvent('download');
  await demo.getByRole('button', { name: 'Download sample report' }).click();
  const stream = await (await downloadPromise).createReadStream();
  let downloaded = '';
  for await (const chunk of stream) downloaded += chunk.toString();
  const report = JSON.parse(downloaded);
  assert(report.changes.length === 3, 'sample report did not contain three changes');
  assert(report.changes.every((change) => change.attributed_to.captured_at === report.live.captured_at), 'sample report change lacked live timestamp');
  await demo.getByRole('button', { name: 'Clear comparison' }).click();
  await demo.getByRole('heading', { name: 'No comparison is loaded' }).waitFor();
  await demo.getByRole('button', { name: 'Reset demo' }).last().click();
  await demo.getByText('3 changed · 2 matched').waitFor();
  evidence.demo = {
    path: new URL(demo.url()).pathname,
    query: new URL(demo.url()).search,
    storageKeys: await demo.evaluate(() => Object.keys(localStorage).sort()),
    crossOriginRequests: requests.filter((url) => new URL(url).origin !== new URL(base).origin),
    changes: report.changes.length,
  };
  assert(evidence.demo.crossOriginRequests.length === 0, 'demo made a cross-origin request');
  assert(evidence.demo.storageKeys.filter((key) => key !== 'real-mode-sentinel').every((key) => key.startsWith('demo:alert-config-ledger:')), 'demo used real storage');
  await demo.getByRole('button', { name: 'Install the CLI' }).click();
  evidence.demo.exit = await demo.evaluate(() => ({
    url: location.href,
    demoKeys: Object.keys(localStorage).filter((key) => key.startsWith('demo:alert-config-ledger:')),
    sentinel: localStorage.getItem('real-mode-sentinel'),
  }));
  assert(evidence.demo.exit.url === `${base}/#install`, 'demo exit did not lead to install');
  assert(evidence.demo.exit.demoKeys.length === 0 && evidence.demo.exit.sentinel === 'keep', 'demo exit did not isolate storage');

  const controls = await demoContext.newPage();
  await controls.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  evidence.touchTargetsBelow44 = await controls.locator('a[href], button, input:not([type="hidden"])').evaluateAll((items) => items
    .filter((item) => { const box = item.getBoundingClientRect(); return box.width > 0 && box.height > 0; })
    .map((item) => { const box = item.getBoundingClientRect(); return { label: item.textContent?.trim(), width: box.width, height: box.height }; })
    .filter((item) => item.width < 44 || item.height < 44));
  assert(evidence.touchTargetsBelow44.length === 0, 'demo has a touch target below 44px');

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offline = await offlineContext.newPage();
  await offline.goto(`${base}/demo`);
  evidence.offline = { worker: await offline.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL) };
  await offline.reload();
  await offlineContext.setOffline(true);
  await offline.reload({ waitUntil: 'domcontentloaded' });
  evidence.offline.notice = await offline.getByText('You are offline. The bundled demo still works.').textContent();
  evidence.offline.summary = await offline.getByText('3 changed · 2 matched').textContent();
  await offline.screenshot({ path: `${out}/demo-mobile-offline.png`, fullPage: false });
  await offlineContext.setOffline(false);

  const reducedContext = await browser.newContext({ reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  await reduced.goto(`${base}/demo`);
  evidence.reducedMotion = await reduced.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    reelDuration: getComputedStyle(document.querySelector('.reel')).animationDuration,
    reelIterations: getComputedStyle(document.querySelector('.reel')).animationIterationCount,
  }));
  assert(evidence.reducedMotion.scrollBehavior === 'auto' && evidence.reducedMotion.reelIterations === '1', 'reduced motion is not respected');

  evidence.result = 'PASS';
  await writeFile(`${out}/live-audit.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
