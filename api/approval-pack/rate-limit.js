const { createHash, randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_CLIENTS = 10_000;
const SHARED_DIRECTORY = '/home/data/alert-config-change-ledger/rate-limit';
const TABLE_NAME = 'AlertLedgerRateLimits';

class InMemoryAtomicCounterStore {
  constructor({ maxClients = MAX_CLIENTS } = {}) {
    this.maxClients = maxClients;
    this.counters = new Map();
  }

  async increment(scope, client, now, windowMs) {
    const key = `${scope}:${client}`;
    this.prune(now);
    let counter = this.counters.get(key);
    if (!counter || counter.resetAt <= now) {
      this.makeRoom();
      counter = { count: 0, resetAt: now + windowMs };
      this.counters.set(key, counter);
    }
    counter.count += 1;
    return { ...counter };
  }

  prune(now) {
    for (const [key, counter] of this.counters) {
      if (counter.resetAt <= now) this.counters.delete(key);
    }
  }

  makeRoom() {
    if (this.counters.size < this.maxClients) return;
    let oldestKey;
    let oldestResetAt = Infinity;
    for (const [key, counter] of this.counters) {
      if (counter.resetAt < oldestResetAt) {
        oldestKey = key;
        oldestResetAt = counter.resetAt;
      }
    }
    if (oldestKey) this.counters.delete(oldestKey);
  }

  reset() {
    this.counters.clear();
  }
}

class SharedFileAtomicCounterStore {
  constructor({ directory = SHARED_DIRECTORY, lockTimeoutMs = 5_000 } = {}) {
    this.directory = directory;
    this.lockTimeoutMs = lockTimeoutMs;
  }

  async increment(scope, client, now, windowMs) {
    await fs.mkdir(this.directory, { recursive: true });
    const key = createHash('sha256').update(`${scope}:${client}`).digest('hex');
    const counterPath = path.join(this.directory, `${key}.json`);
    const lockPath = `${counterPath}.lock`;
    await this.acquire(lockPath);
    try {
      let counter;
      try {
        counter = JSON.parse(await fs.readFile(counterPath, 'utf8'));
      } catch (error) {
        if (error.code !== 'ENOENT' && error.name !== 'SyntaxError') throw error;
        counter = null;
      }
      if (!counter || counter.resetAt <= now) {
        counter = { count: 0, resetAt: now + windowMs };
      }
      counter.count += 1;
      const temporaryPath = `${counterPath}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
      await fs.writeFile(temporaryPath, JSON.stringify(counter), { encoding: 'utf8', mode: 0o600 });
      await fs.rename(temporaryPath, counterPath);
      return counter;
    } finally {
      await fs.rm(lockPath, { recursive: true, force: true });
    }
  }

  async acquire(lockPath) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < this.lockTimeoutMs) {
      try {
        await fs.mkdir(lockPath);
        return;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const lock = await fs.stat(lockPath).catch(() => null);
        if (lock && Date.now() - lock.mtimeMs > this.lockTimeoutMs) {
          await fs.rm(lockPath, { recursive: true, force: true });
          continue;
        }
        await delay(10 + Math.floor(Math.random() * 20));
      }
    }
    throw new Error('shared rate-limit counter stayed busy');
  }

  reset() {}
}

class AzureTableAtomicCounterStore {
  constructor(connectionString, { table } = {}) {
    if (table) {
      this.table = table;
    } else {
      const { TableClient } = require('@azure/data-tables');
      this.table = TableClient.fromConnectionString(connectionString, TABLE_NAME);
    }
    this.ready = null;
    this.kind = 'azure-table';
  }

  async increment(scope, client, now, windowMs) {
    await this.ensureTable();
    const partitionKey = 'approval-pack';
    const rowKey = createHash('sha256').update(`${scope}:${client}`).digest('hex');
    for (let attempt = 0; attempt < 40; attempt += 1) {
      let entity;
      try {
        entity = await this.table.getEntity(partitionKey, rowKey);
      } catch (error) {
        if (!hasStatus(error, 404)) throw error;
        const counter = { partitionKey, rowKey, count: 1, resetAt: now + windowMs };
        try {
          await this.table.createEntity(counter);
          return { count: counter.count, resetAt: counter.resetAt };
        } catch (createError) {
          if (hasStatus(createError, 409)) continue;
          throw createError;
        }
      }

      const resetAt = Number(entity.resetAt);
      const counter = {
        partitionKey,
        rowKey,
        count: resetAt <= now ? 1 : Number(entity.count) + 1,
        resetAt: resetAt <= now ? now + windowMs : resetAt,
      };
      try {
        await this.table.updateEntity(counter, 'Replace', { etag: entity.etag });
        return { count: counter.count, resetAt: counter.resetAt };
      } catch (updateError) {
        if (hasStatus(updateError, 412)) continue;
        throw updateError;
      }
    }
    throw new Error('shared rate-limit counter stayed busy');
  }

  async ensureTable() {
    if (!this.ready) {
      this.ready = this.table.createTable().catch((error) => {
        if (!hasStatus(error, 409)) throw error;
      });
    }
    return this.ready;
  }

  reset() {}
}

class PerClientRateLimiter {
  constructor({
    store = new InMemoryAtomicCounterStore(),
    scope = 'client',
    now = () => Date.now(),
    windowMs = WINDOW_MS,
    maxRequests = MAX_REQUESTS_PER_WINDOW,
  } = {}) {
    this.store = store;
    this.scope = scope;
    this.now = now;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async take(client) {
    const now = this.now();
    const counter = await this.store.increment(this.scope, client, now, this.windowMs);
    if (counter.count > this.maxRequests) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((counter.resetAt - now) / 1000)) };
    }
    return { allowed: true };
  }

  reset() {
    this.store.reset();
  }
}

function productionCounterStore(environment = process.env) {
  const connectionString = environment.AzureWebJobsStorage
    || environment.AZURE_STORAGE_CONNECTION_STRING
    || environment.WEBSITE_CONTENTAZUREFILECONNECTIONSTRING;
  if (connectionString) return new AzureTableAtomicCounterStore(connectionString);
  if (environment.WEBSITE_INSTANCE_ID || environment.WEBSITE_SITE_NAME) {
    const store = new SharedFileAtomicCounterStore();
    store.kind = 'shared-file';
    return store;
  }
  const store = new InMemoryAtomicCounterStore();
  store.kind = 'memory';
  return store;
}

function hasStatus(error, expected) {
  return Boolean(error && typeof error === 'object' && error.statusCode === expected);
}

function header(headers, name) {
  const expected = name.toLowerCase();
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === expected) return Array.isArray(value) ? value[0] : value;
  }
  return '';
}

function clientId(req) {
  const forwardedFor = header(req.headers, 'x-forwarded-for');
  if (forwardedFor) return `ip:${forwardedFor.split(',')[0].trim()}`;
  return 'ip:unattributed';
}

module.exports = {
  MAX_REQUESTS_PER_WINDOW,
  WINDOW_MS,
  AzureTableAtomicCounterStore,
  InMemoryAtomicCounterStore,
  PerClientRateLimiter,
  SharedFileAtomicCounterStore,
  clientId,
  header,
  productionCounterStore,
};
