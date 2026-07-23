exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const {
      type, projectType, budget, deadline,
      contact, freeText, timestamp, name,
    } = JSON.parse(event.body);

    const TOKEN   = process.env.TELEGRAM_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TOKEN || !CHAT_ID) {
      throw new Error('Telegram credentials not configured');
    }

    const lines = ['🔔 *Новая заявка с чат-виджета*\n'];
    if (type)        lines.push(`📌 *Тип:* ${type}`);
    if (name)        lines.push(`👤 *Имя:* ${name}`);
    if (projectType) lines.push(`🛠 *Что нужно:* ${projectType}`);
    if (budget)      lines.push(`💰 *Бюджет:* ${budget}`);
    if (deadline)    lines.push(`⏱ *Срок:* ${deadline}`);
    if (contact)     lines.push(`📱 *Контакт:* ${contact}`);
    if (freeText)    lines.push(`\n💬 *Сообщение:* ${freeText}`);
    if (timestamp)   lines.push(`\n🕐 ${timestamp}`);

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    CHAT_ID,
        text:       lines.join('\n'),
        parse_mode: 'Markdown',
      }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.description);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('lead function error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
