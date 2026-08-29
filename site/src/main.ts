import './style.css';

type DemoState = { cleared: boolean; selected: number };
type SnapshotRef = { source: string; revision: string | null; captured_at: string };
type RouteView = { severity: string | null; recipients: string[]; matchers: Record<string, string> };
type ReportChange = {
  kind: 'added' | 'removed' | 'modified';
  route: string;
  route_id: string;
  fields: string[];
  before?: RouteView;
  after?: RouteView;
  attributed_to: SnapshotRef;
};
type DriftReport = { baseline: SnapshotRef; live: SnapshotRef; matched_routes: number; changes: ReportChange[] };
declare const __SAMPLE_REPORT__: DriftReport;

const SLUG = 'alert-config-change-ledger';
const DEMO_PREFIX = 'demo:alert-config-ledger:';
const DEMO_KEY = `${DEMO_PREFIX}state`;
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;
const API = 'https://api.sociobot.in/api/v1';
const app = document.querySelector<HTMLDivElement>('#app')!;
const routeStatus = document.querySelector<HTMLDivElement>('#route-status')!;
const sampleReport = __SAMPLE_REPORT__;

const displayCopy: Record<string, { kind: string; detail: string }> = {
  'team = payments': { kind: 'Recipient changed', detail: 'Pager endpoint fingerprint changed.' },
  'service = checkout': { kind: 'Severity changed', detail: 'Warning now routes as critical.' },
  'team = security': { kind: 'Route added', detail: 'A new critical route exists only in live state.' },
};
const displayOrder = ['team = payments', 'service = checkout', 'team = security'];
const changes = displayOrder.map((route) => {
  const change = sampleReport.changes.find((item) => item.route === route)!;
  const severityOnly = route === 'service = checkout';
  return {
    mark: change.kind === 'added' ? '+' : change.kind === 'removed' ? '−' : '~',
    kind: displayCopy[route].kind,
    route,
    detail: displayCopy[route].detail,
    before: change.before
      ? severityOnly ? `severity = ${change.before.severity}` : change.before.recipients.join(', ')
      : 'No reviewed route',
    after: change.after
      ? severityOnly ? `severity = ${change.after.severity}` : change.after.recipients.join(', ')
      : 'No live route',
    fields: change.fields.join(', '),
  };
});

type PageMeta = { title: string; description: string; canonical: string };

const metadata: Record<string, PageMeta> = {
  '/': {
    title: 'Alert Config Ledger — compare alert routes',
    description: 'Compare reviewed and live alert routes, then show recipient, severity, and route changes.',
    canonical: '/',
  },
  '/demo': {
    title: 'Demo — Alert Config Ledger',
    description: 'Review three sample alert route changes in an isolated browser demo.',
    canonical: '/demo',
  },
  '/privacy': {
    title: 'Privacy — Alert Config Ledger',
    description: 'Learn how Alert Config Ledger keeps alert configuration, demo data, and license data separate.',
    canonical: '/privacy',
  },
  '/terms': {
    title: 'Terms — Alert Config Ledger',
    description: 'Read the terms for the open-source Alert Config Ledger CLI and optional Pro license.',
    canonical: '/terms',
  },
  '/404': {
    title: 'Page not found — Alert Config Ledger',
    description: 'This Alert Config Ledger page does not exist. Return to the alert route comparison.',
    canonical: '/404',
  },
};

function header(): string {
  return `<header class="site-header">
    <a class="wordmark route-link" href="/"><span>ACL</span><b>Alert Config Ledger</b></a>
    <nav aria-label="Main navigation">
      <a class="route-link" href="/demo">Demo</a>
      <a href="/#install">Install</a>
      <a class="route-link" href="/privacy">Privacy</a>
    </nav>
  </header>`;
}

function footer(): string {
  return `<footer class="site-footer">
    <p>Compare alert route changes with their sources.</p>
    <nav aria-label="Footer navigation"><a class="route-link" href="/privacy">Privacy</a><a class="route-link" href="/terms">Terms</a><a href="https://sociobot.in" rel="external">Built by Param Factory <span class="sr-only">(external site)</span></a></nav>
    <p class="build">v0.1.0 · build 003</p>
  </footer>`;
}

