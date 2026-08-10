#!/usr/bin/env node
//
// Fails if a stylesheet declares a class that nothing can ever put on an
// element.
//
// Why this exists: knip guards the JavaScript, and the dead-code audit was
// closed on its say-so. But knip does not read CSS, and when the audits were
// re-run in August 2026 there were 149 such classes — 68 of the 94 in Hero.css
// alone, whole clusters left behind by a hero variant that had been deleted
// from the JSX while its stylesheet stayed. Nothing in the toolchain had a
// reason to notice, and nothing would have noticed the next one either.
//
// Deliberately conservative: it reports a class only when the exact name does
// not appear anywhere that could apply it. Anything assembled at runtime is
// left alone (see DYNAMIC below), so this under-reports rather than pointing at
// live code. The failure mode of the opposite choice is deleting a rule that
// was doing something, and CSS has no test that would catch it.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'build', 'coverage', 'test-results', 'playwright-report', '.git']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP_DIRS.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(ROOT);

// Everywhere a class name can reach an element: components, e2e locators, the
// HTML shell, and anything static served from public/.
const sources = files.filter(
  (f) =>
    (/\.(jsx?|mjs)$/.test(f) && (f.includes(`${path.sep}src${path.sep}`) || f.includes(`${path.sep}e2e${path.sep}`))) ||
    f === path.join(ROOT, 'index.html') ||
    (f.includes(`${path.sep}public${path.sep}`) && /\.(html|xml|txt|svg)$/.test(f))
);
// Comments are stripped first. A comment explaining why a class was removed
// otherwise keeps that very class alive — which is exactly what happened the
// first time this check was run.
function stripJsComments(code) {
  let out = '';
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      out += c;
      for (i++; i < code.length && code[i] !== quote; i++) {
        out += code[i];
        if (code[i] === '\\') out += code[++i] ?? '';
      }
      out += quote;
      continue;
    }
    if (c === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      i = end === -1 ? code.length : end + 1;
      out += ' ';
      continue;
    }
    out += c;
  }
  return out;
}

const haystack = sources
  .map((f) => {
    const text = fs.readFileSync(f, 'utf8');
    return /\.(jsx?|mjs)$/.test(f) ? stripJsComments(text) : text;
  })
  .join('\n');

// Names built in a template literal — `hub-card hub-card-${card.key}` yields
// the prefix "hub-card-". The prefix can sit anywhere inside the template, not
// only at its start; an earlier version of this check missed that and would
// have deleted three live rules on the hub.
const DYNAMIC = [...haystack.matchAll(/([A-Za-z][\w-]*-)\$\{/g)].map((m) => m[1]);

// Comments, url() and quoted strings are stripped before selectors are read:
// App.css embeds an SVG data URI containing "www.w3.org", which otherwise looks
// like a class called w3.
const withoutNoise = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/url\((?:[^()]|\\.)*\)/gi, ' ')
    .replace(/"(?:[^"\\]|\\.)*"/g, ' ')
    .replace(/'(?:[^'\\]|\\.)*'/g, ' ');

// CSS modules are excluded: their class names are hashed at build time and
// reached through the imported `styles` object, so a plain text search says
// nothing about them.
const stylesheets = files.filter((f) => f.endsWith('.css') && !f.includes('.module.'));

const dead = new Map();
for (const file of stylesheets) {
  const declared = new Set(
    [...withoutNoise(fs.readFileSync(file, 'utf8')).matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1])
  );
  const unused = [...declared].filter(
    (name) => !haystack.includes(name) && !DYNAMIC.some((prefix) => name.startsWith(prefix))
  );
  if (unused.length) dead.set(path.relative(ROOT, file), unused.sort());
}

if (dead.size) {
  console.error('✗ CSS classes declared but never applied to an element:\n');
  for (const [file, names] of dead) {
    console.error(`    ${file}  (${names.length})`);
    console.error(`      ${names.join(' ')}\n`);
  }
  console.error('  Either delete the rules, or — if a name is assembled at runtime in a way');
  console.error('  this check cannot see — apply it through a template literal so the prefix');
  console.error('  is visible, and say so in a comment.');
  process.exit(1);
}

console.log(
  `✓ dead CSS: ${stylesheets.length} stylesheets, every declared class is reachable`
);
