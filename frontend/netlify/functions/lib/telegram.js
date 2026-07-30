// Shared Telegram helpers for the contact/ and lead/ functions.
//
// This lives in lib/ on purpose: Netlify only turns a subdirectory into a
// function when it contains an entry file named after the directory (or
// index.js), so lib/telegram.js is bundled as shared code, not deployed as
// its own endpoint.

const TELEGRAM_API = 'https://api.telegram.org';

// Read the bot credentials and fail loudly if the function is misconfigured.
// Without this, a missing env var only surfaces as a confusing 404/401 from
// the Telegram API.
function getCredentials() {
  const token   = process.env.TELEGRAM_TOKEN;
  const chatId  = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Telegram credentials not configured');
  }

  return { token, chatId };
}

// Send a message to the configured chat. Throws on both transport errors and
// Telegram-level failures so callers only have to handle one path.
async function sendMessage(text) {
  const { token, chatId } = getCredentials();

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:    chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.description);

  return data;
}

module.exports = { sendMessage };