function demoBanner(): string {
  return `<aside class="demo-banner" aria-label="Demo mode">
    <span><strong>Demo</strong> — sample data, nothing is saved</span>
    <span class="banner-actions"><button class="text-button" data-action="reset-demo">Reset demo</button><button class="text-button" data-action="start-real">Install the CLI</button></span>
  </aside>`;
}

function landing(): string {
  return `${header()}<main id="main" tabindex="-1">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">Read-only alert route comparison</p>
        <h1 id="hero-title" tabindex="-1">Compare reviewed and live alert routes</h1>
        <p class="lede">For platform teams who need to prove whether live alert routes match the reviewed baseline.</p>
        <div class="hero-action"><a class="button route-link" href="/?demo=1">Try it with sample data</a><span>Loads three sample route changes in an isolated demo.</span></div>
        <ul class="plain-facts" aria-label="Product facts"><li>Runs offline after the first visit.</li><li>Recipient endpoints stay redacted.</li><li>Core CLI needs no license.</li></ul>
      </div>
      <figure class="hero-art"><img src="/cassette-ledger.webp" width="1200" height="800" alt="A cut-paper cassette routes red and teal tape through an alert ledger." fetchpriority="high"><figcaption>Reviewed baseline on the left. Live configuration on the right.</figcaption></figure>
    </section>

    <section class="terminal-section" aria-labelledby="preview-title">
      <div class="section-label">CLI demo / actual command</div>
      <div class="terminal-copy"><h2 id="preview-title">Sample CLI comparison</h2><p>The bundled demo runs the same comparison as the CLI.</p></div>
      <figure class="terminal-frame">
        <img src="/terminal-demo.svg" width="960" height="590" alt="A terminal recording shows three changed alert routes and their sources." loading="lazy">
        <figcaption><details><summary>Read the terminal transcript</summary><pre><code>$ alert-ledger demo
! CHANGE  3 changed routes · 2 matched
~ team = payments · recipients
~ service = checkout · severity, recipients
+ team = security · route
Demo files: /tmp/alert-ledger-demo-…</code></pre></details></figcaption>
      </figure>
    </section>

    <section class="method" aria-labelledby="method-title">
      <div class="section-label">Three steps</div><h2 id="method-title">How the ledger works</h2>
      <ol class="tape-steps">
        <li><span>01</span><div><h3>Import provider exports</h3><p>Read Grafana or Alertmanager exports from a file or read-only URL.</p></div></li>
        <li><span>02</span><div><h3>Put routes in one format</h3><p>Keep non-secret provider fields and replace recipient endpoints with SHA-256 identifiers.</p></div></li>
        <li><span>03</span><div><h3>Show route changes</h3><p>Compare the baseline with live state and show each change with its timestamp.</p></div></li>
      </ol>
    </section>

    <section id="install" class="install" aria-labelledby="install-title">
      <div><div class="section-label">Install the CLI</div><h2 id="install-title">Run the ledger locally</h2><p>The demo ships inside the binary and needs no account.</p><p><a href="https://github.com/B-Divyesh/sf-alert-config-change-ledger" rel="external">Get the source on GitHub <span class="sr-only">(external site)</span></a>.</p></div>
      <div class="command-block"><code>git clone https://github.com/B-Divyesh/sf-alert-config-change-ledger.git<br>cd sf-alert-config-change-ledger<br>cargo install --path .<br>alert-ledger demo</code><button class="copy-button" data-action="copy-command">Copy install command</button></div>
    </section>

    <section class="boundaries" aria-labelledby="boundaries-title">
      <div class="section-label">Read-only limits</div><h2 id="boundaries-title">What it does not do</h2>
      <div class="boundary-grid"><p>It does not send alerts.</p><p>It does not change provider config.</p><p>It does not replace Git review.</p><p>It does not send telemetry.</p></div>
    </section>

    <section class="paid" aria-labelledby="paid-title">
      <div><div class="section-label">Optional Pro feature</div><h2 id="paid-title">Use an existing Pro license</h2><p>A Pro license adds a reusable review template and sign-off checklist.</p><p>The snapshot, diff, timeline, JSON, and Markdown commands need no license.</p><p>New license sales are not open in this release.</p></div>
      <div class="license-panel" data-license-panel><p class="license-state" aria-live="polite">Checking this browser for a license…</p></div>
    </section>
  </main>${footer()}`;
}

