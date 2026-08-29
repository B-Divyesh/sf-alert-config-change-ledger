const { createHash } = require('node:crypto');

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_CLIENTS = 10_000;
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

class AzureTableAtomicCounterStore {
  constructor(connectionString, { table } = {}) {
    if (table) {
      this.table = table;
    } else {
      const { TableClient } = require('@azure/data-tables');
      this.table = TableClient.fromConnectionString(connectionString, TABLE_NAME);
    }
    this.ready = null;
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

class UnavailableAtomicCounterStore {
  async increment() {
    throw new Error('shared rate-limit storage is unavailable');
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
  const connectionString = environment.AzureWebJobsStorage;
  if (connectionString) return new AzureTableAtomicCounterStore(connectionString);
  if (environment.WEBSITE_INSTANCE_ID || environment.WEBSITE_SITE_NAME) {
    return new UnavailableAtomicCounterStore();
  }
  return new InMemoryAtomicCounterStore();
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
  UnavailableAtomicCounterStore,
  clientId,
  header,
  productionCounterStore,
};
