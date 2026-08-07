// Guards the single source of truth for prices and the response-time promise.
//
// The point is not to check that formatPrice concatenates strings — it is to
// fail the build if someone types a dollar amount straight into a UI file
// again. That is how the surfaces drifted apart in the first place: the /bots
// tariff card said Mini App "from $400–600" while the chat widget, reachable
// from that same page, said "from $1500".
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { PRICING, RESPONSE_SLA_HOURS, formatPrice, priceOnly } from "../shared/pricing";

// __dirname does not exist in ESM; Vitest exposes the module URL instead.
const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Files that render prices or the response-time promise to a visitor.
const SURFACES = [
  "shared/LangContext.jsx",
  "shared/ChatWidget/chatScenarios.js",
  "pages/web/Services.jsx",
];

const read = (rel) => fs.readFileSync(path.join(SRC, rel), "utf8");

describe("formatPrice", () => {
  test("renders a single amount", () => {
    expect(formatPrice("tg-bot", "ru")).toBe("от $100");
    expect(formatPrice("tg-bot", "en")).toBe("from $100");
  });

  test("renders a range with an en dash", () => {
    expect(formatPrice("mini-app", "ru")).toBe("от $400–600");
    expect(formatPrice("ai-bot", "en")).toBe("from $600–800");
  });

  test("defaults to Russian and drops the prefix on request", () => {
    expect(formatPrice("ai-bot")).toBe("от $600–800");
    expect(priceOnly("ai-bot")).toBe("$600–800");
  });

  test("refuses an unknown id instead of rendering undefined", () => {
    // A typo must fail loudly at render, not print "$undefined" to a visitor.
    expect(() => formatPrice("no-such-product")).toThrow(/Unknown price id/);
  });
});

// A quoted price always carries the prefix — "от $800" / "from $800". Matching
// on the prefix rather than on any "$" keeps the demo mockups out of it: those
// files are full of fake transactions ("-$42.50"), balances ("$12,450.00") and
// dashboard stats ("143h") that are stage dressing, not offers.
// Note the /u flag and \p{L} instead of \b: JavaScript's \b is ASCII-only, so
// "\bот" never matches after a space — the Cyrillic "о" is not a \w character.
// The first version of this test used \b and silently passed a re-introduced
// "от $800", which is exactly the failure it exists to prevent.
const QUOTED_PRICE = /(?:^|[^\p{L}])(?:от|from)\s*\$\s*\d/giu;

// The promise, in the four shapes the copy uses: "within 24 hours",
// "24h response time", "в течение 24 часов", "за 24 часа".
const SLA_MENTION = /(?:within\s+(\d+)\s*hours?|(\d+)\s*h\s+response|в течение\s+(\d+)\s*час|за\s+(\d+)\s*час)/gi;

const slaHoursIn = (src) =>
  [...src.matchAll(SLA_MENTION)].map((m) => Number(m[1] ?? m[2] ?? m[3] ?? m[4]));

describe("no surface hard-codes a quoted price", () => {
  test.each(SURFACES)("%s", (rel) => {
    // This is the guard that matters: the surfaces drifted apart because each
    // one carried its own literal. Every one must now go through formatPrice.
    expect(read(rel).match(QUOTED_PRICE) ?? []).toEqual([]);
  });
});

describe("the response-time promise agrees everywhere", () => {
  // Kept as plain copy rather than templated, because Russian numeral
  // agreement makes interpolation fragile — so it is checked here instead.
  test.each(SURFACES)("%s", (rel) => {
    for (const hours of slaHoursIn(read(rel))) {
      expect(hours).toBe(RESPONSE_SLA_HOURS);
    }
  });

  test("the copy actually states it, so the check cannot pass vacuously", () => {
    const stated = SURFACES.flatMap((rel) => slaHoursIn(read(rel)));

    expect(stated.length).toBeGreaterThan(0);
    expect(new Set(stated)).toEqual(new Set([RESPONSE_SLA_HOURS]));
  });
});

describe("the price table itself", () => {
  test("every entry has a numeric floor, and a range that goes upward", () => {
    for (const entry of Object.values(PRICING)) {
      expect(typeof entry.from).toBe("number");
      expect(entry.from).toBeGreaterThan(0);
      if (entry.to !== undefined) expect(entry.to).toBeGreaterThan(entry.from);
    }
  });

  test("holds the values the owner chose on 2026-08-06", () => {
    // Pinned so a later edit is a deliberate act with a visible diff.
    expect(PRICING["tg-bot"]).toEqual({ from: 100 });
    expect(PRICING["booking-bot"]).toEqual({ from: 300, to: 400 });
    expect(PRICING["ai-bot"]).toEqual({ from: 600, to: 800 });
    expect(PRICING["mini-app"]).toEqual({ from: 400, to: 600 });
    expect(PRICING["automation-pro"]).toEqual({ from: 1500, to: 2000 });
  });
});