function getDemoState(): DemoState | 'error' {
  try {
    const stored = localStorage.getItem(DEMO_KEY);
    if (!stored) {
      const initial = { cleared: false, selected: 0 };
      localStorage.setItem(DEMO_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(stored);
    if (typeof parsed.cleared !== 'boolean' || typeof parsed.selected !== 'number') return 'error';
    return parsed;
  } catch {
    return 'error';
  }
}

function clearDemoState(): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(DEMO_PREFIX)) localStorage.removeItem(key);
  }
}

function demo(): string {
  const state = getDemoState();
  let content = '';
  if (state === 'error') {
    content = `<section class="state-card error-state" role="alert"><p class="state-mark">!</p><h2>The sample could not load</h2><p>The saved demo state is damaged. Reset it to load a clean copy.</p><button class="button" data-action="reset-demo">Reset demo</button></section>`;
  } else if (state.cleared) {
    content = `<section class="state-card"><p class="state-mark">∅</p><h2>No comparison is loaded</h2><p>Reset the demo to load the baseline and live snapshots.</p><button class="button" data-action="reset-demo">Reset demo</button></section>`;
  } else {
    const selected = changes[state.selected] || changes[0];
    content = `<section class="ledger" aria-labelledby="ledger-title">
      <div class="ledger-summary"><div><span class="reel reel-a" aria-hidden="true"></span><small>Baseline / Git</small><strong>${sampleReport.baseline.revision}</strong><time datetime="${sampleReport.baseline.captured_at}">27 Aug · 16:00 UTC</time></div><div class="drift-stamp"><b>Changes found</b><span>${sampleReport.changes.length} changed · ${sampleReport.matched_routes} matched</span></div><div><span class="reel reel-b" aria-hidden="true"></span><small>Live / Grafana</small><strong>${sampleReport.live.revision}</strong><time datetime="${sampleReport.live.captured_at}">28 Aug · 07:42 UTC</time></div></div>
      <div class="ledger-body"><div class="track-list"><h2 id="ledger-title">Changed routes</h2><p>Choose a route to inspect its baseline and live values.</p>${changes.map((item, index) => `<button class="track ${index === state.selected ? 'selected' : ''}" data-change-index="${index}" aria-pressed="${index === state.selected}"><span class="change-mark">${item.mark}</span><span><b>${item.route}</b><small>${item.kind}</small></span><span class="track-no">0${index + 1}</span></button>`).join('')}</div>
      <article class="change-detail" aria-live="polite"><div class="section-label">Change 0${state.selected + 1} / ${selected.fields}</div><h2>${selected.kind}</h2><p>${selected.detail}</p><dl><div><dt>Baseline</dt><dd>${selected.before}</dd></div><div><dt>Live</dt><dd>${selected.after}</dd></div><div><dt>Attributed to</dt><dd>${sampleReport.live.source} #${sampleReport.live.revision}</dd></div></dl></article></div>
      <div class="ledger-actions"><button class="button" data-action="download-report">Download sample report</button><button class="button secondary" data-action="clear-demo">Clear comparison</button></div>
    </section>`;
  }
  return `${demoBanner()}${header()}<main id="main" class="demo-main" tabindex="-1"><section class="demo-intro"><p class="eyebrow">Sample data · no setup</p><h1 tabindex="-1">Review three live route changes</h1><p class="lede">Compare a reviewed Grafana baseline with a later live snapshot.</p><div class="offline-note" hidden role="status">You are offline. The bundled demo still works.</div></section>${content}</main>${footer()}`;
}

function privacy(): string {
  return `${header()}<main id="main" class="legal" tabindex="-1"><p class="eyebrow">Policy / plain copy</p><h1 tabindex="-1">Keep alert config on your machine</h1><p class="lede">Effective 28 August 2026.</p>
    <h2>CLI data</h2><p>The CLI processes exports on your machine. It makes no telemetry request.</p><p>A URL import sends one GET request to the URL you provide. Tokens come from your chosen environment variable.</p><p>Snapshots contain SHA-256 identifiers instead of recipient endpoint values.</p>
    <h2>Demo data</h2><p>The web demo uses bundled sample data. Its state stays under the <code>demo:alert-config-ledger:</code> browser prefix.</p><p>Leaving demo mode removes that demo state. The service worker caches site files for offline use.</p>
    <h2>License data</h2><p>If you paste a license, this browser stores the token and its latest verdict.</p><p>Verification sends the token to the Sociobot billing API. No alert configuration is included.</p>
    <h2>Questions</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>
  </main>${footer()}`;
}

