// Tests for the public lead endpoint — the one the chat widget and the /bots
// modal post to. See netlifyContact.test.js for why these live under src/ and
// why only sendMessage is mocked.
jest.mock("../../netlify/functions/lib/telegram", () => {
  const actual = jest.requireActual("../../netlify/functions/lib/telegram");
  return { ...actual, sendMessage: jest.fn() };
});

const { sendMessage } = require("../../netlify/functions/lib/telegram");
const { GENERIC_ERROR, INVALID_JSON, TOO_MANY_REQUESTS } = require("../../netlify/functions/lib/responses");
const { resetRateLimit, MAX_REQUESTS } = require("../../netlify/functions/lib/rateLimit");
const { handler: contactHandler } = require("../../netlify/functions/contact");
const { handler } = require("../../netlify/functions/lead");

// Shaped like what ChatWidget actually collects: see chatScenarios.js.
const validLead = {
  type:        "project",
  projectType: "Сайт",
  budget:      "$1000–3000",
  deadline:    "Месяц",
  contact:     "@ada",
  timestamp:   "05.08.2026, 12:00",
};

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
  resetRateLimit();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("happy path", () => {
  test("accepts a full chat-widget lead and reports success", async () => {
    const res = await post(validLead);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  test("passes every collected answer on to Telegram", async () => {
    await post(validLead);

    expect(sentText()).toContain("Сайт");
    expect(sentText()).toContain("$1000–3000");
    expect(sentText()).toContain("Месяц");
    expect(sentText()).toContain("@ada");
  });

  test("carries the name the /bots modal collects", async () => {
    // ChatWidget never asks for a name, but the /bots modal does — see Bots.js.
    await post({ ...validLead, name: "Ada Lovelace" });

    expect(sentText()).toContain("Ada Lovelace");
  });

  test("accepts the minimum the validator allows — a contact on its own", async () => {
    const res = await post({ contact: "ada@example.com" });

    expect(res.statusCode).toBe(200);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sentText()).toContain("ada@example.com");
  });

  test("leaves out the lines for answers the visitor never gave", async () => {
    // The chat can end early — the message must not carry empty labels.
    await post({ contact: "@ada" });

    expect(sentText()).not.toContain("Бюджет");
    expect(sentText()).not.toContain("Срок");
    expect(sentText()).not.toContain("Что нужно");
  });

  test("escapes user input so it cannot inject Telegram HTML markup", async () => {
    await post({ contact: "@ada", freeText: "<b>build</b> a & b" });

    expect(sentText()).toContain("&lt;b&gt;build&lt;/b&gt; a &amp; b");
    expect(sentText()).not.toContain("<b>build");
  });
});

describe("rejected requests", () => {
  test("refuses anything that is not a POST", async () => {
    const res = await handler({ httpMethod: "GET" });

    expect(res.statusCode).toBe(405);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("rejects a lead with no contact — it would be unusable", async () => {
    const res = await post({ projectType: "Сайт", budget: "$1000–3000" });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/contact/);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("rejects an oversized free-text field", async () => {
    const res = await post({ contact: "@ada", freeText: "x".repeat(5001) });

    expect(res.statusCode).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("answers a honeypot hit with a plain success and sends nothing", async () => {
    const res = await post({ ...validLead, company: "spam-co" });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

describe("rate limiting", () => {
  test("blocks the request after the budget runs out and sends nothing more", async () => {
    for (let i = 0; i < MAX_REQUESTS; i++) await post(validLead);
    sendMessage.mockClear();

    const res = await post(validLead);

    expect(res.statusCode).toBe(429);
    expect(JSON.parse(res.body)).toEqual({ error: TOO_MANY_REQUESTS });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("keeps its own budget, separate from the contact form", async () => {
    // A visitor who used the contact form must still be able to open the chat
    // widget — the two are different journeys, so they must not share a counter.
    for (let i = 0; i < MAX_REQUESTS; i++) {
      await contactHandler({
        httpMethod: "POST",
        headers:    { "x-nf-client-connection-ip": "203.0.113.77" },
        body:       JSON.stringify({
          name: "Ada", email: "ada@example.com", message: "I need a landing page for my shop.",
        }),
      });
    }

    const res = await post(validLead, "203.0.113.77");

    expect(res.statusCode).toBe(200);
  });
});

describe("failures stay opaque to the caller", () => {
  test("does not echo a Telegram rejection back to the client", async () => {
    sendMessage.mockRejectedValue(new Error("Forbidden: bot was blocked by the user"));

    const res = await post(validLead);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: GENERIC_ERROR });
    expect(res.body).not.toContain("blocked");
  });

  test("reports a malformed JSON body as the caller's mistake", async () => {
    const res = await post("not-json");

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ error: INVALID_JSON });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("still logs the detail server-side", async () => {
    sendMessage.mockRejectedValue(new Error("Forbidden: bot was blocked by the user"));

    await post(validLead);

    expect(console.error).toHaveBeenCalledWith(
      "lead function error:",
      expect.objectContaining({ message: "Forbidden: bot was blocked by the user" })
    );
  });
});
