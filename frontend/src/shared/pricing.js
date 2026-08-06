// Single source of truth for every price and the promised response time.
//
// Before this file the same product carried different prices on different
// surfaces — Mini App was "from $400–600" on the /bots tariff cards and
// "from $1500" in the chat widget, and a visitor could see both without
// leaving the page. The response time was one hour in the chat and 24 hours
// in six other places.
//
// So: prices live here as numbers, and every surface renders them through
// formatPrice(). Nothing else in src/ may hard-code a dollar amount —
// pricing.test.js scans for that and fails.
//
// Values chosen by the repository owner on 2026-08-06 (the lower of the two
// sets that were in the code). See audit-fixes/10-unify-prices.md.

export const PRICING = {
  // Bot tariffs — shown on /bots, in the /web terminal and in the chat
  'tg-bot':         { from: 100 },
  'booking-bot':    { from: 300, to: 400 },
  'ai-bot':         { from: 600, to: 800 },
  'mini-app':       { from: 400, to: 600 },
  'automation-pro': { from: 1500, to: 2000 },

  // Shown in the /web terminal only. Kept separate from automation-pro on
  // purpose: the two have different names and nothing in the repo says whether
  // they are the same product, so merging them would be a guess about the
  // product line, not a fix for the price divergence.
  'shop-bot':       { from: 600 },
  'custom-ai':      { from: 2000 },

  // Shown in the chat price list only
  'landing':        { from: 400 },
  'business-site':  { from: 800 },
  'ecommerce':      { from: 1500 },
  'mobile-app':     { from: 3000 },
  'automation':     { from: 300 },
};

// Hours we promise to answer within. Used by the chat and the contact copy.
export const RESPONSE_SLA_HOURS = 24;

const PREFIX = { ru: 'от', en: 'from' };

/**
 * "от $600–800" / "from $600–800". An en dash, matching the existing copy.
 */
export function formatPrice(id, lang = 'ru') {
  const entry = PRICING[id];
  if (!entry) throw new Error(`Unknown price id: ${id}`);

  const range = entry.to ? `$${entry.from}–${entry.to}` : `$${entry.from}`;
  return `${PREFIX[lang] ?? PREFIX.en} ${range}`;
}

/**
 * Same, without the "from"/"от" prefix — for the aligned terminal columns
 * where the prefix is laid out separately.
 */
export function priceOnly(id) {
  const entry = PRICING[id];
  if (!entry) throw new Error(`Unknown price id: ${id}`);
  return entry.to ? `$${entry.from}–${entry.to}` : `$${entry.from}`;
}
