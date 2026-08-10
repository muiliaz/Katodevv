const { sendMessage, escapeHtml } = require("./lib/telegram");
const { isHoneypotFilled, validateContact } = require("./lib/validation");
const { checkRateLimit, clientIp } = require("./lib/rateLimit");
const { verifyTurnstile } = require("./lib/turnstile");
const {
  GENERIC_ERROR,
  INVALID_JSON,
  TOO_MANY_REQUESTS,
  CHALLENGE_FAILED,
} = require("./lib/responses");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Before parsing, so a flood costs us as little work as possible.
  const limit = checkRateLimit(event, "contact");
  if (!limit.allowed) {
    return {
      statusCode: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
      body: JSON.stringify({ error: TOO_MANY_REQUESTS }),
    };
  }

  // Parsed outside the try below so a bad body reads as the caller's 400 rather
  // than being swallowed by the catch that reports internal failures as a 500.
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: INVALID_JSON }) };
  }

  try {
    // Answer bots with a plain success so they get no signal to retry or
    // to work out which field gave them away. Nothing is sent to Telegram.
    if (isHoneypotFilled(body)) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // After the honeypot — a caught bot should not learn that a challenge
    // exists — and before validation, so a failed challenge costs nothing.
    const challenge = await verifyTurnstile(body.turnstileToken, clientIp(event?.headers));
    if (!challenge.ok) {
      return { statusCode: 403, body: JSON.stringify({ error: CHALLENGE_FAILED }) };
    }

    const errors = validateContact(body);
    if (errors.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: errors.join(", ") }),
      };
    }

    const { name, email, message } = body;

    const text =
      // Domain is duplicated here on purpose: requiring src/shared/site.js would
      // make the deployed function depend on Netlify bundling a file from outside
      // netlify/functions, and this is the enquiry path. contracts.test.js fails
      // if this string and SITE_URL ever disagree.
      `📩 <b>Новая заявка с сайта katodevv.com</b>\n\n` +
      `👤 <b>Имя:</b> ${escapeHtml(name)}\n` +
      `📧 <b>Email:</b> ${escapeHtml(email)}\n` +
      `💬 <b>Сообщение:</b>\n${escapeHtml(message)}`;

    await sendMessage(text);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    // Keep the detail server-side only. The message can name a missing env var
    // or quote Telegram's own error, which tells an outside caller whether the
    // function is misconfigured or the bot rejected the payload — free recon.
    // Validation errors above are still returned verbatim: those describe the
    // caller's own input, not our internals.
    console.error("contact function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: GENERIC_ERROR }) };
  }
};
