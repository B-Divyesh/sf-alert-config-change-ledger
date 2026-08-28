const PRODUCT = 'alert-config-change-ledger';
const BILLING_API = 'https://api.sociobot.in/api/v1';
const { PerClientRateLimiter, clientId, header } = require('./rate-limit.js');
const limiter = new PerClientRateLimiter();
// A shared ceiling covers proxy paths that do not provide a stable client IP.
const burstLimiter = new PerClientRateLimiter({ maxClients: 1 });

const template = `# Alert route approval

Decision: APPROVE / REJECT

Reviewed baseline revision:

Live snapshot source:

Change window:

## Route changes

| Route | Change | Severity impact | Recipient impact | Owner |
| --- | --- | --- | --- | --- |
| | | | | |

## Evidence

- Ledger report:
- Reviewed pull request:
- Provider export timestamp:

## Sign-off

- Reviewer:
- Date:
- Follow-up:
`;

module.exports = async function approvalPack(context, req) {
  const endpointLimit = burstLimiter.take('approval-pack');
  const clientLimit = limiter.take(clientId(req));
  const limit = endpointLimit.allowed ? clientLimit : endpointLimit;
  if (!limit.allowed) {
    context.res = response(429, 'Too many approval-pack requests. Try again shortly.', {
      'Retry-After': String(limit.retryAfter),
    });
    return;
  }

  const license = header(req.headers, 'x-alert-ledger-license') || '';
  if (!license) {
    context.res = response(401, 'A Pro license is required.');
    return;
  }

  try {
    const verify = await fetch(
      `${BILLING_API}/products/${PRODUCT}/verify?license=${encodeURIComponent(license)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!verify.ok) {
      context.res = response(502, 'The license service could not verify this request.');
      return;
    }
    const verdict = await verify.json();
    if (verdict.valid !== true) {
      context.res = response(403, 'This Pro license is not active.');
      return;
    }
    context.res = {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'attachment; filename="alert-ledger-approval-template.md"',
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
      body: template,
    };
  } catch {
    context.res = response(502, 'The license service could not be reached.');
  }
};

function response(status, body, extraHeaders = {}) {
  return {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
    body,
  };
}

// Used only by the local integration suite to isolate module-level state.
module.exports.__resetRateLimiterForTests = () => {
  limiter.reset();
  burstLimiter.reset();
};
