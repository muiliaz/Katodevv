import { vi } from "vitest";
// Tests for the throttle itself, separate from the handlers that use it.
// See netlifyValidation.test.js for why these live under src/.
import {
  checkRateLimit,
  resetRateLimit,
  WINDOW_MS,
  MAX_REQUESTS,
} from "../../netlify/functions/lib/rateLimit";

const from = (ip) => ({ headers: { "x-nf-client-connection-ip": ip } });

beforeEach(() => {
  resetRateLimit();
});

afterEach(() => {
  // Several cases below freeze Date.now. Restoring explicitly is what keeps
  // them independent — a leaked spy makes Date.now() return undefined for
  // every later test, and the window maths then silently never expires.
  vi.restoreAllMocks();
});

describe("the budget", () => {
  test("allows exactly MAX_REQUESTS before refusing", () => {
    for (let i = 0; i < MAX_REQUESTS; i++) {
      expect(checkRateLimit(from("1.1.1.1"), "contact").allowed).toBe(true);
    }

    expect(checkRateLimit(from("1.1.1.1"), "contact").allowed).toBe(false);
  });

  test("keeps separate budgets per address", () => {
    for (let i = 0; i < MAX_REQUESTS; i++) checkRateLimit(from("1.1.1.1"), "contact");

    expect(checkRateLimit(from("2.2.2.2"), "contact").allowed).toBe(true);
  });

  test("keeps separate budgets per route", () => {
    for (let i = 0; i < MAX_REQUESTS; i++) checkRateLimit(from("1.1.1.1"), "contact");

    expect(checkRateLimit(from("1.1.1.1"), "lead").allowed).toBe(true);
  });

  test("reports a wait that fits inside the window", () => {
    for (let i = 0; i < MAX_REQUESTS; i++) checkRateLimit(from("1.1.1.1"), "contact");

    const { retryAfterSeconds } = checkRateLimit(from("1.1.1.1"), "contact");

    expect(retryAfterSeconds).toBeGreaterThan(0);
    expect(retryAfterSeconds).toBeLessThanOrEqual(WINDOW_MS / 1000);
  });
});

describe("the window slides", () => {
  test("lets the caller back in once the window has passed", () => {
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);

    for (let i = 0; i < MAX_REQUESTS; i++) checkRateLimit(from("1.1.1.1"), "contact");
    expect(checkRateLimit(from("1.1.1.1"), "contact").allowed).toBe(false);

    Date.now.mockReturnValue(start + WINDOW_MS + 1);

    expect(checkRateLimit(from("1.1.1.1"), "contact").allowed).toBe(true);
  });

  test("expires hits one by one rather than clearing the whole bucket", () => {
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);

    // Spend the whole budget, but spread the first hit far from the rest.
    checkRateLimit(from("1.1.1.1"), "contact");
    Date.now.mockReturnValue(start + WINDOW_MS - 1000);
    for (let i = 1; i < MAX_REQUESTS; i++) checkRateLimit(from("1.1.1.1"), "contact");

    expect(checkRateLimit(from("1.1.1.1"), "contact").allowed).toBe(false);

    // Only the first hit has aged out — that buys exactly one more request.
    Date.now.mockReturnValue(start + WINDOW_MS + 1);
    expect(checkRateLimit(from("1.1.1.1"), "contact").allowed).toBe(true);
    expect(checkRateLimit(from("1.1.1.1"), "contact").allowed).toBe(false);
  });
});

describe("identifying the caller", () => {
  test("prefers the edge header over the client-supplied one", () => {
    const event = (forwarded) => ({
      headers: {
        "x-nf-client-connection-ip": "1.1.1.1",
        "x-forwarded-for":           forwarded,
      },
    });

    // Rotating x-forwarded-for must not buy a fresh budget.
    for (let i = 0; i < MAX_REQUESTS; i++) checkRateLimit(event(`10.0.0.${i}`), "contact");

    expect(checkRateLimit(event("10.0.0.99"), "contact").allowed).toBe(false);
  });

  test("falls back to x-forwarded-for when the edge header is absent", () => {
    // This is the `netlify dev` case. Weak, but better than lumping every
    // local request into one bucket.
    const event = { headers: { "x-forwarded-for": "3.3.3.3, 10.0.0.1" } };

    for (let i = 0; i < MAX_REQUESTS; i++) checkRateLimit(event, "contact");

    expect(checkRateLimit(event, "contact").allowed).toBe(false);
    expect(checkRateLimit(from("4.4.4.4"), "contact").allowed).toBe(true);
  });

  test("does not throw when there are no headers at all", () => {
    expect(() => checkRateLimit({}, "contact")).not.toThrow();
    expect(() => checkRateLimit(undefined, "contact")).not.toThrow();
  });
});

describe("memory safety", () => {
  test("does not grow without bound when addresses keep changing", () => {
    // A spray of forged addresses must not be able to exhaust the container's
    // memory — that would turn the throttle into the problem it prevents.
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);

    for (let i = 0; i < 6000; i++) checkRateLimit(from(`10.1.${i >> 8}.${i & 255}`), "contact");

    // Everything above is stale by now, so the next call must find a pruned map
    // and still answer correctly.
    Date.now.mockReturnValue(start + WINDOW_MS + 1);

    expect(checkRateLimit(from("1.1.1.1"), "contact").allowed).toBe(true);
  });
});
