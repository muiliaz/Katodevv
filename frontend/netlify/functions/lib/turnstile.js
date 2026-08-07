// Cloudflare Turnstile verification for the public form endpoints.
//
// The rate limiter raises the cost of a flood from one address; it does nothing
// against a distributed one, because each address gets its own budget. Turnstile
// checks a different thing entirely — whether there is a browser and a human on
// the other end — so it closes the class of abuse rather than the rate.
//
// ── The fail-open decision ───────────────────────────────────────────────────
//
// When TURNSTILE_SECRET_KEY is absent, verification is SKIPPED and the request
// proceeds. That is deliberate, and it is the one judgement call in this file.
//
// Failing closed would mean a single typo in the Netlify dashboard silently
// destroys every enquiry the site receives — the business loses leads and
// nothing in the UI says so. Failing open means the protection is missing while
// misconfigured, but validation, the honeypot and the rate limiter all still
// apply, so the endpoint is no weaker than it was before Turnstile existed.
//
// The trade is: a config mistake costs protection, not revenue. It is logged
// loudly so the mistake is visible in the function logs.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Cloudflare's own testing keys. If one of these is configured we are on a
// staging setup that always passes; worth saying so in the logs rather than
// letting someone believe the real thing is running.
const TEST_SECRETS = new Set([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);

/**
 * Check a Turnstile token.
 *
 * @param {string|undefined} token  value the widget put in the form
 * @param {string|undefined} ip     client address, forwarded to Cloudflare
 * @returns {Promise<{ok: boolean, reason?: string}>}
 *          ok:true means "let it through" — including the unconfigured case.
 */
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.warn(
      'turnstile: TURNSTILE_SECRET_KEY is not set — skipping verification. ' +
      'The forms are protected only by validation, the honeypot and the rate limiter.'
    );
    return { ok: true, reason: 'not-configured' };
  }

  if (TEST_SECRETS.has(secret)) {
    console.warn('turnstile: a Cloudflare test secret is configured; every token will pass.');
  }

  if (!token) return { ok: false, reason: 'missing-token' };

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.append('remoteip', ip);

  let data;
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    data = await res.json();
  } catch (err) {
    // Cloudflare unreachable. Same reasoning as the unconfigured case: an
    // outage on their side must not take the enquiry form down with it.
    console.error('turnstile: verification request failed, letting the request through:', err);
    return { ok: true, reason: 'verify-unreachable' };
  }

  if (data?.success) return { ok: true };

  // error-codes is Cloudflare's own vocabulary, e.g. invalid-input-response,
  // timeout-or-duplicate. Useful in the logs, never returned to the caller.
  const codes = Array.isArray(data?.['error-codes']) ? data['error-codes'].join(', ') : 'unknown';
  console.warn('turnstile: token rejected —', codes);
  return { ok: false, reason: codes };
}

module.exports = { verifyTurnstile, VERIFY_URL };
