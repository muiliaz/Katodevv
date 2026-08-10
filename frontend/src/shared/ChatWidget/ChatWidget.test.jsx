// The chat widget — the site's second path to a lead, and until now the least
// covered thing in the project (36% of statements, against 98% for the Netlify
// functions it posts to). It is on every page, it is the only lead path on
// /bots and /apps, and it is a state machine driven by timers: exactly the
// shape that breaks quietly.
//
// Two things are replaced, and both are boundaries rather than logic:
//
//   gsap — the widget opens and closes through tweens whose onComplete
//   dispatches the state change. GSAP drives those from requestAnimationFrame,
//   which fake timers stop; the tween would never finish and the widget would
//   never close. The stub runs onComplete immediately, so what is tested is
//   the state machine, not the easing curve.
//
//   Turnstile — a real widget fetches Cloudflare's script, which jsdom cannot
//   load. The stub hands a token straight to the callback, which is what makes
//   the assertion below about the token reaching the request body meaningful.
import { vi } from "vitest";
import { render, screen, act, fireEvent, within } from "@testing-library/react";
import { STEPS, TG_HANDLE } from "./chatScenarios";

vi.mock("gsap", () => {
  const tween = { kill() {}, pause() {}, resume() {} };
  const run = (_target, vars) => { vars?.onComplete?.(); return tween; };
  const gsap = {
    set: () => {},
    to: run,
    fromTo: (_target, _from, to) => run(_target, to),
    killTweensOf: () => {},
    timeline: () => ({ to() { return this; }, kill() {} }),
  };
  return { default: gsap, gsap };
});

vi.mock("../Turnstile", () => ({
  default: ({ onToken }) => {
    onToken("chat-turnstile-token");
    return <div data-testid="turnstile-stub" />;
  },
}));

const { default: ChatWidget } = await import("./ChatWidget");

// The widget's own delays: 600ms before the welcome step starts, then 800ms of
// "typing" before each step's messages land.
const OPEN_DELAY = 600;
const TYPING_DELAY = 800;

// Messages carry newlines; getByText collapses whitespace in the DOM, so the
// expected string has to be collapsed the same way before comparing.
const collapsed = (text) => text.replace(/\s+/g, " ").trim();
const message = (text) => screen.getByText(collapsed(text));
const noMessage = (text) => screen.queryByText(collapsed(text));

const openButton = () => screen.getByRole("button", { name: "Открыть чат" });
// hidden: true, because the window is always in the DOM — GSAP controls its
// visibility — and while closed it carries aria-hidden, which takes it out of
// the accessibility tree getByRole searches by default. The tests below assert
// on that attribute, so they have to find it either way. No name filter for the
// same reason: an element outside the accessibility tree has no accessible
// name to match against. That the name is right is asserted separately.
const chatWindow = () => screen.getByRole("dialog", { hidden: true });
const pill = (label) => screen.getByRole("button", { name: label });
const input = () => screen.getByLabelText("Введите сообщение");

/** Opens the widget and lets the welcome step arrive. */
async function open() {
  await act(async () => { fireEvent.click(openButton()); });
  await act(async () => { vi.advanceTimersByTime(OPEN_DELAY + TYPING_DELAY); });
}

/** Clicks a quick reply and lets the next step's messages arrive. */
async function reply(label) {
  await act(async () => { fireEvent.click(pill(label)); });
  await act(async () => { vi.advanceTimersByTime(TYPING_DELAY); });
}

async function type(text) {
  await act(async () => {
    fireEvent.change(input(), { target: { value: text } });
  });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Отправить" })); });
  await act(async () => { vi.advanceTimersByTime(TYPING_DELAY); });
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
  );
});

afterEach(() => {
  vi.useRealTimers();
  delete global.fetch;
});

describe("opening the widget", () => {
  test("starts closed, with the button reachable by its label", () => {
    render(<ChatWidget />);

    expect(openButton()).toBeInTheDocument();
    expect(chatWindow()).toHaveAttribute("aria-hidden", "true");
  });

  test("the open window announces itself to a screen reader", async () => {
    render(<ChatWidget />);
    await open();

    expect(screen.getByRole("dialog", { name: /Chat with Kato Devv/i })).toBeInTheDocument();
    expect(chatWindow()).toHaveAttribute("aria-modal", "true");
  });

  test("the welcome step arrives with its quick replies", async () => {
    render(<ChatWidget />);
    await open();

    expect(chatWindow()).toHaveAttribute("aria-hidden", "false");
    expect(message(STEPS.welcome.msgs[0])).toBeInTheDocument();
    for (const r of STEPS.welcome.replies) {
      expect(pill(r.label)).toBeInTheDocument();
    }
  });

  test("any page can open it without a ref threaded through the tree", async () => {
    // The Hero's service picker and the /bots CTA both do exactly this.
    render(<ChatWidget />);

    await act(async () => { window.dispatchEvent(new CustomEvent("kato:openChat")); });
    await act(async () => { vi.advanceTimersByTime(OPEN_DELAY + TYPING_DELAY); });

    expect(chatWindow()).toHaveAttribute("aria-hidden", "false");
    expect(message(STEPS.welcome.msgs[0])).toBeInTheDocument();
  });

  test("Escape closes it", async () => {
    render(<ChatWidget />);
    await open();

    await act(async () => { fireEvent.keyDown(window, { key: "Escape" }); });

    expect(chatWindow()).toHaveAttribute("aria-hidden", "true");
  });
});

