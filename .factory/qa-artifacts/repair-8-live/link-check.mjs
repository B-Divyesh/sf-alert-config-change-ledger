import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const base = 'https://alert-config-change-ledger.sociobot.in';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const links = new Set();

for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html']) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  for (const href of await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.href))) links.add(href);
}

const results = [];
for (const href of [...links].sort()) {
  if (href.startsWith('mailto:')) {
    results.push({ href, status: 'mailto' });
    continue;
  }
  const response = await context.request.get(href);
  results.push({ href, status: response.status() });
}

await writeFile('.factory/qa-artifacts/repair-8-live/link-check.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();

if (results.some(result => typeof result.status === 'number' && result.status >= 400)) process.exit(1);
