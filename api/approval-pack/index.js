const PRODUCT = 'alert-config-change-ledger';
const BILLING_API = 'https://api.sociobot.in/api/v1';

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
  const authorization = req.headers?.authorization || req.headers?.Authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    context.res = response(401, 'A Pro license is required.');
    return;
  }

  try {
    const verify = await fetch(
      `${BILLING_API}/products/${PRODUCT}/verify?license=${encodeURIComponent(match[1])}`,
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

function response(status, body) {
  return {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
    body,
  };
}
