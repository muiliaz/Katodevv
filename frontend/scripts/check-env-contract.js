#!/usr/bin/env node
//
// Fails if a Netlify function reads an environment variable that .env.example
// does not declare.
//
// Why this exists: the functions are the only place the project reads
// process.env, and a missing variable does not surface at build time — it
// surfaces as a 500 on the first real enquiry, in production, silently losing
// that enquiry. .env.example is the contract; this keeps it honest without ever
// touching a real value.
//
// Deliberately narrow: it checks that names are declared, nothing else. It does
// not read .env, does not need secrets, and does not care what the values are.

const fs   = require('fs');
const path = require('path');

const ROOT         = path.join(__dirname, '..');
const FUNCTIONS_DIR = path.join(ROOT, 'netlify', 'functions');
const EXAMPLE_FILE  = path.join(ROOT, '.env.example');

// Set by the platform, never declared by us.
const PROVIDED_BY_RUNTIME = new Set(['NODE_ENV', 'CI']);

function jsFilesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return jsFilesIn(full);
    return entry.isFile() && entry.name.endsWith('.js') ? [full] : [];
  });
}

// Matches process.env.FOO and process.env['FOO'] / ["FOO"].
const READ_RE = /process\.env(?:\.([A-Z0-9_]+)|\[\s*['"]([A-Z0-9_]+)['"]\s*\])/g;

function readsIn(file) {
  const src = fs.readFileSync(file, 'utf8');
  const found = [];
  for (const m of src.matchAll(READ_RE)) found.push(m[1] ?? m[2]);
  return found;
}

function declaredNames(file) {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .filter(Boolean);
}

function main() {
  if (!fs.existsSync(EXAMPLE_FILE)) {
    console.error(`✗ ${path.relative(ROOT, EXAMPLE_FILE)} is missing — it is the env contract for the functions.`);
    process.exit(1);
  }

  const declared = new Set(declaredNames(EXAMPLE_FILE));
  const undeclared = new Map(); // name -> [files]

  for (const file of jsFilesIn(FUNCTIONS_DIR)) {
    for (const name of readsIn(file)) {
      if (declared.has(name) || PROVIDED_BY_RUNTIME.has(name)) continue;
      const where = path.relative(ROOT, file);
      undeclared.set(name, [...(undeclared.get(name) ?? []), where]);
    }
  }

  if (undeclared.size) {
    console.error('✗ Environment variables read by the functions but not declared in .env.example:\n');
    for (const [name, files] of undeclared) {
      console.error(`    ${name}  — read in ${[...new Set(files)].join(', ')}`);
    }
    console.error('\n  Add each name to frontend/.env.example with an empty value and a comment');
    console.error('  saying what it is and where it is set. Never commit a real value.');
    process.exit(1);
  }

  console.log(`✓ env contract: ${declared.size} declared, every function read accounted for`);
}

main();
