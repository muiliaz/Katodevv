import { defineConfig, devices } from "@playwright/test";

// End-to-end tests — the gap the tests audit called out at step 2: nothing in
// the project checked a full visitor path, and /web was not covered at all.
//
// It is not covered by the unit suite for a reason that does not go away: /web
// mounts BlackHole, which compiles real GLSL against a WebGL context jsdom does
// not have. Stubbing WebGL would produce a test that passes while proving
// nothing. A real browser is the only place that page can be exercised, so the
// one path that matters — a visitor sending an enquiry — is checked here.
//
// Deliberately kept out of `npm test`: this needs a browser binary and a built
// site, and it runs as its own CI job for that reason.
export default defineConfig({
  testDir: "./e2e",

  // The suite is one page and a handful of interactions. Serial is fast enough
  // and keeps the port from `webServer` uncontended.
  fullyParallel: false,
  workers: 1,

  // A green run must mean the assertions ran. `test.only` left in a file would
  // otherwise pass CI while skipping everything else.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",

  // Generous, because a headless runner renders the hero's shaders in software.
  // The enquiry tests take about three seconds each — the budget exists for the
  // one test that loads the hero at full size, which is marked test.slow().
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: "http://localhost:4173",
    // Only kept for failures — a trace per run is tens of megabytes.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          // The hero renders a WebGL scene. Headless Chrome falls back to
          // SwiftShader, which is slow but correct; without this it can end up
          // with no GL at all on a CI runner and the page never settles.
          args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
        },
      },
    },
  ],

  // Preview serves the production build, so the tests exercise what Netlify
  // publishes rather than the dev server's module graph. The build is part of
  // the command because a stale build/ would silently test yesterday's code.
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
