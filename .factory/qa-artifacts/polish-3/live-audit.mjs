import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'https://alert-config-change-ledger.sociobot.in';
const out = '.factory/qa-artifacts/polish-3/live';
const metadata = {
  '/': ['Alert Config Ledger — compare alert routes', 'Compare reviewed and live alert routes, then show recipient, severity, and route changes.'],
  '/demo': ['Demo — Alert Config Ledger', 'Review three sample alert route changes in an isolated browser demo.'],
  '/privacy': ['Privacy — Alert Config Ledger', 'Learn how Alert Config Ledger keeps alert configuration, demo data, and license data separate.'],
  '/terms': ['Terms — Alert Config Ledger', 'Read the terms for the open-source Alert Config Ledger CLI and optional Pro license.'],
};
const evidence = { base, checkedAt: new Date().toISOString(), routes: {}, consoleErrors: [], result: 'PASS' };
const requiredFirstScreen = [
  'Compare reviewed and live alert routes',
  'For platform teams who need to prove whether live alert routes match the reviewed baseline.',
  'Try it with sample data',
  'Loads three sample route changes in an isolated demo.',
  'Runs offline after the first visit.',
  'Recipient endpoints stay redacted.',
  'Core CLI needs no license.',
];

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function inspectRoute(context, path, expectedStatus, expected) {
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  const data = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
    lang: document.documentElement.lang,
    h1: document.querySelectorAll('h1').length,
    main: document.querySelectorAll('main').length,
    missingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
  }));
  data.status = response?.status();
  data.consoleErrors = errors;
  data.axeSeriousCritical = axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')).map((item) => item.id);
  evidence.routes[path] = data;
  assert(data.status === expectedStatus, `${path}: expected ${expectedStatus}, got ${data.status}`);
  assert(data.lang === 'en' && data.h1 === 1 && data.main === 1 && data.missingAlt === 0, `${path}: semantic baseline failed`);
  const expected404Console = expectedStatus === 404 && data.consoleErrors.every((message) => /404|failed to load resource/i.test(message));
  assert(data.consoleErrors.length === 0 || expected404Console, `${path}: console errors: ${data.consoleErrors.join('; ')}`);
  assert(data.axeSeriousCritical.length === 0, `${path}: axe serious/critical: ${data.axeSeriousCritical.join(', ')}`);
  if (expected) {
    assert(data.title === expected[0] && data.description === expected[1], `${path}: title or description mismatch`);
    assert(data.canonical === `${base}${path === '/' ? '/' : path}`, `${path}: canonical mismatch`);
    assert(data.ogTitle === expected[0] && data.twitterTitle === expected[0], `${path}: social title mismatch`);
  }
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await mkdir(out, { recursive: true });
  const desktop = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  for (const [path, expected] of Object.entries(metadata)) await inspectRoute(desktop, path, 200, expected);
  await inspectRoute(desktop, '/404.html', 200);
  await inspectRoute(desktop, '/missing-ledger-page', 404);

  const landing = await desktop.newPage();
  await landing.goto(`${base}/`, { waitUntil: 'networkidle' });
  evidence.desktopFirstScreen = {};
  for (const text of requiredFirstScreen) {
    const box = await landing.getByText(text, { exact: true }).boundingBox();
    evidence.desktopFirstScreen[text] = box;
    assert(box && box.y >= 0 && box.y + box.height <= 768, `desktop first screen hides: ${text}`);
  }
  await landing.screenshot({ path: `${out}/landing-desktop-1366x768.png`, fullPage: false });

  const history = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const historyPage = await history.newPage();
  await historyPage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const footerPrivacy = historyPage.locator('footer a.route-link', { hasText: 'Privacy' });
  await historyPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await historyPage.waitForFunction(() => window.scrollY > 1000);
  await footerPrivacy.evaluate((element) => element.focus({ preventScroll: true }));
  const before = await historyPage.evaluate(() => ({ y: window.scrollY, focused: document.activeElement?.getAttribute('data-history-focus') }));
  await historyPage.keyboard.press('Enter');
  await historyPage.getByRole('heading', { name: 'Keep alert config on your machine' }).waitFor();
  await historyPage.goBack();
  await historyPage.waitForFunction(() => location.pathname === '/' && document.activeElement?.getAttribute('data-history-focus') === 'footer-privacy');
  const restored = await historyPage.evaluate(() => ({ y: window.scrollY, focused: document.activeElement?.getAttribute('data-history-focus') }));
  await historyPage.goForward();
  await historyPage.waitForFunction(() => location.pathname === '/privacy' && document.activeElement?.tagName === 'H1');
  const forward = await historyPage.evaluate(() => ({ y: window.scrollY, focused: document.activeElement?.textContent?.trim() }));
  evidence.history = { before, restored, forward };
  assert(before.focused === 'footer-privacy' && before.y > 1000 && restored.focused === 'footer-privacy' && Math.abs(restored.y - before.y) < 3 && forward.y === 0, `history focus or scroll did not restore: ${JSON.stringify(evidence.history)}`);

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${base}/`, { waitUntil: 'networkidle' });
  evidence.mobile = { overflow: await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
  for (const text of requiredFirstScreen) {
    const box = await mobilePage.getByText(text, { exact: true }).boundingBox();
    assert(box && box.y + box.height <= 844, `mobile first screen hides: ${text}`);
  }
  await mobilePage.screenshot({ path: `${out}/landing-mobile-390x844.png`, fullPage: false });
  await mobilePage.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  evidence.mobile.text200Overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(evidence.mobile.overflow <= 0 && evidence.mobile.text200Overflow <= 0, 'mobile layout overflows');

  const demoContext = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const demo = await demoContext.newPage();
  const requests = [];
  demo.on('request', (request) => requests.push(request.url()));
  await demo.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await demo.getByText('Demo — sample data, nothing is saved').waitFor();
  await demo.getByText('3 changed · 2 matched').waitFor();
  await demo.screenshot({ path: `${out}/demo-mobile-390x844.png`, fullPage: false });
  await demo.evaluate(() => { localStorage.setItem('demo:alert-config-ledger:proof', 'only-demo'); localStorage.setItem('real-sentinel', 'keep'); });
  const downloaded = demo.waitForEvent('download');
  await demo.getByRole('button', { name: 'Download sample report' }).click();
  const stream = await (await downloaded).createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk.toString();
  const report = JSON.parse(text);
  assert(report.changes.length === 3 && report.changes.every((change) => change.attributed_to.captured_at === report.live.captured_at), 'demo report timestamps failed');
  await demo.getByRole('button', { name: 'Clear comparison' }).click();
  await demo.getByRole('button', { name: 'Reset demo' }).last().click();
  await demo.getByText('3 changed · 2 matched').waitFor();
  await demo.getByRole('button', { name: 'Install the CLI' }).click();
  evidence.demo = await demo.evaluate(() => ({
    url: location.href,
    keys: Object.keys(localStorage).sort(),
    crossOriginRequests: [],
  }));
  evidence.demo.crossOriginRequests = requests.filter((url) => new URL(url).origin !== new URL(base).origin);
  assert(evidence.demo.url === `${base}/#install`, 'demo exit destination failed');
  assert(evidence.demo.keys.includes('real-sentinel') && evidence.demo.keys.every((key) => key === 'real-sentinel' || key.startsWith('demo:alert-config-ledger:')) && evidence.demo.crossOriginRequests.length === 0, 'demo isolation failed');

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offline = await offlineContext.newPage();
  await offline.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await offline.reload();
  await offlineContext.setOffline(true);
  await offline.reload({ waitUntil: 'domcontentloaded' });
  evidence.offline = { notice: await offline.getByText('You are offline. The bundled demo still works.').textContent(), summary: await offline.getByText('3 changed · 2 matched').textContent() };
  await offlineContext.setOffline(false);

  await writeFile(`${out}/live-audit.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