describe("the qualification funnel", () => {
  test("walks from welcome to a lead and posts everything it collected", async () => {
    render(<ChatWidget />);
    await open();

    await reply("💬 У меня есть проект");
    await reply("Сайт");
    await reply("До $1000");
    await reply("Срочно (1–2 недели)");

    // The contact step is the one that takes free text rather than pills.
    expect(message(STEPS.ask_contact.msgs[0])).toBeInTheDocument();
    expect(screen.queryAllByRole("group", { name: "Быстрые ответы" })).toHaveLength(0);

    await type("@ada");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("/.netlify/functions/lead");
    expect(options.method).toBe("POST");
    // Every answer the visitor gave has to survive the walk — this is the whole
    // point of the funnel, and a dropped field is invisible in the UI.
    expect(JSON.parse(options.body)).toMatchObject({
      type: "project",
      projectType: "Сайт",
      budget: "До $1000",
      deadline: "Срочно (1–2 недели)",
      contact: "@ada",
      turnstileToken: "chat-turnstile-token",
    });

    expect(message(STEPS.done.msgs[0])).toBeInTheDocument();
  });

  test("the bot branch records its own project type", async () => {
    render(<ChatWidget />);
    await open();

    await reply("🤖 Хочу бота для бизнеса");
    await reply("AI-консультант");
    await reply("$1000–3000");
    await reply("Месяц");
    await type("ada@example.com");

    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
      type: "bot",
      projectType: "AI-консультант",
      contact: "ada@example.com",
    });
  });

  test("the direct branch is marked as such, not as a project", async () => {
    render(<ChatWidget />);
    await open();

    await reply("👤 Связаться напрямую");
    expect(screen.getByText(new RegExp(TG_HANDLE))).toBeInTheDocument();

    await type("@ada");

    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
      type: "direct",
      contact: "@ada",
    });
    expect(message(STEPS.done_direct.msgs[0])).toBeInTheDocument();
  });

  test("free text is kept and asked to be followed by a contact", async () => {
    render(<ChatWidget />);
    await open();

    // Typing instead of picking a pill: the step has no input, so the message
    // is held and the visitor is asked for a way to reply.
    await type("Нужен парсер для маркетплейса");

    expect(message(STEPS.ask_free_contact.msgs[0])).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    await type("@ada");

    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
      freeText: "Нужен парсер для маркетплейса",
      contact: "@ada",
      type: "direct",
    });
  });

  test("an empty message is not a message", async () => {
    render(<ChatWidget />);
    await open();

    await act(async () => {
      fireEvent.change(input(), { target: { value: "   " } });
    });

    expect(screen.getByRole("button", { name: "Отправить" })).toBeDisabled();
  });
});

describe("when the lead does not get through", () => {
  test("a rejected submission offers a retry rather than claiming success", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: false }) });

    render(<ChatWidget />);
    await open();
    await reply("👤 Связаться напрямую");
    await type("@ada");

    expect(message(STEPS.error.msgs[0])).toBeInTheDocument();
    expect(noMessage(STEPS.done_direct.msgs[0])).not.toBeInTheDocument();
    expect(pill("Попробовать снова")).toBeInTheDocument();
  });

  test("a network failure is treated the same way", async () => {
    global.fetch.mockRejectedValueOnce(new Error("offline"));

    render(<ChatWidget />);
    await open();
    await reply("👤 Связаться напрямую");
    await type("@ada");

    expect(message(STEPS.error.msgs[0])).toBeInTheDocument();
  });

  test("retrying asks for the contact again and can succeed", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: false }) });

    render(<ChatWidget />);
    await open();
    await reply("👤 Связаться напрямую");
    await type("@ada");

    await reply("Попробовать снова");
    expect(message(STEPS.ask_contact.msgs[0])).toBeInTheDocument();

    await type("@ada");
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(message(STEPS.done.msgs[0])).toBeInTheDocument();
  });
});

describe("the conversation survives a page change", () => {
  test("it is restored from sessionStorage on the next mount", async () => {
    const first = render(<ChatWidget />);
    await open();
    await reply("💬 У меня есть проект");
    first.unmount();

    // A visitor moving from /bots to /apps remounts the widget; losing the
    // answers they already gave would restart the funnel from scratch.
    render(<ChatWidget />);
    await act(async () => { fireEvent.click(openButton()); });

    expect(message(STEPS.ask_project_type.msgs[0])).toBeInTheDocument();
    expect(pill("Сайт")).toBeInTheDocument();
  });

  test("starting over clears what was stored", async () => {
    render(<ChatWidget />);
    await open();
    await reply("👤 Связаться напрямую");
    await type("@ada");

    await reply("🏠 Начать заново");
    await act(async () => { vi.advanceTimersByTime(300 + TYPING_DELAY); });

    expect(sessionStorage.getItem("kato_chat")).not.toContain("@ada");
    expect(within(chatWindow()).getByText(collapsed(STEPS.welcome.msgs[0]))).toBeInTheDocument();
  });

  test("a corrupt stored conversation opens a blank one instead of throwing", async () => {
    sessionStorage.setItem("kato_chat", "{not json");

    render(<ChatWidget />);
    await open();

    expect(message(STEPS.welcome.msgs[0])).toBeInTheDocument();
  });
});
