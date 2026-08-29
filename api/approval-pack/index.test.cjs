const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const approvalPack = require('./index.js');
const { createApprovalPack } = approvalPack;
const {
  AzureTableAtomicCounterStore,
  SharedFileAtomicCounterStore,
  clientId,
  productionCounterStore,
} = require('./rate-limit.js');

test.beforeEach(() => approvalPack.__resetRateLimiterForTests());

test('rate-limit client identity uses the factory forwarding header', () => {
  assert.equal(clientId({ headers: {
    'X-Forwarded-For': '198.51.100.91, 10.0.0.8',
    'X-Azure-ClientIP': '10.0.0.8',
  } }), 'ip:198.51.100.91');
  assert.equal(clientId({ headers: {} }), 'ip:unattributed');
});

test('unlicensed approval-pack requests never receive paid content', async () => {
  const context = {};
  await approvalPack(context, { headers: {} });
  assert.equal(context.res.status, 401);
  assert.doesNotMatch(context.res.body, /# Alert route approval/);
  assert.equal(context.res.headers['Cache-Control'], 'private, no-store');
  assert.equal(context.res.headers['X-Alert-Ledger-Build'], 'repair-7');
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

test('@claim:pro-pack-contents the real handler returns the promised review and sign-off sections', async () => {
  const handler = createApprovalPack({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ valid: true, reason: 'ok' }),
    }),
  });
  const context = {};
  await handler(context, { headers: { 'x-alert-ledger-license': 'recorded-valid-license' } });

  assert.equal(context.res.status, 200);
  assert.equal(context.res.headers['Content-Type'], 'text/markdown; charset=utf-8');
  assert.match(context.res.body, /^# Alert route approval/m);
  assert.match(context.res.body, /^## Route changes$/m);
  assert.match(context.res.body, /^## Evidence$/m);
  assert.match(context.res.body, /^## Sign-off$/m);
  assert.match(context.res.body, /^- Reviewer:$/m);
  assert.match(context.res.body, /^- Date:$/m);
  assert.match(context.res.body, /^- Follow-up:$/m);
});

test('invalid-license requests are also throttled before further verification', async (t) => {
  let verificationCount = 0;
  t.mock.method(global, 'fetch', async () => {
    verificationCount += 1;
    return { ok: true, json: async () => ({ valid: false, reason: 'invalid' }) };
  });
  const responses = [];
  for (let index = 0; index < 21; index += 1) {
    const context = {};
    await approvalPack(context, { headers: { 'X-Azure-ClientIP': '198.51.100.88', 'X-Alert-Ledger-License': 'invalid' } });
    responses.push(context.res);
  }
  assert.equal(responses.filter((item) => item.status === 403).length, 20);
  const blocked = responses.find((item) => item.status === 429);
  assert.ok(blocked);
  assert.match(blocked.headers['Retry-After'], /^[1-9]\d*$/);
  assert.equal(verificationCount, 20);
});

test('bursts are rate limited per client before license verification', async (t) => {
  const server = http.createServer(async (request, response) => {
    const context = {};
    await approvalPack(context, { headers: request.headers });
    response.writeHead(context.res.status, context.res.headers);
    response.end(context.res.body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const { port } = server.address();
  const address = `http://127.0.0.1:${port}/api/approval-pack`;

  const results = await Promise.all(Array.from({ length: 25 }, () => fetch(address, {
    method: 'POST',
    headers: { 'X-Forwarded-For': '198.51.100.77' },
  })));
  const statuses = results.map((result) => result.status);
  const blocked = results.filter((result) => result.status === 429);

  assert.equal(statuses.filter((status) => status === 401).length, 20);
  assert.equal(blocked.length, 5);
  for (const result of blocked) {
    assert.match(result.headers.get('retry-after') || '', /^[1-9]\d*$/);
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
  }
});

test('concurrent requests cannot bypass the allowance across handler instances', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alert-ledger-rate-limit-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const handlers = Array.from({ length: 5 }, () => createApprovalPack({
    store: new SharedFileAtomicCounterStore({ directory }),
  }));
  const contexts = Array.from({ length: 25 }, () => ({}));
  await Promise.all(contexts.map((context, index) => handlers[index % handlers.length](context, {
    headers: { 'X-Forwarded-For': '198.51.100.76' },
  })));

  assert.equal(contexts.filter((context) => context.res.status === 401).length, 20);
  const blocked = contexts.filter((context) => context.res.status === 429);
  assert.equal(blocked.length, 5);
  assert.ok(blocked.every((context) => /^[1-9]\d*$/.test(context.res.headers['Retry-After'])));
});

test('Azure Table ETags serialize concurrent requests across handler instances', async () => {
  const table = new FakeAtomicTable();
  const handlers = Array.from({ length: 5 }, () => createApprovalPack({
    store: new AzureTableAtomicCounterStore('unused-in-test', { table }),
  }));
  const contexts = Array.from({ length: 25 }, () => ({}));
  await Promise.all(contexts.map((context, index) => handlers[index % handlers.length](context, {
    headers: { 'X-Forwarded-For': '198.51.100.75' },
  })));

  assert.equal(contexts.filter((context) => context.res.status === 401).length, 20);
  const blocked = contexts.filter((context) => context.res.status === 429);
  assert.equal(blocked.length, 5);
  assert.ok(blocked.every((context) => /^[1-9]\d*$/.test(context.res.headers['Retry-After'])));
});

test('a deployed handler fails closed when shared protection is unavailable', async () => {
  const handler = createApprovalPack({
    store: {
      increment: async () => { throw new Error('unavailable'); },
      reset() {},
    },
  });
  const context = {};
  await handler(context, { headers: {} });
  assert.equal(context.res.status, 503);
  assert.equal(context.res.headers['Retry-After'], '5');
  assert.equal(context.res.headers['Cache-Control'], 'private, no-store');
});

test('deployed handlers select the shared filesystem counter', () => {
  assert.ok(
    productionCounterStore({ WEBSITE_INSTANCE_ID: 'serverless-instance' })
      instanceof SharedFileAtomicCounterStore,
  );
});

test('deployment-provided storage selects the atomic Azure Table counter', () => {
  const store = productionCounterStore({
    ALERT_LEDGER_RATE_LIMIT_STORAGE: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=YWFhYWFhYWFhYWFhYWFhYQ==;EndpointSuffix=core.windows.net',
  });
  assert.equal(store.kind, 'azure-table');
});

test('the endpoint ceiling protects against rotating forwarded client identities', async () => {
  const responses = [];
  for (let index = 0; index < 25; index += 1) {
    const context = {};
    await approvalPack(context, { headers: { 'X-Forwarded-For': `198.51.100.${index}` } });
    responses.push(context.res);
  }
  assert.equal(responses.filter((item) => item.status === 401).length, 20);
  const blocked = responses.filter((item) => item.status === 429);
  assert.equal(blocked.length, 5);
  assert.ok(blocked.every((item) => /^[1-9]\d*$/.test(item.headers['Retry-After'])));
});

class FakeAtomicTable {
  constructor() {
    this.entities = new Map();
    this.etag = 0;
  }

  async createTable() {}

  async getEntity(partitionKey, rowKey) {
    const entity = this.entities.get(`${partitionKey}:${rowKey}`);
    if (!entity) throw statusError(404);
    return { ...entity };
  }

  async createEntity(entity) {
    const key = `${entity.partitionKey}:${entity.rowKey}`;
    if (this.entities.has(key)) throw statusError(409);
    this.entities.set(key, { ...entity, etag: String(++this.etag) });
  }

  async updateEntity(entity, _mode, options) {
    const key = `${entity.partitionKey}:${entity.rowKey}`;
    const current = this.entities.get(key);
    if (!current || current.etag !== options.etag) throw statusError(412);
    this.entities.set(key, { ...entity, etag: String(++this.etag) });
  }
}

function statusError(statusCode) {
  return Object.assign(new Error(`table status ${statusCode}`), { statusCode });
}
