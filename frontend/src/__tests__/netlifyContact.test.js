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
const { GENERIC_ERROR } = require("../../netlify/functions/lib/responses");
const { handler } = require("../../netlify/functions/contact");

const validContact = {
  name:    "Ada",
  email:   "ada@example.com",
  message: "I need a landing page for my shop.",
};

// Netlify hands the handler a raw string body, never an object.
function post(body) {
  return handler({
    httpMethod: "POST",
    body:       typeof body === "string" ? body : JSON.stringify(body),
  });
}

const sentText = () => sendMessage.mock.calls[0][0];

beforeEach(() => {
  sendMessage.mockReset();
  sendMessage.mockResolvedValue({ ok: true });
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

  test("survives a malformed JSON body", async () => {
    const res = await post("not-json");

    // Documents current behaviour: the JSON.parse sits inside the same try as
    // the rest, so a bad body is reported as a server error rather than a 400.
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: GENERIC_ERROR });
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
