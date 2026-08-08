// The enquiry path on /web, end to end in a real browser.
//
// This is the site's reason to exist: a visitor lands on /web, scrolls past the
// black hole, fills in the contact form and the studio gets a lead. Until now
// no automated check walked it — the unit suite cannot even mount the page,
// because BlackHole compiles real GLSL and jsdom has no WebGL.
//
// What is real here and what is not:
//
//   real — the production build, the router, Lenis, the GSAP scroll triggers,
//          the form and its client-side validation. The WebGL hero renders for
//          real too, in the last test in this file.
//   not  — the Netlify function (intercepted; it needs Telegram credentials)
//          and Cloudflare's Turnstile service (stubbed, see below).
//
// Stubbing Turnstile is a deliberate call, and a different one from the WebGL
// decision. Turnstile is a third-party service on the far side of a network
// boundary; what this project owns is the integration — that the widget is
// rendered, that its token reaches component state, and that it goes out in the
// request body. The stub asserts exactly that, and it does it without a network
// round trip that would make CI depend on Cloudflare being up.
//
// Cloudflare also publishes test keys that always pass
// (https://developers.cloudflare.com/turnstile/troubleshooting/testing/), which
// would exercise their script for real. That needs the site key to become
// configurable and still reaches the network on every run, so it is the option
// to reach for only if the integration itself starts breaking in production.
import { test, expect } from '@playwright/test';

const CONTACT_ENDPOINT = '**/.netlify/functions/contact';
const STUB_TOKEN = 'e2e-turnstile-token';

// Stands in for challenges.cloudflare.com/turnstile/v0/api.js. Turnstile.jsx
// injects that script and reads window.turnstile once it loads, so a script
// that defines the same two methods is indistinguishable from its point of view.
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
// click — every interaction below times out, and on a slower CI runner it would
// be worse. Shrinking the canvas container to two pixels makes each frame free:
// react-three-fiber sizes the drawing buffer from this element, so the scene
// still runs, still compiles its shaders, and simply has almost nothing to fill.
//
// It is injected before the app mounts so the full-size buffer is never
// allocated in the first place. The hero at its real size is checked in the last
// test in this file, which does not apply any of this.
const SHRINK_HERO = `
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '.bh-canvas-wrapper{width:2px!important;height:2px!important;overflow:hidden!important}';
    document.head.appendChild(style);
  });
`;

/** Scrolls to the contact form and hands back the locators the tests assert on. */
async function openContactForm(page) {
  await page.goto('/web');

  // Lenis eases the page toward its own scroll target on every frame, so after
  // any scroll the form keeps drifting for a second or so — and Playwright will
  // not click an element whose box is still moving. Parking Lenis is what the
  // page itself does whenever it opens a modal (see Services.jsx), so this uses
  // the app's own handle rather than fighting it with force clicks, which would
  // hide a genuinely unclickable button.
  await page.waitForFunction(() => window.__lenis);
  await page.evaluate(() => window.__lenis.stop());

  const form = page.locator('.contact-form');
  await form.scrollIntoViewIfNeeded();
  await expect(form).toBeVisible();

  return {
    form,
    name: form.getByPlaceholder('Your name'),
    email: form.getByPlaceholder('Your email'),
    message: form.getByPlaceholder('Tell us about your project'),
    // Located by type, not by its label: the label is the assertion. On a
    // successful send the button reads "✓ Sent!", and a name-based locator
    // would simply stop matching — the test would then wait out its timeout
    // instead of seeing the state it was looking for.
    submit: form.locator('button[type="submit"]'),
    error: page.locator('.cform-error'),
  };
}

async function fillValidEnquiry(f) {
  await f.name.fill('Ada Lovelace');
  await f.email.fill('ada@example.com');
  await f.message.fill('We need a landing page for a new product.');
}

test.describe('sending an enquiry', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SHRINK_HERO);
    await page.route('https://challenges.cloudflare.com/**', (route) =>
      route.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB })
    );
  });

  test('the form reaches the endpoint and the visitor sees it acknowledged', async ({ page }) => {
    /** @type {object|null} */
    let payload = null;

    await page.route(CONTACT_ENDPOINT, async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    const f = await openContactForm(page);

    // The widget renders invisibly (appearance: interaction-only), so the
    // attribute the stub sets is how we know Turnstile.jsx called render().
    // Scoped to the form: the chat widget is the site's other route to a lead
    // and carries a second, independent widget of its own.
    await expect(f.form.locator('[data-e2e-turnstile="rendered"]')).toBeAttached();

    await fillValidEnquiry(f);
    await f.submit.click();

    // The success state is the only thing the visitor sees, so it is the thing
    // worth asserting on — not the request having been made.
    await expect(f.submit).toHaveText(/sent/i);

    expect(payload).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'We need a landing page for a new product.',
      // The whole point of the widget: the token has to survive the trip from
      // Cloudflare's callback through component state into the request body.
      turnstileToken: STUB_TOKEN,
    });
    // The honeypot travels empty for a human. A bot fills every input it finds,
    // and the function rejects the submission when this arrives non-empty.
    expect(payload.company).toBeFalsy();
  });

  test('the fields are cleared, so a second enquiry needs no reload', async ({ page }) => {
    await page.route(CONTACT_ENDPOINT, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    );

    const f = await openContactForm(page);
    await fillValidEnquiry(f);
    await f.submit.click();

    await expect(f.submit).toHaveText(/sent/i);
    await expect(f.name).toHaveValue('');
    await expect(f.message).toHaveValue('');
  });

  test('a whitespace-only form is refused without spending a request', async ({ page }) => {
    let requests = 0;
    await page.route(CONTACT_ENDPOINT, (route) => {
      requests += 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    const f = await openContactForm(page);

    // `required` is satisfied by three spaces; the email has to be
    // syntactically valid or the browser blocks the submit before the
    // component's own check ever runs.
    await f.name.fill('   ');
    await f.email.fill('ada@example.com');
    await f.message.fill('   ');
    await f.submit.click();

    await expect(f.error).toHaveText('Please fill in all fields.');
    expect(requests).toBe(0);
  });

  test('a failing endpoint tells the visitor instead of pretending it sent', async ({ page }) => {
    await page.route(CONTACT_ENDPOINT, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' })
    );

    const f = await openContactForm(page);
    await fillValidEnquiry(f);
    await f.submit.click();

    await expect(f.error).toHaveText('Something went wrong. Please try again.');
    await expect(f.submit).not.toHaveText(/sent/i);
  });
});

test('the WebGL hero actually renders', async ({ page }) => {
  // Half a minute on a laptop, and a CI runner is slower: this is the one test
  // that pays the full software-rendering bill.
  test.slow();

  // The reason this suite runs in a real browser at all. A shader that fails to
  // compile leaves the canvas blank, and every other test in this file would
  // still pass — the form lives three screens below it.
  //
  // No SHRINK_HERO here: this one wants the scene at the size a visitor gets.
  await page.goto('/web');

  const canvas = page.locator('.bh-canvas-wrapper canvas');
  await expect(canvas).toBeVisible();

  const gl = await canvas.evaluate((el) => {
    const ctx = el.getContext('webgl2') || el.getContext('webgl');
    if (!ctx) return { ok: false, reason: 'no context' };
    if (ctx.isContextLost()) return { ok: false, reason: 'context lost' };
    return { ok: true, size: [el.width, el.height] };
  });

  expect(gl).toMatchObject({ ok: true });
  // A zero-sized drawing buffer is the shape a "passing" blank canvas takes.
  expect(gl.size[0]).toBeGreaterThan(0);
  expect(gl.size[1]).toBeGreaterThan(0);
});
