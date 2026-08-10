// Shared setup for the end-to-end specs.
//
// Both of the site's lead paths sit behind the same two obstacles — a
// third-party challenge script and a hero that renders in software on a
// runner — so the handling lives here rather than being copied per spec.

export const CONTACT_ENDPOINT = "**/.netlify/functions/contact";
export const LEAD_ENDPOINT = "**/.netlify/functions/lead";
export const STUB_TOKEN = "e2e-turnstile-token";

// Stands in for challenges.cloudflare.com/turnstile/v0/api.js. Turnstile.jsx
// injects that script and reads window.turnstile once it loads, so a script
// defining the same two methods is indistinguishable from its point of view.
//
// Stubbing it is a deliberate call, and a different one from the WebGL
// decision. Turnstile is a third-party service across a network boundary; what
// this project owns is the integration — that the widget is rendered, that its
// token reaches component state, and that it goes out in the request body. The
// stub asserts exactly that, without making CI depend on Cloudflare being up.
//
// Cloudflare also publishes test keys that always pass
// (https://developers.cloudflare.com/turnstile/troubleshooting/testing/), which
// would exercise their script for real. That needs the site key to become
// configurable and still reaches the network on every run, so it is the option
// to reach for only if the integration itself starts breaking in production.
const TURNSTILE_STUB = `
  window.turnstile = {
    render(el, opts) {
      el.setAttribute('data-e2e-turnstile', 'rendered');
      setTimeout(() => opts.callback('${STUB_TOKEN}'), 0);
      return 'e2e-widget-id';
    },
    remove() {},
  };
`;

// A headless runner has no GPU, so Chrome renders the hero's shaders and bloom
// pass in software. At the full 1280×720 that costs about ten seconds per
// click — every interaction times out, and a CI runner is slower still.
// Shrinking the canvas container to two pixels makes each frame free:
// react-three-fiber sizes the drawing buffer from this element, so the scene
// still runs, still compiles its shaders, and simply has almost nothing to
// fill. Injected before the app mounts so the full-size buffer is never
// allocated. The hero at its real size has its own test, which skips this.
const SHRINK_HERO = `
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '.bh-canvas-wrapper{width:2px!important;height:2px!important;overflow:hidden!important}';
    document.head.appendChild(style);
  });
`;

/** Serves the Turnstile stub instead of Cloudflare's script. */
export async function stubTurnstile(page) {
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: TURNSTILE_STUB })
  );
}

/** Keeps the WebGL hero from starving the page of CPU. Only /web needs it. */
export async function shrinkHero(page) {
  await page.addInitScript(SHRINK_HERO);
}

/**
 * Intercepts one of the Netlify functions and records what was posted to it.
 *
 * @returns {{ payloads: object[], count: () => number }}
 */
export async function captureEndpoint(page, endpoint, { success = true, status = 200 } = {}) {
  const payloads = [];
  await page.route(endpoint, async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ success }),
    });
  });
  return { payloads, count: () => payloads.length };
}

/**
 * Lenis eases the page toward its own scroll target on every frame, so after
 * any scroll an element keeps drifting for about a second — and Playwright will
 * not click a box that is still moving. Parking Lenis is what the page itself
 * does whenever it opens a modal (see Services.jsx), so this uses the app's own
 * handle rather than a force click, which would hide a genuinely unclickable
 * button. Only /web runs Lenis.
 */
export async function parkLenis(page) {
  await page.waitForFunction(() => window.__lenis);
  await page.evaluate(() => window.__lenis.stop());
}
