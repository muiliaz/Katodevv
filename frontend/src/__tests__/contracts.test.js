import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { HONEYPOT_FIELD } from "../../netlify/functions/lib/validation";
import { SITE_URL } from "../shared/site";

// Contract tests: values that must agree across files with no import between
// them, where a rename on one side fails silently on the other.
//
// config-hygiene put the goal this way:
//
//   "Переименование ключа требует изменения одного места или приводит к
//    понятному падению теста."
//
// Some of these genuinely cannot share a source — index.html and sitemap.xml
// are served as static files, before any JavaScript exists. So the agreement is
// checked by reading the files, which is exactly what a partial rename breaks.

const FRONTEND = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => fs.readFileSync(path.join(FRONTEND, rel), "utf8");

describe("the honeypot field name", () => {
  // The server decides a submission is automated by looking at one field name.
  // Rename an input in a form and the server stops catching bots — silently,
  // with no error anywhere. That is the failure this exists for.
  const FORMS = ["src/pages/web/Contact.jsx", "src/pages/bots/Bots.jsx"];

  test.each(FORMS)("%s renders an input named after the server's field", (rel) => {
    expect(read(rel)).toContain(`name="${HONEYPOT_FIELD}"`);
  });

  test.each(FORMS)("%s sends that field in the request body", (rel) => {
    // Rendering it is not enough — it also has to reach the function.
    expect(read(rel)).toMatch(new RegExp(`${HONEYPOT_FIELD}\\s*:`));
  });

  test("the validator still checks the field the forms render", () => {
    // Pins the name itself, so changing it becomes a deliberate act across
    // three files rather than a silent one-sided rename.
    expect(HONEYPOT_FIELD).toBe("company");
  });
});

describe("the canonical site URL", () => {
  const HOST = new URL(SITE_URL).host;

  test("the React side imports it rather than repeating it", () => {
    const src = read("src/shared/Seo.jsx");

    expect(src).not.toMatch(/https:\/\/katodevv\.com/);
    expect(src).toMatch(/from ['"]\.\/site['"]/);
  });

  test("the Telegram notification names the same host", () => {
    // contact.js keeps the domain as a literal deliberately: requiring a file
    // from outside netlify/functions would make the deployed function depend on
    // Netlify's bundler reaching into src/, and this is the enquiry path. This
    // assertion is what stops the two from drifting apart instead.
    expect(read("netlify/functions/contact.js")).toContain(HOST);
  });

  test.each([
    "index.html",
    "public/sitemap.xml",
    "public/robots.txt",
  ])("%s points at the same host", (rel) => {
    const src = read(rel);

    // Listing third-party hosts to ignore would need updating every time a
    // font or an analytics script is added. Matching our own name instead is
    // precise: it catches the half-finished rename and the typo — the two ways
    // these files actually go wrong — and stays quiet about everyone else.
    const ours = [...src.matchAll(/https?:\/\/[a-z0-9.-]*katodevv[a-z0-9.-]*/gi)].map((m) => m[0]);

    expect(ours.length).toBeGreaterThan(0);
    for (const url of ours) {
      expect(url).toBe(`https://${HOST}`);
    }
  });
});
