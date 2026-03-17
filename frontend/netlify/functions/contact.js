exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { name, email, message } = JSON.parse(event.body);

    const TOKEN   = process.env.TELEGRAM_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const text =
      `📩 *Новая заявка с сайта katodevv.com*\n\n` +
      `👤 *Имя:* ${name}\n` +
      `📧 *Email:* ${email}\n` +
      `💬 *Сообщение:*\n${message}`;

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.description);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
