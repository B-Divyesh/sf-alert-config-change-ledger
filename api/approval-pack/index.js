const PRODUCT = 'alert-config-change-ledger';
const BILLING_API = 'https://api.sociobot.in/api/v1';
const BUILD_ID = 'repair-7';
const {
  PerClientRateLimiter,
  InMemoryAtomicCounterStore,
  clientId,
  header,
  productionCounterStore,
} = require('./rate-limit.js');

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

function createApprovalPack({
  store = productionCounterStore(),
  clientStore = new InMemoryAtomicCounterStore(),
  fetchImpl = (...args) => fetch(...args),
} = {}) {
  const storeKind = store.kind || store.constructor.name;
  const limiter = new PerClientRateLimiter({ store: clientStore, scope: 'client' });
  const endpointLimiter = new PerClientRateLimiter({ store, scope: 'endpoint' });

  const approvalPack = async function approvalPack(context, req) {
    try {
      const endpointLimit = await endpointLimiter.take('approval-pack');
      if (!endpointLimit.allowed) {
        context.res = withStore(rateLimitResponse(endpointLimit.retryAfter), storeKind);
        return;
      }
      const clientLimit = await limiter.take(clientId(req));
      if (!clientLimit.allowed) {
        context.res = withStore(rateLimitResponse(clientLimit.retryAfter), storeKind);
        return;
      }
    } catch {
      context.res = withStore(response(503, 'Request protection is unavailable. Try again shortly.', {
        'Retry-After': '5',
      }), storeKind);
      return;
    }

    const license = header(req.headers, 'x-alert-ledger-license') || '';
    if (!license) {
      context.res = withStore(response(401, 'A Pro license is required.'), storeKind);
      return;
    }

    try {
      const verify = await fetchImpl(
        `${BILLING_API}/products/${PRODUCT}/verify?license=${encodeURIComponent(license)}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!verify.ok) {
        context.res = withStore(response(502, 'The license service could not verify this request.'), storeKind);
        return;
      }
      const verdict = await verify.json();
      if (verdict.valid !== true) {
        context.res = withStore(response(403, 'This Pro license is not active.'), storeKind);
        return;
      }
      context.res = {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store',
          'Content-Disposition': 'attachment; filename="alert-ledger-approval-template.md"',
          'Content-Type': 'text/markdown; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'X-Alert-Ledger-Build': BUILD_ID,
          'X-Alert-Ledger-Limit-Store': storeKind,
        },
        body: template,
      };
    } catch {
      context.res = withStore(response(502, 'The license service could not be reached.'), storeKind);
    }
  };

  approvalPack.__resetRateLimiterForTests = () => {
    store.reset();
    clientStore.reset();
  };
  return approvalPack;
}

function withStore(result, storeKind) {
  result.headers['X-Alert-Ledger-Limit-Store'] = storeKind;
  return result;
}

function rateLimitResponse(retryAfter) {
  return response(429, 'Too many approval-pack requests. Try again shortly.', {
    'Retry-After': String(retryAfter),
  });
}

function response(status, body, extraHeaders = {}) {
  return {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Alert-Ledger-Build': BUILD_ID,
      ...extraHeaders,
    },
    body,
  };
}

const handler = createApprovalPack();
module.exports = handler;
module.exports.createApprovalPack = createApprovalPack;
