const { sendMessage } = require('./lib/telegram');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const {
      type, projectType, budget, deadline,
      contact, freeText, timestamp, name,
    } = JSON.parse(event.body);

    const lines = ['🔔 *Новая заявка с чат-виджета*\n'];
    if (type)        lines.push(`📌 *Тип:* ${type}`);
    if (name)        lines.push(`👤 *Имя:* ${name}`);
    if (projectType) lines.push(`🛠 *Что нужно:* ${projectType}`);
    if (budget)      lines.push(`💰 *Бюджет:* ${budget}`);
    if (deadline)    lines.push(`⏱ *Срок:* ${deadline}`);
    if (contact)     lines.push(`📱 *Контакт:* ${contact}`);
    if (freeText)    lines.push(`\n💬 *Сообщение:* ${freeText}`);
    if (timestamp)   lines.push(`\n🕐 ${timestamp}`);

    await sendMessage(lines.join('\n'));

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('lead function error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
