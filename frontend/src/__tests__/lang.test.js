// The dictionary contract, and the safety net under splitting it up.
//
// tech-health TH-004: LangContext.jsx was 586 lines of two parallel
// dictionaries. Splitting them into per-language files is a pure move, and the
// failure mode of getting it wrong is the nastiest one in the project — a
// missing key is not a build error, it is `undefined` rendered to a visitor, or
// a TypeError the moment someone opens the page in the other language. A green
// build proves nothing about it.
//
// So this compares the two trees against each other, key path by key path,
// instead of trusting either one.
import { T, TEAM } from "../shared/LangContext";

const LANGS = Object.keys(T);

// Every leaf path in the tree, e.g. "hero.cycleWords.0" or "about.teamTitle".
// Arrays are walked by index on purpose: `hero.cycleWords` having four entries
// in English and three in Russian is exactly the kind of drift worth failing on.
function leafPaths(node, prefix = "") {
  if (node === null || typeof node !== "object") return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key)
  );
}

function leafAt(node, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], node);
}

test("the project ships the two languages the UI switches between", () => {
  expect(LANGS.sort()).toEqual(["en", "ru"]);
});

describe("en and ru describe the same tree", () => {
  // Both directions, and as a set difference rather than a length check, so the
  // failure message names the key that is missing instead of a number.
  const paths = Object.fromEntries(LANGS.map((lang) => [lang, new Set(leafPaths(T[lang]))]));

  test.each(LANGS)("%s has no key the other language lacks", (lang) => {
    const other = LANGS.find((l) => l !== lang);
    const missing = [...paths[lang]].filter((p) => !paths[other].has(p));

    expect(missing).toEqual([]);
  });
});

// Not every leaf is copy: the bot script carries `delay` in milliseconds and a
// tariff carries `featured: true`. Those are data the components act on, and
// the check below has to let them through without letting a blank string past.
const isStructural = (value) => typeof value === "boolean" || Number.isFinite(value);

describe("every leaf is copy a visitor can read", () => {
  test.each(LANGS)("%s has no blank string, null or undefined", (lang) => {
    const blank = leafPaths(T[lang]).filter((path) => {
      const value = leafAt(T[lang], path);
      if (isStructural(value)) return false;
      return typeof value !== "string" || value.trim() === "";
    });

    expect(blank).toEqual([]);
  });

  test.each(LANGS)("%s uses the same leaf kinds as the other language", (lang) => {
    const other = LANGS.find((l) => l !== lang);
    // Catches a translation that turned a number into its own string — the
    // Russian delay written as "600" would still be a present, non-blank leaf.
    const mismatched = leafPaths(T[lang]).filter(
      (path) => typeof leafAt(T[lang], path) !== typeof leafAt(T[other], path)
    );

    expect(mismatched).toEqual([]);
  });
});

describe("the parts other code indexes into by hand", () => {
  // Services.jsx maps card index -> icon, demo component and a fixed id, and
  // Contact/Hero read fixed keys. These are the couplings that break quietly.
  test.each(LANGS)("%s keeps four service cards, in the order the demos assume", (lang) => {
    expect(T[lang].services.cards).toHaveLength(4);
    // The fourth is the bot card: it gets its own component, badge and terminal.
    expect(T[lang].services.cards[3].title).toMatch(/bot|бот/i);
  });

  test.each(LANGS)("%s keeps three hub cards keyed for the three routes", (lang) => {
    expect(T[lang].hub.cards.map((c) => c.key).sort()).toEqual(["apps", "bots", "web"]);
  });

  test.each(LANGS)("%s keeps a level label for every level the team uses", (lang) => {
    for (const member of TEAM) {
      expect(T[lang].about.levelLabel[member.level]).toBeTruthy();
    }
  });
});

describe("the team list", () => {
  test("every member is described in both languages", () => {
    for (const member of TEAM) {
      expect(member.name).toBeTruthy();
      // roleEn/roleRu and expEn/expRu are the translated halves; a member added
      // with only one of each renders a blank line on the other language.
      for (const field of ["roleEn", "roleRu", "expEn", "expRu"]) {
        expect(member[field], `${member.name}.${field}`).toBeTruthy();
      }
      expect(member.skills.length).toBeGreaterThan(0);
    }
  });

  test("the About copy's headcount matches the list", () => {
    // "5 Qualified Specialists" is written out rather than templated, so it can
    // fall out of step with TEAM the first time someone joins or leaves.
    for (const lang of LANGS) {
      expect(T[lang].demos.about.teamCount).toContain(String(TEAM.length));
    }
  });
});
