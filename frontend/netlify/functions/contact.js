const { sendMessage, escapeHtml } = require('./lib/telegram');
const { isHoneypotFilled, validateContact } = require('./lib/validation');
const { GENERIC_ERROR } = require('./lib/responses');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);

    // Answer bots with a plain success so they get no signal to retry or
    // to work out which field gave them away. Nothing is sent to Telegram.
    if (isHoneypotFilled(body)) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    const errors = validateContact(body);
    if (errors.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: errors.join(', ') }),
      };
    }

    const { name, email, message } = body;

    const text =
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
    console.error('contact function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: GENERIC_ERROR }) };
  }
};