function terms(): string {
  return `${header()}<main id="main" class="legal" tabindex="-1"><p class="eyebrow">Terms / version 0.1</p><h1 tabindex="-1">Use the ledger as an audit aid</h1><p class="lede">Effective 28 August 2026.</p>
    <h2>Open source CLI</h2><p>The CLI is licensed under MIT. It is provided without warranty.</p>
    <h2>Your responsibility</h2><p>Use credentials with read-only access. Review reports before using them in an incident process.</p>
    <h2>Pro licenses</h2><p>An active Pro license gives access to the approval report pack.</p><p>Core CLI commands stay available without a license.</p>
    <h2>Limits</h2><p>The ledger does not guarantee that a provider export is complete. Provider access and export quality remain your responsibility.</p>
    <h2>Contact</h2><p>Email <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>
  </main>${footer()}`;
}

function notFound(): string {
  return `${header()}<main id="main" class="not-found" tabindex="-1"><div class="lost-tape" aria-hidden="true"><span></span><span></span></div><p class="eyebrow">Page not found / 404</p><h1 tabindex="-1">This page was not found</h1><p>The address does not match a page in this release.</p><a class="button route-link" href="/">Return to the home page</a></main>${footer()}`;
}

function setMeta(path: string): void {
  const known = metadata[path] ? path : '/404';
  const page = metadata[known];
  document.title = page.title;
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = `https://alert-config-change-ledger.sociobot.in${page.canonical}`;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', page.description);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', page.title);
  }
  for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', page.description);
  }
}

function currentRoute(): '/' | '/demo' | '/privacy' | '/terms' | '/404' {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/' && new URLSearchParams(window.location.search).get('demo') === '1') return '/demo';
  return path === '/' || path === '/demo' || path === '/privacy' || path === '/terms' ? path : '/404';
}

function render(options: { focus?: boolean } = {}): void {
  const path = currentRoute();
  setMeta(path);
  app.innerHTML = path === '/' ? landing() : path === '/demo' ? demo() : path === '/privacy' ? privacy() : path === '/terms' ? terms() : notFound();
  bindEvents();
  if (path === '/') setupLicense();
  updateOfflineState();
  if (options.focus) {
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>('h1');
    heading?.focus();
    routeStatus.textContent = heading?.textContent || '';
  }
}

function navigate(href: string): void {
  history.pushState({}, '', href);
  render({ focus: true });
}

function bindEvents(): void {
  document.querySelectorAll<HTMLAnchorElement>('a.route-link').forEach((link) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const target = new URL(link.href);
    navigate(`${target.pathname}${target.search}${target.hash}`);
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-change-index]').forEach((button) => button.addEventListener('click', () => {
    const state = getDemoState();
    if (state === 'error') return;
    state.selected = Number(button.dataset.changeIndex);
    localStorage.setItem(DEMO_KEY, JSON.stringify(state));
    render();
    document.querySelector<HTMLButtonElement>(`[data-change-index="${state.selected}"]`)?.focus();
  }));
  document.querySelectorAll<HTMLElement>('[data-action]').forEach((control) => control.addEventListener('click', handleAction));
}

