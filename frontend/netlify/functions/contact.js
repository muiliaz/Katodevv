const { sendMessage } = require('./lib/telegram');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { name, email, message } = JSON.parse(event.body);

    const text =
      `📩 *Новая заявка с сайта katodevv.com*\n\n` +
      `👤 *Имя:* ${name}\n` +
      `📧 *Email:* ${email}\n` +
      `💬 *Сообщение:*\n${message}`;

    await sendMessage(text);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('contact function error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
