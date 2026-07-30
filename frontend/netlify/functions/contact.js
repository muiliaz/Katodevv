const { sendMessage, escapeHtml } = require('./lib/telegram');
const { isHoneypotFilled, validateContact } = require('./lib/validation');

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
    console.error('contact function error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
