// The lead paths that are not the /web contact form.
//
// The site has three ways to reach the team, and enquiry.spec.js covers one of
// them. These are the other two — the chat widget, which is the only lead path
// on /bots and /apps, and the tariff modal on /bots — plus the language switch,
// which is the one control that changes every string on the page at once.
//
// Both endpoints are intercepted: they need Telegram credentials, and what is
// under test is the browser side of the exchange.
import { test, expect } from "@playwright/test";
import { LEAD_ENDPOINT, STUB_TOKEN, captureEndpoint, stubTurnstile } from "./support.js";

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

test.describe("the chat widget", () => {
  // Opens on /bots, where it is the only way to reach anyone without leaving
  // the page.
  async function openChat(page) {
    await page.goto("/bots");
    await page.getByRole("button", { name: "Открыть чат" }).click();

    const chat = page.getByRole("dialog", { name: /Chat with Kato Devv/i });
    await expect(chat).toBeVisible();
    // The welcome step lands after the widget's own 600ms + 800ms of "typing".
    await expect(chat.getByRole("button", { name: /Связаться напрямую/ })).toBeVisible();
    return chat;
  }

  /**
   * Sends a contact. Waits for the placeholder to change first: the widget
   * shows the bot's reply after 800ms of "typing", and typing into the box
   * before the contact step arrives sends the text as a free-form message
   * instead — which is a different branch, and passes for the wrong reason.
   */
  async function sendContact(chat, value) {
    const box = chat.getByLabel("Введите сообщение");
    await expect(box).toHaveAttribute("placeholder", "Telegram или email...");
    await box.fill(value);
    await chat.getByRole("button", { name: "Отправить" }).click();
  }

  test("a visitor can leave a contact and the brief reaches the endpoint", async ({ page }) => {
    const lead = await captureEndpoint(page, LEAD_ENDPOINT);
    const chat = await openChat(page);

    await chat.getByRole("button", { name: /У меня есть проект/ }).click();
    await chat.getByRole("button", { name: "Сайт" }).click();
    await chat.getByRole("button", { name: "До $1000" }).click();
    await chat.getByRole("button", { name: /Срочно/ }).click();

    await sendContact(chat, "@ada");

    await expect.poll(lead.count).toBe(1);
    // Every answer given on the way down has to still be there at the end. A
    // dropped field is invisible in the widget and arrives as a partial brief.
    expect(lead.payloads[0]).toMatchObject({
      type: "project",
      projectType: "Сайт",
      budget: "До $1000",
      contact: "@ada",
      turnstileToken: STUB_TOKEN,
    });
    await expect(chat.getByText(/Бриф отправлен/)).toBeVisible();
  });

  test("a rejected lead offers a retry instead of claiming success", async ({ page }) => {
    await captureEndpoint(page, LEAD_ENDPOINT, { success: false });
    const chat = await openChat(page);

    await chat.getByRole("button", { name: /Связаться напрямую/ }).click();
    await sendContact(chat, "@ada");

    await expect(chat.getByRole("button", { name: "Попробовать снова" })).toBeVisible();
    await expect(chat.getByText(/Передал ваш контакт/)).toHaveCount(0);
  });

  test("the conversation survives moving to another page", async ({ page }) => {
    await captureEndpoint(page, LEAD_ENDPOINT);
    const chat = await openChat(page);
    await chat.getByRole("button", { name: /У меня есть проект/ }).click();
    await expect(chat.getByRole("button", { name: "Сайт" })).toBeVisible();

    // sessionStorage, not a store — so this is the assertion that it is wired
    // up at all. Losing it restarts the funnel for anyone who browses on.
    await page.goto("/apps");
    await page.getByRole("button", { name: "Открыть чат" }).click();

    const reopened = page.getByRole("dialog", { name: /Chat with Kato Devv/i });
    await expect(reopened.getByRole("button", { name: "Сайт" })).toBeVisible();
  });
});

test.describe("the tariff modal on /bots", () => {
  test("sends the enquiry tagged with the tariff it was opened from", async ({ page }) => {
    const lead = await captureEndpoint(page, LEAD_ENDPOINT);
    await page.goto("/bots");

    // Each offer card has its own CTA; the modal has to carry that offer's
    // name, or the team cannot tell which tariff the enquiry is about.
    const card = page.locator(".bots-offer", { hasText: "AI Consultant" });
    await card.getByRole("button").click();

    const modal = page.getByRole("dialog", { name: "Start a project" });
    await expect(modal).toBeVisible();
    await expect(modal.getByText("AI Consultant")).toBeVisible();

    await modal.getByPlaceholder("Your name").fill("Ada Lovelace");
    await modal.getByPlaceholder("you@email.com").fill("ada@example.com");
    await modal.getByPlaceholder(/Tell us a bit/).fill("A support bot for our shop.");
    await modal.getByRole("button", { name: "Send" }).click();

    await expect.poll(lead.count).toBe(1);
    expect(lead.payloads[0]).toMatchObject({
      type: "AI Consultant",
      name: "Ada Lovelace",
      contact: "ada@example.com",
      freeText: "A support bot for our shop.",
      turnstileToken: STUB_TOKEN,
    });
    // The honeypot travels empty for a human; the function rejects the
    // submission when it arrives filled.
    expect(lead.payloads[0].company).toBeFalsy();

    await expect(modal.getByText(/Thanks!/)).toBeVisible();
  });

  test("Escape closes it without sending anything", async ({ page }) => {
    const lead = await captureEndpoint(page, LEAD_ENDPOINT);
    await page.goto("/bots");

    await page.locator(".bots-offer", { hasText: "Telegram Bot" }).getByRole("button").click();
    const modal = page.getByRole("dialog", { name: "Start a project" });
    await expect(modal).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(modal).toHaveCount(0);
    expect(lead.count()).toBe(0);
  });
});

test("the language switch changes the page, not just the button", async ({ page }) => {
  await page.goto("/bots");

  // English is the default. The headline and a tariff name both come from the
  // dictionary, and a switch that only re-renders part of the tree is the
  // failure worth catching.
  // By heading rather than by text: "Telegram Bot" also appears inside the
  // subtitle prose, and a bare text match picks up both.
  const tariff = () => page.getByRole("heading", { name: "Telegram Bot", exact: true });
  await expect(page.getByRole("heading", { name: /built around your business/i })).toBeVisible();
  await expect(tariff()).toBeVisible();

  await page.getByRole("button", { name: "RU" }).click();

  await expect(page.getByRole("heading", { name: /под ваш бизнес/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Telegram-бот", exact: true })).toBeVisible();
  // The English name is gone, not merely joined by a Russian one — a switch
  // that re-renders half the tree would leave both.
  await expect(tariff()).toHaveCount(0);
});
