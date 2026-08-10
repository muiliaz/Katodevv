const { sendMessage, escapeHtml } = require("./lib/telegram");
const { isHoneypotFilled, validateLead } = require("./lib/validation");
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

  // Own budget, separate from contact's — see rateLimit.js.
  const limit = checkRateLimit(event, "lead");
  if (!limit.allowed) {
    return {
      statusCode: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
      body: JSON.stringify({ error: TOO_MANY_REQUESTS }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: INVALID_JSON }) };
  }

  try {
    // Silent success for bots — see contact.js.
    if (isHoneypotFilled(body)) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Order and reasoning as in contact.js.
    const challenge = await verifyTurnstile(body.turnstileToken, clientIp(event?.headers));
    if (!challenge.ok) {
      return { statusCode: 403, body: JSON.stringify({ error: CHALLENGE_FAILED }) };
    }

    const errors = validateLead(body);
    if (errors.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: errors.join(", ") }),
      };
    }

    const { type, projectType, budget, deadline, contact, freeText, timestamp, name } = body;

    const lines = ["🔔 <b>Новая заявка с чат-виджета</b>\n"];
    if (type) lines.push(`📌 <b>Тип:</b> ${escapeHtml(type)}`);
    if (name) lines.push(`👤 <b>Имя:</b> ${escapeHtml(name)}`);
    if (projectType) lines.push(`🛠 <b>Что нужно:</b> ${escapeHtml(projectType)}`);
    if (budget) lines.push(`💰 <b>Бюджет:</b> ${escapeHtml(budget)}`);
    if (deadline) lines.push(`⏱ <b>Срок:</b> ${escapeHtml(deadline)}`);
    if (contact) lines.push(`📱 <b>Контакт:</b> ${escapeHtml(contact)}`);
    if (freeText) lines.push(`\n💬 <b>Сообщение:</b> ${escapeHtml(freeText)}`);
    if (timestamp) lines.push(`\n🕐 ${escapeHtml(timestamp)}`);

    await sendMessage(lines.join("\n"));

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    // Generic on the wire, detailed in the logs — see contact.js.
    console.error("lead function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: GENERIC_ERROR }) };
  }
};
