// Tests for the public contact endpoint, exercised through its exported
// handler(event) the same way Netlify invokes it.
//
// Like netlifyValidation.test.js, this lives under src/ because create-react-app's
// Jest setup only picks up test files there; the handler itself is imported from
// the functions folder.
//
// Only sendMessage is mocked. escapeHtml stays real, so the assertions about the
// outgoing message text prove the actual escaping the endpoint performs.
jest.mock("../../netlify/functions/lib/telegram", () => {
  const actual = jest.requireActual("../../netlify/functions/lib/telegram");
  return { ...actual, sendMessage: jest.fn() };
});

const { sendMessage } = require("../../netlify/functions/lib/telegram");
const { GENERIC_ERROR, INVALID_JSON, TOO_MANY_REQUESTS } = require("../../netlify/functions/lib/responses");
const { resetRateLimit, MAX_REQUESTS } = require("../../netlify/functions/lib/rateLimit");
const { handler } = require("../../netlify/functions/contact");

const validContact = {
  name:    "Ada",
  email:   "ada@example.com",
  message: "I need a landing page for my shop.",
};

// Netlify hands the handler a raw string body, never an object.
// The IP is the one the rate limiter keys on: give each test its own so cases
// stay independent of each other's request budget.
function post(body, ip = "203.0.113.1") {
  return handler({
    httpMethod: "POST",
    headers:    { "x-nf-client-connection-ip": ip },
    body:       typeof body === "string" ? body : JSON.stringify(body),
  });
}

const sentText = () => sendMessage.mock.calls[0][0];

beforeEach(() => {
  sendMessage.mockReset();
  sendMessage.mockResolvedValue({ ok: true });
  // Rate-limit state is module-level and survives between tests by design.
  resetRateLimit();
  // The handler logs failures on purpose; keep them out of the test output.
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("happy path", () => {
  test("accepts a valid submission and reports success", async () => {
    const res = await post(validContact);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
    expect(sendMessage).toHaveBeenCalledTimes(1);
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
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("rejects an invalid payload with 400 and sends nothing", async () => {
    const res = await post({ ...validContact, email: "not-an-email" });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/email/);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("rejects an empty payload without throwing", async () => {
    const res = await post({});

    expect(res.statusCode).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("answers a honeypot hit with a plain success and sends nothing", async () => {
    // A bot filled the hidden "company" field. It must get no signal that it
    // was spotted, so the status code is indistinguishable from a real success.
    const res = await post({ ...validContact, company: "spam-co" });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

describe("rate limiting", () => {
  test("lets a normal run of submissions through", async () => {
    for (let i = 0; i < MAX_REQUESTS; i++) {
      const res = await post(validContact);
      expect(res.statusCode).toBe(200);
    }

    expect(sendMessage).toHaveBeenCalledTimes(MAX_REQUESTS);
  });

  test("blocks the request after the budget runs out and sends nothing more", async () => {
    for (let i = 0; i < MAX_REQUESTS; i++) await post(validContact);
    sendMessage.mockClear();

    const res = await post(validContact);

    expect(res.statusCode).toBe(429);
    expect(JSON.parse(res.body)).toEqual({ error: TOO_MANY_REQUESTS });
    // The whole point: a flood must not reach the Telegram chat.
    expect(sendMessage).not.toHaveBeenCalled();
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
    sendMessage.mockRejectedValue(new Error("Bad Request: chat not found"));

    const res = await post(validContact);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: GENERIC_ERROR });
    expect(res.body).not.toContain("chat not found");
  });

  test("does not reveal that the function is missing its credentials", async () => {
    sendMessage.mockRejectedValue(new Error("Telegram credentials not configured"));

    const res = await post(validContact);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: GENERIC_ERROR });
    expect(res.body).not.toContain("credentials");
  });

  test("reports a malformed JSON body as the caller's mistake", async () => {
    const res = await post("not-json");

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ error: INVALID_JSON });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("still logs the detail server-side", async () => {
    sendMessage.mockRejectedValue(new Error("Bad Request: chat not found"));

    await post(validContact);

    // Hiding the text from the caller must not hide it from the operator.
    expect(console.error).toHaveBeenCalledWith(
      "contact function error:",
      expect.objectContaining({ message: "Bad Request: chat not found" })
    );
  });
});
