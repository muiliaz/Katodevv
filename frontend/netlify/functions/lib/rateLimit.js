// Per-IP request throttle for the public form endpoints.
//
// The function URLs are public: anyone can POST to /.netlify/functions/contact
// straight from curl, skipping the site entirely. Validation and the honeypot
// stop malformed and obviously automated payloads, but neither stops a script
// that posts well-formed submissions in a loop — that floods the Telegram chat
// and buries real enquiries.
//
// ── What this does and does not buy us ───────────────────────────────────────
//
// State lives in module scope, which on Netlify means one Lambda container.
// That has two consequences worth stating plainly rather than discovering later:
//
//   * a cold start resets the counters;
//   * concurrent containers each keep their own, so the effective ceiling is
//     MAX_REQUESTS × (number of warm containers).
//
// So this is a speed bump, not a distributed rate limiter. It raises the cost
// of the naive single-source flood — which is the attack the security audit
// actually observed — for zero dependencies and zero configuration. Stopping a
// distributed flood needs either a shared store (Redis) or a challenge such as
// Cloudflare Turnstile; both need accounts and credentials the repository
// cannot provision for itself. See audit-fixes/03-rate-limiting.md.

const WINDOW_MS    = 60 * 1000;
const MAX_REQUESTS = 5;

// Cap on distinct keys held at once. Without it a spray of forged addresses
// would grow the map until the container runs out of memory — turning an
// anti-abuse measure into the vulnerability it was meant to prevent.
const MAX_TRACKED_KEYS = 5000;

// key -> array of request timestamps inside the current window
const hits = new Map();

// Netlify's edge sets x-nf-client-connection-ip from the real connection, so a
// caller cannot forge it. x-forwarded-for is only a fallback for local `netlify
// dev` and is client-controlled: treat a request that only carries that header
// as weakly identified, never as trusted.
function clientIp(headers = {}) {
  const direct = headers['x-nf-client-connection-ip'];
  if (direct) return direct;

  const forwarded = headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

function prune(now) {
  for (const [key, times] of hits) {
    const live = times.filter((t) => now - t < WINDOW_MS);
    if (live.length) hits.set(key, live);
    else hits.delete(key);
  }
}

/**
 * Record a request and report whether it may proceed.
 *
 * Keyed by IP *and* route, so hitting the contact form does not spend the
 * budget for the chat widget — they are separate user journeys.
 *
 * @returns {{allowed: boolean, retryAfterSeconds: number}}
 */
function checkRateLimit(event, route) {
  const now = Date.now();
  const key = `${route}:${clientIp(event?.headers)}`;

  if (hits.size >= MAX_TRACKED_KEYS) prune(now);

  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    // Time until the oldest hit falls out of the window.
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  hits.set(key, recent);

  return { allowed: true, retryAfterSeconds: 0 };
}

// Test-only: module state outlives a single handler call by design, so tests
// need a way back to a known-empty state between cases.
function resetRateLimit() {
  hits.clear();
}

module.exports = {
  checkRateLimit,
  resetRateLimit,
  WINDOW_MS,
  MAX_REQUESTS,
};
