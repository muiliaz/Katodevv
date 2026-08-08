// Cover for the Services section before it gets split apart.
//
// tech-health TH-004 asks for this file to stop being 572 lines of dictionary,
// demo mockups and section in one place. Splitting it is a pure move — which is
// exactly the kind of change that silently loses a piece, because the section
// renders four demos that nothing else references. These tests pin what a
// visitor can actually reach: the four cards, the modal each one opens, the
// demo inside it, and the two ways out.
//
// They are deliberately behavioural rather than structural: not one of them
// names a module path, so they keep meaning after the move.
import { vi } from "vitest";
import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LangProvider, T } from "../../shared/LangContext";
import { formatPrice } from "../../shared/pricing";
import Services from "./Services";

const en = T.en.services;

function renderServices() {
  return render(
    <LangProvider>
      <Services />
    </LangProvider>
  );
}

// The cards are plain divs with a click handler, so there is no role to query
// by. The heading text is the visitor-facing handle; the card is its ancestor.
function cardTitled(title) {
  return screen.getByRole("heading", { name: title }).closest(".card");
}

describe("the four service cards", () => {
  test("every card in the dictionary reaches the page", () => {
    const { container } = renderServices();

    expect(container.querySelectorAll(".services-grid .card")).toHaveLength(en.cards.length);

    for (const card of en.cards) {
      expect(screen.getByRole("heading", { name: card.title })).toBeInTheDocument();
      expect(screen.getByText(card.description)).toBeInTheDocument();
    }
  });

  test("the bot card carries the POPULAR badge the others do not", () => {
    const { container } = renderServices();

    // One badge, and it belongs to the bot card. A split that rendered the
    // ordinary card component for all four would still pass the test above.
    const badges = container.querySelectorAll(".popular-badge");
    expect(badges).toHaveLength(1);
    expect(badges[0].closest(".bot-card-outer")).toContainElement(cardTitled("Bots / AI Bots"));
  });
});

describe("the modal a card opens", () => {
  test.each(en.cards.map((c) => [c.title, c]))("%s opens its own example", async (_title, card) => {
    const { container } = renderServices();

    expect(container.querySelector(".modal-overlay")).not.toBeInTheDocument();

    await userEvent.click(cardTitled(card.title));

    const modal = container.querySelector(".modal-box");
    expect(modal).toBeInTheDocument();
    // Title and subtitle come from the same dictionary entry as the card, so a
    // wiring mistake — card 2 opening demo 3 — shows up here.
    expect(within(modal).getByText(card.modalTitle)).toBeInTheDocument();
    expect(within(modal).getByText(card.modalSub)).toBeInTheDocument();
  });

  test.each([
    ["Web Development", () => screen.getByText("https://brandco.com")],
    ["Mobile Apps", () => screen.getByText(T.en.demos.mobile.financeTitle)],
    ["Automation", () => screen.getByText("Webhook")],
    ["Bots / AI Bots", () => screen.getByText(en.botName)],
  ])("%s renders a demo, not an empty frame", async (title, findDemo) => {
    renderServices();

    await userEvent.click(cardTitled(title));

    expect(findDemo()).toBeInTheDocument();
  });

  test("Escape and the overlay both close it", async () => {
    const { container } = renderServices();

    await userEvent.click(cardTitled("Web Development"));
    await userEvent.keyboard("{Escape}");
    expect(container.querySelector(".modal-overlay")).not.toBeInTheDocument();

    await userEvent.click(cardTitled("Web Development"));
    await userEvent.click(container.querySelector(".modal-overlay"));
    expect(container.querySelector(".modal-overlay")).not.toBeInTheDocument();
  });

  test("a click inside the box does not close it", async () => {
    const { container } = renderServices();

    await userEvent.click(cardTitled("Web Development"));
    await userEvent.click(container.querySelector(".modal-box"));

    expect(container.querySelector(".modal-box")).toBeInTheDocument();
  });
});

describe("the mobile demo's platform switch", () => {
  test("starts on iOS and swaps the whole screen for Android", async () => {
    const { container } = renderServices();
    const d = T.en.demos.mobile;

    await userEvent.click(cardTitled("Mobile Apps"));
    expect(container.querySelector(".phone-ios17")).toBeInTheDocument();
    expect(container.querySelector(".phone-s26")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: d.tabs[1] }));
    expect(container.querySelector(".phone-s26")).toBeInTheDocument();
    expect(container.querySelector(".phone-ios17")).not.toBeInTheDocument();
    expect(screen.getByText(d.greeting)).toBeInTheDocument();
  });
});

describe("the bot card's hover terminal", () => {
  // The terminal is the one place in this file that renders prices, so it is
  // the one place a split could reintroduce a hard-coded amount. pricing.test.js
  // catches the literal in the source; this catches the rendered output.
  const realMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reduced motion makes the typewriter print every line at once. Without it
    // the terminal fills over ~4s of nested setTimeout and the assertion below
    // would be a race. `(hover: none)` must stay false or the handler bails out
    // before it draws anything.
    window.matchMedia = (query) => ({
      ...realMatchMedia(query),
      matches: query.includes("prefers-reduced-motion"),
    });
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  test("lists the bot products with prices from the price table", async () => {
    const { container } = renderServices();

    await userEvent.hover(cardTitled("Bots / AI Bots"));

    const terminal = container.querySelector(".bot-terminal");
    for (const id of ["tg-bot", "booking-bot", "ai-bot", "shop-bot", "mini-app", "custom-ai"]) {
      expect(terminal.textContent).toContain(formatPrice(id, "en"));
    }
  });

  test("clears itself on the way out", async () => {
    const { container } = renderServices();
    const card = cardTitled("Bots / AI Bots");

    await userEvent.hover(card);
    expect(container.querySelector(".bot-terminal").textContent).not.toBe("");

    await userEvent.unhover(card);
    // The teardown runs inside a GSAP tween's onComplete, so it lands a frame
    // or two later rather than synchronously with the mouseleave.
    await act(() => vi.waitFor(() =>
      expect(container.querySelector(".bot-terminal").textContent).toBe("")
    ));
  });
});
