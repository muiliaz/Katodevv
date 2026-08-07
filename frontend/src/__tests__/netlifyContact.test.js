import { vi } from "vitest";
// Tests for the public contact endpoint, exercised through its exported
// handler(event) the same way Netlify invokes it.
//
// Nothing is stubbed except global fetch — the outermost edge of the system.
// Everything inside runs for real: validation, the honeypot, the throttle, the
// HTML escaping and the Telegram request itself. That is deliberate. Mocking
// sendMessage would have left lib/telegram.js untested, and it is the module
// that builds the request we actually depend on.
import { GENERIC_ERROR, INVALID_JSON, TOO_MANY_REQUESTS, CHALLENGE_FAILED } from "../../netlify/functions/lib/responses";
import { MAX_REQUESTS } from "../../netlify/functions/lib/rateLimit";
import { handler } from "../../netlify/functions/contact";

const validContact = {
  name:    "Ada",
  email:   "ada@example.com",
  message: "I need a landing page for my shop.",
};

// The throttle keys on the caller's address and its counters live in module
// scope, so tests would otherwise spend each other's budget. Giving every test
// its own address is simpler and stricter than resetting shared state — and it
// survives the fact that the CommonJS handler and this ESM test each hold their
// own copy of the limiter module.
let testNo = 0;
beforeEach(() => { testNo += 1; });
const currentIp = () => `203.0.113.${testNo}`;

// Netlify hands the handler a raw string body, never an object.
// The IP is the one the rate limiter keys on: give each test its own so cases
// stay independent of each other's request budget.
function post(body, ip = currentIp()) {
  return handler({
    httpMethod: "POST",
    headers:    { "x-nf-client-connection-ip": ip },
    body:       typeof body === "string" ? body : JSON.stringify(body),
  });
}

// Telegram accepted the message.
const telegramOk = () => Promise.resolve({ json: () => Promise.resolve({ ok: true, result: {} }) });
// Telegram rejected it — this is how a real API-level failure looks.
const telegramFails = (description) => () =>
  Promise.resolve({ json: () => Promise.resolve({ ok: false, description }) });

// The text that actually went out on the wire.
const sentText = () => JSON.parse(global.fetch.mock.calls[0][1].body).text;
const sentToTelegram = () => global.fetch;

beforeEach(() => {
  process.env.TELEGRAM_TOKEN = "test-token";
  process.env.TELEGRAM_CHAT_ID = "-1001234567890";
  global.fetch = vi.fn(telegramOk);
  // The handler logs failures on purpose; keep them out of the test output.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  delete global.fetch;
});

describe("happy path", () => {
  test("accepts a valid submission and reports success", async () => {
    const res = await post(validContact);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
    expect(sentToTelegram()).toHaveBeenCalledTimes(1);
  });

  test("passes every submitted field on to Telegram", async () => {
    await post(validContact);

    expect(sentText()).toContain("Ada");
    expect(sentText()).toContain("ada@example.com");
    expect(sentText()).toContain("I need a landing page for my shop.");
  });

  test("escapes user input so it cannot inject Telegram HTML markup", async () => {
    await post({ ...validContact, name: "<b>Ada</b>", message: "5 < 6 & 7 > 6, please build it." });

    expect(sentText()).toContain("&lt;b&gt;Ada&lt;/b&gt;");
    expect(sentText()).toContain("5 &lt; 6 &amp; 7 &gt; 6");
    // The bold tags that remain are the handler's own formatting, never the user's.
    expect(sentText()).not.toContain("<b>Ada");
  });
});

describe("rejected requests", () => {
  test("refuses anything that is not a POST", async () => {
    const res = await handler({ httpMethod: "GET" });

    expect(res.statusCode).toBe(405);
    expect(sentToTelegram()).not.toHaveBeenCalled();
  });

  test("rejects an invalid payload with 400 and sends nothing", async () => {
    const res = await post({ ...validContact, email: "not-an-email" });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/email/);
    expect(sentToTelegram()).not.toHaveBeenCalled();
  });

  test("rejects an empty payload without throwing", async () => {
    const res = await post({});

    expect(res.statusCode).toBe(400);
    expect(sentToTelegram()).not.toHaveBeenCalled();
  });

  test("answers a honeypot hit with a plain success and sends nothing", async () => {
    // A bot filled the hidden "company" field. It must get no signal that it
    // was spotted, so the status code is indistinguishable from a real success.
    const res = await post({ ...validContact, company: "spam-co" });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
    expect(sentToTelegram()).not.toHaveBeenCalled();
  });
});

