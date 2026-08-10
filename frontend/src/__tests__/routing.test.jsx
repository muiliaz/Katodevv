import { vi } from "vitest";
// Smoke tests for the router wiring in App.js.
//
// Added while upgrading react-router-dom from v6 to v7: the suite had no test
// that touched routing at all, so a green run proved nothing about the upgrade.
// These cover the five router APIs the app uses — BrowserRouter, Routes, Route,
// Link, useNavigate — and App's own path-to-page table.
//
// The four pages are mocked on purpose. What is under test here is App's
// routing table, not what a page renders; and mounting the real pages in jsdom
// needs stand-ins for WebGL, canvas 2D, ResizeObserver, matchMedia and
// scrollIntoView, which is a separate job (see audit-fixes/05-dependency-hygiene.md).
vi.mock("../pages/hub/Hub", () => ({ default: () => <p>hub page</p> }));
vi.mock("../pages/web/WebDev", () => ({ default: () => <p>web page</p> }));
vi.mock("../pages/bots/Bots", () => ({ default: () => <p>bots page</p> }));
vi.mock("../pages/apps/Apps", () => ({ default: () => <p>apps page</p> }));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import App from "../app/App";

function renderAt(path) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

afterEach(() => {
  window.history.pushState({}, "", "/");
});

describe("App maps every path to its page", () => {
  // The routes are also the sitemap and the SEO surface, so a silently dropped
  // one is a real outage rather than a cosmetic bug.
  test.each([
    ["/", "hub page"],
    ["/web", "web page"],
    ["/bots", "bots page"],
    ["/apps", "apps page"],
  ])("renders %s", async (path, expected) => {
    renderAt(path);

    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  test("loads only the page for the current route", async () => {
    renderAt("/bots");

    expect(await screen.findByText("bots page")).toBeInTheDocument();
    expect(screen.queryByText("hub page")).not.toBeInTheDocument();
    expect(screen.queryByText("web page")).not.toBeInTheDocument();
  });
});

describe("the router APIs the pages rely on", () => {
  // Isolated from App so a future router upgrade fails here, with an obvious
  // message, instead of somewhere deep inside a page.
  test("Link navigates without a reload", async () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Link to="/bots">go</Link>} />
          <Route path="/bots" element={<p>arrived</p>} />
        </Routes>
      </BrowserRouter>
    );

    await userEvent.click(screen.getByText("go"));

    expect(await screen.findByText("arrived")).toBeInTheDocument();
  });

  test("useNavigate moves between routes", async () => {
    function Jump() {
      const navigate = useNavigate();
      return <button onClick={() => navigate("/apps")}>jump</button>;
    }

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Jump />} />
          <Route path="/apps" element={<p>arrived</p>} />
        </Routes>
      </BrowserRouter>
    );

    await userEvent.click(screen.getByText("jump"));

    expect(await screen.findByText("arrived")).toBeInTheDocument();
  });
});
