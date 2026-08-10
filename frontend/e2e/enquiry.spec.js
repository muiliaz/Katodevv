// The enquiry path on /web, end to end in a real browser.
//
// This is the site's reason to exist: a visitor lands on /web, scrolls past the
// black hole, fills in the contact form and the studio gets a lead. Until this
// existed no automated check walked it — the unit suite cannot even mount the
// page, because BlackHole compiles real GLSL and jsdom has no WebGL.
//
// What is real here and what is not:
//
//   real — the production build, the router, Lenis, the GSAP scroll triggers,
//          the form and its client-side validation. The WebGL hero renders for
//          real too, in the last test in this file.
//   not  — the Netlify function (intercepted; it needs Telegram credentials)
//          and Cloudflare's Turnstile service (stubbed — the reasoning is in
//          support.js, next to the stub).
//
// The other two lead paths — the chat widget and the /bots tariff modal — are
// in lead-paths.spec.js.
import { test, expect } from '@playwright/test';
import {
  CONTACT_ENDPOINT, STUB_TOKEN, captureEndpoint, parkLenis, shrinkHero, stubTurnstile,
} from './support.js';

/** Scrolls to the contact form and hands back the locators the tests assert on. */
async function openContactForm(page) {
  await page.goto('/web');

  await parkLenis(page);

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
    await shrinkHero(page);
    await stubTurnstile(page);
  });

  test('the form reaches the endpoint and the visitor sees it acknowledged', async ({ page }) => {
    const contact = await captureEndpoint(page, CONTACT_ENDPOINT);

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

    expect(contact.payloads[0]).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'We need a landing page for a new product.',
      // The whole point of the widget: the token has to survive the trip from
      // Cloudflare's callback through component state into the request body.
      turnstileToken: STUB_TOKEN,
    });
    // The honeypot travels empty for a human. A bot fills every input it finds,
    // and the function rejects the submission when this arrives non-empty.
    expect(contact.payloads[0].company).toBeFalsy();
  });

  test('the fields are cleared, so a second enquiry needs no reload', async ({ page }) => {
    await captureEndpoint(page, CONTACT_ENDPOINT);

    const f = await openContactForm(page);
    await fillValidEnquiry(f);
    await f.submit.click();

    await expect(f.submit).toHaveText(/sent/i);
    await expect(f.name).toHaveValue('');
    await expect(f.message).toHaveValue('');
  });

  test('a whitespace-only form is refused without spending a request', async ({ page }) => {
    const contact = await captureEndpoint(page, CONTACT_ENDPOINT);

    const f = await openContactForm(page);

    // `required` is satisfied by three spaces; the email has to be
    // syntactically valid or the browser blocks the submit before the
    // component's own check ever runs.
    await f.name.fill('   ');
    await f.email.fill('ada@example.com');
    await f.message.fill('   ');
    await f.submit.click();

    await expect(f.error).toHaveText('Please fill in all fields.');
    expect(contact.count()).toBe(0);
  });

  test('a failing endpoint tells the visitor instead of pretending it sent', async ({ page }) => {
    await captureEndpoint(page, CONTACT_ENDPOINT, { status: 500, success: false });

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
  // No shrinkHero() here: this one wants the scene at the size a visitor gets.
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