describe("the Turnstile challenge", () => {
  // Unconfigured by default in these tests, which is why every other case here
  // gets through without a token — see lib/turnstile.js on failing open.
  test("lets submissions through while no secret is configured", async () => {
    const res = await post(validContact);

    expect(res.statusCode).toBe(200);
  });

  test("refuses a submission with no token once a secret is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x-test-secret";

    const res = await post(validContact);

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body)).toEqual({ error: CHALLENGE_FAILED });
    // Rejected before anything is sent anywhere.
    expect(sentToTelegram()).not.toHaveBeenCalled();

    delete process.env.TURNSTILE_SECRET_KEY;
  });

  test("a honeypot hit never reaches the challenge", async () => {
    // A caught bot must not learn that a challenge exists.
    process.env.TURNSTILE_SECRET_KEY = "0x-test-secret";

    const res = await post({ ...validContact, company: "spam-co" });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });

    delete process.env.TURNSTILE_SECRET_KEY;
  });
});

describe("rate limiting", () => {
  test("lets a normal run of submissions through", async () => {
    for (let i = 0; i < MAX_REQUESTS; i++) {
      const res = await post(validContact);
      expect(res.statusCode).toBe(200);
    }

    expect(sentToTelegram()).toHaveBeenCalledTimes(MAX_REQUESTS);
  });

  test("blocks the request after the budget runs out and sends nothing more", async () => {
    for (let i = 0; i < MAX_REQUESTS; i++) await post(validContact);
    global.fetch.mockClear();

    const res = await post(validContact);

    expect(res.statusCode).toBe(429);
    expect(JSON.parse(res.body)).toEqual({ error: TOO_MANY_REQUESTS });
    // The whole point: a flood must not reach the Telegram chat.
    expect(sentToTelegram()).not.toHaveBeenCalled();
  });

  test("tells the caller how long to wait", async () => {
    for (let i = 0; i < MAX_REQUESTS; i++) await post(validContact);

    const res = await post(validContact);

    expect(Number(res.headers["Retry-After"])).toBeGreaterThan(0);
    expect(Number(res.headers["Retry-After"])).toBeLessThanOrEqual(60);
  });

  test("throttles per IP, so one flooder cannot lock everyone out", async () => {
    for (let i = 0; i < MAX_REQUESTS; i++) await post(validContact, "203.0.113.99");

    const flooder = await post(validContact, "203.0.113.99");
    const bystander = await post(validContact, "198.51.100.7");

    expect(flooder.statusCode).toBe(429);
    expect(bystander.statusCode).toBe(200);
  });

  test("counts rejected submissions too, so retrying junk is not free", async () => {
    // Otherwise a flooder just posts invalid payloads and pays nothing.
    for (let i = 0; i < MAX_REQUESTS; i++) await post({ ...validContact, email: "nope" });

    const res = await post(validContact);

    expect(res.statusCode).toBe(429);
  });

  test("keys on the header Netlify sets, not on a client-supplied one", async () => {
    // x-forwarded-for is caller-controlled: if it outranked the edge header,
    // rotating it would defeat the limiter outright.
    const spoofed = (i) => handler({
      httpMethod: "POST",
      headers: {
        "x-nf-client-connection-ip": "203.0.113.50",
        "x-forwarded-for":           `10.0.0.${i}`,
      },
      body: JSON.stringify(validContact),
    });

    for (let i = 0; i < MAX_REQUESTS; i++) await spoofed(i);

    expect((await spoofed(99)).statusCode).toBe(429);
  });
});

describe("failures stay opaque to the caller", () => {
  test("does not echo a Telegram rejection back to the client", async () => {
    global.fetch.mockImplementation(telegramFails("Bad Request: chat not found"));

    const res = await post(validContact);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: GENERIC_ERROR });
    expect(res.body).not.toContain("chat not found");
  });

  test("does not reveal that the function is missing its credentials", async () => {
    // The real misconfiguration, not a simulated one: no env vars at all. This
    // is the case that used to leak "Telegram credentials not configured" to
    // anyone who posted the form.
    delete process.env.TELEGRAM_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const res = await post(validContact);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: GENERIC_ERROR });
    expect(res.body).not.toContain("credentials");
    // It must fail before reaching the network, not after.
    expect(sentToTelegram()).not.toHaveBeenCalled();
  });

  test("reports a malformed JSON body as the caller's mistake", async () => {
    const res = await post("not-json");

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ error: INVALID_JSON });
    expect(sentToTelegram()).not.toHaveBeenCalled();
  });

  test("still logs the detail server-side", async () => {
    global.fetch.mockImplementation(telegramFails("Bad Request: chat not found"));

    await post(validContact);

    // Hiding the text from the caller must not hide it from the operator.
    expect(console.error).toHaveBeenCalledWith(
      "contact function error:",
      expect.objectContaining({ message: "Bad Request: chat not found" })
    );
  });
});
