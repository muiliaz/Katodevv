const { sendMessage, escapeHtml } = require('./lib/telegram');
const { isHoneypotFilled, validateLead } = require('./lib/validation');
const { GENERIC_ERROR } = require('./lib/responses');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    // Silent success for bots — see contact.js.
    if (isHoneypotFilled(body)) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    const errors = validateLead(body);
    if (errors.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: errors.join(', ') }),
      };
    }

    const {
      type, projectType, budget, deadline,
      contact, freeText, timestamp, name,
    } = body;

    const lines = ['🔔 <b>Новая заявка с чат-виджета</b>\n'];
    if (type)        lines.push(`📌 <b>Тип:</b> ${escapeHtml(type)}`);
    if (name)        lines.push(`👤 <b>Имя:</b> ${escapeHtml(name)}`);
    if (projectType) lines.push(`🛠 <b>Что нужно:</b> ${escapeHtml(projectType)}`);
    if (budget)      lines.push(`💰 <b>Бюджет:</b> ${escapeHtml(budget)}`);
    if (deadline)    lines.push(`⏱ <b>Срок:</b> ${escapeHtml(deadline)}`);
    if (contact)     lines.push(`📱 <b>Контакт:</b> ${escapeHtml(contact)}`);
    if (freeText)    lines.push(`\n💬 <b>Сообщение:</b> ${escapeHtml(freeText)}`);
    if (timestamp)   lines.push(`\n🕐 ${escapeHtml(timestamp)}`);

    await sendMessage(lines.join('\n'));

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    // Generic on the wire, detailed in the logs — see contact.js.
    console.error('lead function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: GENERIC_ERROR }) };
  }
};
