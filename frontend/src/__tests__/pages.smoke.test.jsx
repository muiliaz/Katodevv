// Route-level smoke tests — the gap the tests audit called out:
//
//   "Закрыть smoke-тестами основные маршруты. Почему важно: `/`, `/bots` и
//    `/apps` сейчас могут регрессировать незаметно."
//
// The bar here is deliberately not "it rendered without throwing". Every page
// exists to move a visitor toward an enquiry, so each test checks that the page
// still shows the thing that does the moving: the direction cards on the hub,
// the tariffs on /bots, the feature list on /apps. A page rendering an empty
// shell would pass a render-only test and fail these.
//
// /web is absent on purpose. It mounts BlackHole, which compiles real GLSL
// against a WebGL context jsdom does not have — and stubbing WebGL would
// produce a test that passes while proving nothing. Its routing is covered by
// routing.test.jsx and its rendering is checked in a real browser.
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LangProvider } from "../shared/LangContext";
import { formatPrice } from "../shared/pricing";

import Hub from "../pages/hub/Hub";
import Bots from "../pages/bots/Bots";
import Apps from "../pages/apps/Apps";

// Every page needs the dictionary, a router (they render Links) and Helmet's
// provider (Seo renders into it).
function renderPage(Page) {
  return render(
    <HelmetProvider>
      <LangProvider>
        <MemoryRouter>
          <Page />
        </MemoryRouter>
      </LangProvider>
    </HelmetProvider>
  );
}

describe("/ — hub", () => {
  test("offers all three directions", () => {
    const { container } = renderPage(Hub);

    // The hub's entire job: send the visitor down one of three paths.
    const cards = container.querySelectorAll("[data-card-key]");
    expect([...cards].map((c) => c.dataset.cardKey).sort()).toEqual(["apps", "bots", "web"]);
  });

  test("bots and apps navigate straight through; web opens the showcase first", () => {
    const { container } = renderPage(Hub);

    // Two of the three are plain links.
    expect(container.querySelector('a[data-card-key="bots"][href="/bots"]')).toBeInTheDocument();
    expect(container.querySelector('a[data-card-key="apps"][href="/apps"]')).toBeInTheDocument();

    // The third is a button: it opens LaserShowcase, and the navigation to /web
    // happens from inside that. Worth pinning — someone "fixing" the
    // inconsistency by turning it into a Link would silently drop the showcase.
    const web = container.querySelector('[data-card-key="web"]');
    expect(web.tagName).toBe("BUTTON");
  });

  test("names what the studio does, not just empty cards", () => {
    renderPage(Hub);

    expect(screen.getByText(/Web Development/i)).toBeInTheDocument();
    expect(screen.getByText(/Mobile Apps/i)).toBeInTheDocument();
    expect(screen.getByText(/Bots \/ AI Automation/i)).toBeInTheDocument();
  });
});

describe("/bots — tariffs", () => {
  test("renders every tariff with its price", () => {
    const { container } = renderPage(Bots);

    const offers = container.querySelector(".bots-offers");
    expect(offers).toBeInTheDocument();

    // pricing.test.js catches a price being re-hardcoded into a UI file. This
    // catches the other direction: a tariff quietly vanishing from the page.
    for (const id of ["tg-bot", "ai-bot", "mini-app", "booking-bot", "automation-pro"]) {
      expect(within(offers).getByText(formatPrice(id, "en"))).toBeInTheDocument();
    }
  });

  test("keeps a call to action next to the tariffs", () => {
    renderPage(Bots);

    expect(screen.getAllByText(/start a project/i).length).toBeGreaterThan(0);
  });
});

describe("/apps — builder", () => {
  test("renders the features the visitor drags", () => {
    renderPage(Apps);

    // Each feature appears more than once — as a slot and as a chip — so this
    // asserts presence, not count. Without them the page is a dead frame.
    for (const label of [/Login & Auth/i, /Payments/i, /Push Notifications/i]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  test("shows the progress counter at zero", () => {
    const { container } = renderPage(Apps);

    expect(container.textContent).toMatch(/0\s*\/\s*10/);
  });
});

describe("the enquiry widget", () => {
  // The chat widget is one of the two routes to a lead, and losing it on a page
  // is invisible in a render-only check.
  test.each([
    ["bots", Bots],
    ["apps", Apps],
  ])("%s carries it", (_name, Page) => {
    renderPage(Page);

    // Queried by the avatar's alt text, not by class: CSS-module names are
    // generated and differ between the build and the test run, so asserting on
    // them tests the bundler rather than the page.
    expect(screen.getByAltText(/Kato Devv/i)).toBeInTheDocument();
  });

  test("the hub deliberately does not — it only routes onward", () => {
    // Documented rather than asserted as a defect: /, unlike the other pages,
    // has no enquiry path of its own. If that is not intended, this test is
    // where the decision surfaces.
    renderPage(Hub);

    expect(screen.queryByAltText(/Kato Devv/i)).not.toBeInTheDocument();
  });
});
