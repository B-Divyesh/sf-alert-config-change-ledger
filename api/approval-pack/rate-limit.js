const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_CLIENTS = 10_000;

/**
 * A small, bounded fixed-window limiter for the serverless function instance.
 * It runs before license verification so rejected requests cannot be used to
 * exhaust the billing service. Azure Functions may scale to more than one
 * instance; each instance applies the same per-client boundary independently.
 */
class PerClientRateLimiter {
  constructor({ now = () => Date.now(), windowMs = WINDOW_MS, maxRequests = MAX_REQUESTS_PER_WINDOW, maxClients = MAX_CLIENTS } = {}) {
    this.now = now;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.maxClients = maxClients;
    this.clients = new Map();
  }

  take(client) {
    const now = this.now();
    this.prune(now);
    let bucket = this.clients.get(client);
    if (!bucket || bucket.resetAt <= now) {
      this.makeRoom();
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.clients.set(client, bucket);
    }

    if (bucket.count >= this.maxRequests) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
    }

    bucket.count += 1;
    return { allowed: true };
  }

  prune(now) {
    for (const [client, bucket] of this.clients) {
      if (bucket.resetAt <= now) this.clients.delete(client);
    }
  }

  makeRoom() {
    if (this.clients.size < this.maxClients) return;
    let oldestClient;
    let oldestResetAt = Infinity;
    for (const [client, bucket] of this.clients) {
      if (bucket.resetAt < oldestResetAt) {
        oldestClient = client;
        oldestResetAt = bucket.resetAt;
      }
    }
    if (oldestClient) this.clients.delete(oldestClient);
  }

  reset() {
    this.clients.clear();
  }
}

function header(headers, name) {
  const expected = name.toLowerCase();
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === expected) return Array.isArray(value) ? value[0] : value;
  }
  return '';
}

function clientId(req) {
  // Azure supplies X-Azure-ClientIP when available. Otherwise use the first
  // address in the proxy chain, which is the originating client address.
  const azureClientIp = header(req.headers, 'x-azure-clientip');
  if (azureClientIp) return `ip:${azureClientIp.trim()}`;
  const forwardedFor = header(req.headers, 'x-forwarded-for');
  if (forwardedFor) return `ip:${forwardedFor.split(',')[0].trim()}`;
  return 'ip:unknown';
}

module.exports = {
  MAX_REQUESTS_PER_WINDOW,
  WINDOW_MS,
  PerClientRateLimiter,
  clientId,
  header,
};
