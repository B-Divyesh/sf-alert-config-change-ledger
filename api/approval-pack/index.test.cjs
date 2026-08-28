const test = require('node:test');
const assert = require('node:assert/strict');
const approvalPack = require('./index.js');

test('unlicensed approval-pack requests never receive paid content', async () => {
  const context = {};
  await approvalPack(context, { headers: {} });
  assert.equal(context.res.status, 401);
  assert.doesNotMatch(context.res.body, /# Alert route approval/);
  assert.equal(context.res.headers['Cache-Control'], 'private, no-store');
});

test('invalid licenses never receive paid content', async (t) => {
  t.mock.method(global, 'fetch', async () => ({
    ok: true,
    json: async () => ({ valid: false, reason: 'invalid' }),
  }));
  const context = {};
  await approvalPack(context, { headers: { 'x-alert-ledger-license': 'invalid-license' } });
  assert.equal(context.res.status, 403);
  assert.doesNotMatch(context.res.body, /# Alert route approval/);
});

test('a valid license receives the no-store approval pack', async (t) => {
  let verificationUrl = '';
  t.mock.method(global, 'fetch', async (url) => {
    verificationUrl = url;
    return { ok: true, json: async () => ({ valid: true, reason: 'ok' }) };
  });
  const context = {};
  await approvalPack(context, { headers: { 'x-alert-ledger-license': 'valid license' } });
  assert.equal(context.res.status, 200);
  assert.match(context.res.body, /# Alert route approval/);
  assert.equal(context.res.headers['Cache-Control'], 'private, no-store');
  assert.match(verificationUrl, /verify\?license=valid%20license$/);
});
