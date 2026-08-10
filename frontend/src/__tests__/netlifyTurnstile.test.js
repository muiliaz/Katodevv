import { vi } from "vitest";
// Tests for the Turnstile check.
//
// The interesting cases are not "a good token passes" — they are the three ways
// this can be misconfigured or broken, because each one decides whether the
// business keeps receiving enquiries.
import { verifyTurnstile, VERIFY_URL } from "../../netlify/functions/lib/turnstile";

const SECRET = "0x-test-secret";

const cloudflareSays = (payload) => () => Promise.resolve({ json: () => Promise.resolve(payload) });

beforeEach(() => {
  process.env.TURNSTILE_SECRET_KEY = SECRET;
  global.fetch = vi.fn(cloudflareSays({ success: true }));
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  delete global.fetch;
  delete process.env.TURNSTILE_SECRET_KEY;
});

describe("a configured secret", () => {
  test("accepts a token Cloudflare approves", async () => {
    await expect(verifyTurnstile("good-token", "1.2.3.4")).resolves.toEqual({ ok: true });
  });

  test("sends the secret, the token and the caller's address", async () => {
    await verifyTurnstile("good-token", "1.2.3.4");

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe(VERIFY_URL);

    const sent = new URLSearchParams(init.body);
    expect(sent.get("secret")).toBe(SECRET);
    expect(sent.get("response")).toBe("good-token");
    expect(sent.get("remoteip")).toBe("1.2.3.4");
  });

  test("rejects a token Cloudflare refuses", async () => {
    global.fetch.mockImplementation(
      cloudflareSays({ success: false, "error-codes": ["invalid-input-response"] })
    );

    const result = await verifyTurnstile("forged", "1.2.3.4");

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("invalid-input-response");
  });

  test("rejects a request with no token at all", async () => {
    // A script posting straight to the endpoint sends no token.
    const result = await verifyTurnstile(undefined, "1.2.3.4");

    expect(result).toEqual({ ok: false, reason: "missing-token" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("works without a client address", async () => {
    await verifyTurnstile("good-token", undefined);

    expect(new URLSearchParams(global.fetch.mock.calls[0][1].body).has("remoteip")).toBe(false);
  });
});

describe("failing open — the deliberate weak spot", () => {
  // Both cases below let the request through. That is a decision, not an
  // oversight: a typo in the dashboard or an outage at Cloudflare must not
  // silently destroy every enquiry the site receives. Validation, the honeypot
  // and the rate limiter still apply.
  test("skips verification entirely when the secret is not configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    const result = await verifyTurnstile(undefined, "1.2.3.4");

    expect(result).toEqual({ ok: true, reason: "not-configured" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("says so loudly in the logs, so the mistake is visible", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    await verifyTurnstile(undefined);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("TURNSTILE_SECRET_KEY is not set")
    );
  });

  test("lets the request through when Cloudflare is unreachable", async () => {
    global.fetch.mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await verifyTurnstile("good-token", "1.2.3.4");

    expect(result).toEqual({ ok: true, reason: "verify-unreachable" });
    expect(console.error).toHaveBeenCalled();
  });

  test("warns when one of Cloudflare's always-pass test secrets is in use", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    await verifyTurnstile("any", "1.2.3.4");

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("test secret"));
  });
});
