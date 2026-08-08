import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replaces react-scripts (create-react-app), which is unmaintained and was the
// source of 16 of the 18 remaining npm audit findings — see DEPENDENCIES.md.
//
// Two settings here exist purely to keep the rest of the project unchanged:
// the build output stays in build/ (netlify.toml publishes that directory) and
// the dev server stays on 3000 (the port everyone already types).
export default defineConfig({
  plugins: [react()],

  css: {
    modules: {
      // Vite's default is "_button_r5200_2", which says nothing about where the
      // class came from. This keeps create-react-app's readable shape —
      // "ChatWidget_button__aB3xY" — so devtools stays as navigable as before.
      generateScopedName: '[name]_[local]__[hash:base64:5]',
    },
  },

  build: {
    outDir: 'build',
    // CRA emitted these; keeping them means the Netlify deploy and any
    // bookmarked asset paths behave the same way.
    assetsDir: 'static',
    sourcemap: false,
  },

  server: {
    port: 3000,
    open: false,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    // The Netlify functions live outside src/, so they are not picked up by
    // the default include. Both are listed explicitly.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      // Covers the server-side handlers as well as the React code — the test
      // audit's complaint was that the functions were never measured at all.
      include: ['src/**/*.{js,jsx}', 'netlify/functions/**/*.js'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/setupTests.js'],

      // A ratchet, not a target. Set just under what the suite currently
      // reaches, so the numbers cannot quietly slide backwards; raise them when
      // coverage genuinely improves.
      //
      // The server side is held to a much higher bar than the React side: it
      // handles every enquiry, it is cheap to test, and it has no WebGL or
      // scroll animation standing in the way.
      // Raised on 2026-08-08 (from 32/25/22/33) after the Services section was
      // split up and covered — see docs/handoff.md.
      thresholds: {
        statements: 43,
        branches:   33,
        functions:  34,
        lines:      45,
        'netlify/functions/**': {
          statements: 95,
          branches:   78,
          functions:  90,
          lines:      95,
        },
      },
    },
    // create-react-app reset mocks between tests; several suites were written
    // against that, so keep the behaviour rather than rewrite them.
    restoreMocks: true,

    // The Netlify functions are CommonJS. Without this Vitest hands them to
    // Node's own require(), which resolves outside the mock registry — so
    // vi.mock on lib/telegram never reaches the require() inside contact.js.
    server: {
      deps: { inline: [/netlify[/\\]functions/] },
    },
  },
});