async function handleAction(event: Event): Promise<void> {
  const action = (event.currentTarget as HTMLElement).dataset.action;
  if (action === 'reset-demo') {
    localStorage.setItem(DEMO_KEY, JSON.stringify({ cleared: false, selected: 0 }));
    render();
    document.querySelector<HTMLElement>('#ledger-title')?.focus();
  } else if (action === 'start-real') {
    clearDemoState();
    navigate('/#install');
    requestAnimationFrame(() => document.querySelector('#install')?.scrollIntoView());
  } else if (action === 'clear-demo') {
    localStorage.setItem(DEMO_KEY, JSON.stringify({ cleared: true, selected: 0 }));
    render();
  } else if (action === 'download-report') {
    download('alert-ledger-sample-report.json', JSON.stringify(sampleReport, null, 2), 'application/json');
    announce('Downloaded the sample change report.');
  } else if (action === 'copy-command') {
    await navigator.clipboard.writeText('git clone https://github.com/B-Divyesh/sf-alert-config-change-ledger.git\ncd sf-alert-config-change-ledger\ncargo install --path .\nalert-ledger demo');
    (event.currentTarget as HTMLElement).textContent = 'Copied command';
  } else if (action === 'download-pro') {
    const token = localStorage.getItem(LICENSE_KEY);
    if (!token) {
      announce('The license is missing. Paste it again and retry.');
      return;
    }
    const response = await fetch('/api/approval-pack', {
      method: 'POST',
      headers: { 'X-Alert-Ledger-License': token }
    });
    if (!response.ok) {
      announce('The approval pack could not be authorized. Verify the license and retry.');
      return;
    }
    download('alert-ledger-approval-template.md', await response.text(), 'text/markdown');
    announce('Downloaded the approval report template.');
  }
}

function download(name: string, body: string, type: string): void {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function announce(message: string): void {
  routeStatus.textContent = message;
}

function licenseMarkup(valid: boolean, notice = ''): string {
  if (valid) return `<p class="license-state good">License active.</p><button class="button" data-action="download-pro">Download approval report pack</button><button class="text-button" data-action="remove-license">Remove license</button>`;
  return `${notice ? `<p class="license-state notice">${notice}</p>` : '<p class="license-state">No active license in this browser.</p>'}<p>New license sales are not open in this release.</p><form class="license-form"><label for="license-token">Have a license? Paste it</label><div><input id="license-token" name="license" autocomplete="off" required><button class="button secondary" type="submit">Verify license</button></div></form>`;
}

async function setupLicense(): Promise<void> {
  const panel = document.querySelector<HTMLElement>('[data-license-panel]');
  if (!panel) return;
  const token = localStorage.getItem(LICENSE_KEY);
  const cached = readVerdict();
  panel.innerHTML = licenseMarkup(Boolean(token && cached?.valid));
  bindLicensePanel(panel);
  if (!token) return;
  if (cached && Date.now() - cached.checkedAt < 86_400_000) return;
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    const result = await response.json();
    const verdict = { valid: result.valid === true, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    panel.innerHTML = licenseMarkup(verdict.valid, verdict.valid ? '' : 'License no longer active.');
  } catch {
    panel.innerHTML = licenseMarkup(Boolean(cached?.valid), cached?.valid ? 'Offline. Using the last valid check.' : 'License check could not connect. Try again.');
  }
  bindLicensePanel(panel);
}

function readVerdict(): { valid: boolean; checkedAt: number } | null {
  try { return JSON.parse(localStorage.getItem(VERDICT_KEY) || 'null'); } catch { return null; }
}

function bindLicensePanel(panel: HTMLElement): void {
  panel.querySelector<HTMLFormElement>('.license-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = panel.querySelector<HTMLInputElement>('#license-token');
    if (!input?.value.trim()) return;
    localStorage.setItem(LICENSE_KEY, input.value.trim());
    localStorage.removeItem(VERDICT_KEY);
    setupLicense();
  });
  panel.querySelector<HTMLElement>('[data-action="download-pro"]')?.addEventListener('click', handleAction);
  panel.querySelector<HTMLElement>('[data-action="remove-license"]')?.addEventListener('click', () => {
    localStorage.removeItem(LICENSE_KEY);
    localStorage.removeItem(VERDICT_KEY);
    setupLicense();
  });
}

function updateOfflineState(): void {
  const note = document.querySelector<HTMLElement>('.offline-note');
  if (note) note.hidden = navigator.onLine;
}

window.addEventListener('popstate', () => render({ focus: true }));
window.addEventListener('online', updateOfflineState);
window.addEventListener('offline', updateOfflineState);
captureReturnedLicense();
render();

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));

function captureReturnedLicense(): void {
  const params = new URLSearchParams(location.search);
  const returned = params.get('license');
  if (!returned) return;
  localStorage.setItem(LICENSE_KEY, returned);
  localStorage.removeItem(VERDICT_KEY);
  params.delete('license');
  history.replaceState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
}
