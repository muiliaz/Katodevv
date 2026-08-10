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
  // "Custom Automation" on /bots. Same floor as custom-ai below — see the note
  // there.
  'automation-pro': { from: 1000 },

  // Shown in the /web terminal only.
  'shop-bot':       { from: 600 },

  // "Custom AI agent". Still a separate id from automation-pro: the two are
  // named differently and sold on different pages, and merging them would be a
  // decision about the product line, not about prices. What the owner did
  // decide, on 2026-08-08, is the price — the two used to quote $2000 and
  // $1500–2000 for work a customer could not tell apart, so both now start at
  // the same $1000. See docs/handoff.md.
  'custom-ai':      { from: 1000 },

  // Shown in the chat price list only
  'landing':        { from: 400 },
  'business-site':  { from: 800 },
  'ecommerce':      { from: 1500 },
  'mobile-app':     { from: 3000 },
  'automation':     { from: 300 },
};

// Hours we promise to answer within. Used by the chat and the contact copy.
//
// This deliberately overlaps the working hours next to it on /web — "Mon–Fri ·
// 9:00–18:00" and "we answer within 24 hours" cannot both hold for an enquiry
// that arrives on Friday evening. The audit raised it as a contradiction to
// resolve; the owner's decision on 2026-08-08 was to keep both lines as they
// are. So: not an oversight, and not something to "fix" by trimming either one.
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
