import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Lint only. No formatter, no style rules.
//
// create-react-app used to run ESLint on every build, and the Vite migration
// removed it along with the rest of react-scripts — so for a while the project
// had no linting at all. This restores the part that catches bugs.
//
// tech-health TH-005 also asks for a formatter. Deliberately not here: adding
// Prettier rewrites nearly every file and buries real changes in whitespace
// diffs. That is a separate decision, and it should be its own commit.
export default [
  {
    ignores: ['build/**', 'coverage/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },

  js.configs.recommended,

  // ── Browser code ───────────────────────────────────────────────────────────
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // Only the two classic rules, which is what create-react-app enforced.
      //
      // The plugin's "recommended" set now also pulls in React Compiler rules
      // (immutability, preserve-manual-memoization, set-state-in-effect). Those
      // flag working code because it cannot be auto-optimized — an optimisation
      // hint, not a defect. Adopting them means refactoring the GSAP and
      // Three.js components, which is its own project.
      'react-hooks/rules-of-hooks': 'error',

      // Was a warning while five suppressions were still in the tree, so they
      // stayed visible without turning the build red. All five are gone —
      // four were dependency arrays holding an expression or a stale-by-design
      // capture that turned out not to be needed, and the fifth was a real
      // defect: the bot demo replayed its script in the language it mounted
      // with, so a language switch interleaved English and Russian in the same
      // chat window. An error now, because there is nothing left to grandfather.
      'react-hooks/exhaustive-deps': 'error',

      // JSX compiles to references the base config cannot see.
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z]',      // components referenced only in JSX
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
    },
  },

  // ── Netlify functions and build scripts: CommonJS, Node globals ────────────
  {
    files: ['netlify/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // ── Tests ──────────────────────────────────────────────────────────────────
  {
    files: ['src/**/*.test.{js,jsx}', 'src/setupTests.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },

  // ── Playwright: Node modules that also evaluate code inside the browser ────
  {
    files: ['e2e/**/*.js', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      // page.evaluate() callbacks run in the page, so they legitimately touch
      // window and document from inside a file that is otherwise Node.
      globals: { ...globals.node, ...globals.browser },
    },
  },
];
