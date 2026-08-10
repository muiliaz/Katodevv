import { vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LangProvider } from "../../shared/LangContext";
import Contact from "./Contact";

// Contact reads its copy from LangContext, so it always needs the provider.
function renderContact() {
  return render(
    <LangProvider>
      <Contact />
    </LangProvider>
  );
}

// user-event 14 made every interaction async and introduced setup(); the v13
// fire-and-forget calls this file used to make silently stopped typing anything.
const user = () => userEvent.setup();

async function fillForm(u, { name = "Ada", email = "ada@example.com", message = "I need a landing page for my shop." } = {}) {
  if (name)    await u.type(screen.getByPlaceholderText("Your name"), name);
  if (email)   await u.type(screen.getByPlaceholderText("Your email"), email);
  if (message) await u.type(screen.getByPlaceholderText("Tell us about your project"), message);
}

const submitButton = () => screen.getByRole("button", { name: /send request/i });

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  delete global.fetch;
});

test("renders the contact form", () => {
  renderContact();

  expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Your email")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Tell us about your project")).toBeInTheDocument();
  expect(submitButton()).toBeInTheDocument();
});

test("marks name, email and message as required", () => {
  renderContact();

  expect(screen.getByPlaceholderText("Your name")).toBeRequired();
  expect(screen.getByPlaceholderText("Your email")).toBeRequired();
  expect(screen.getByPlaceholderText("Tell us about your project")).toBeRequired();
});

test("does not submit a whitespace-only form", async () => {
  const u = user();
  renderContact();

  // The email has to be syntactically valid, otherwise type="email" makes the
  // browser block the submit and the component's own check never runs — which
  // is exactly what this test is here to exercise. Whitespace satisfies
  // `required`, so trimming is the component's job.
  await fillForm(u, { name: "   ", email: "ada@example.com", message: "   " });
  await u.click(submitButton());

  expect(await screen.findByText("Please fill in all fields.")).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test("lets the browser stop a submit with a malformed email", async () => {
  const u = user();
  renderContact();

  // Documents the other half: constraint validation on type="email" fires
  // before onSubmit, so nothing is posted and no component error appears.
  await fillForm(u, { name: "Ada", email: "not-an-email", message: "Build me a shop." });
  await u.click(submitButton());

  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.queryByText("Please fill in all fields.")).not.toBeInTheDocument();
});

test("posts the form values and shows the sent state", async () => {
  const u = user();
  renderContact();
  await fillForm(u);

  await u.click(submitButton());

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe("/.netlify/functions/contact");
  expect(options.method).toBe("POST");
  expect(JSON.parse(options.body)).toMatchObject({
    name:    "Ada",
    email:   "ada@example.com",
    message: "I need a landing page for my shop.",
  });

  expect(await screen.findByRole("button", { name: /sent/i })).toBeInTheDocument();
});

test("shows an error message when the request fails", async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) });

  const u = user();
  renderContact();
  await fillForm(u);

  await u.click(submitButton());

  expect(
    await screen.findByText("Something went wrong. Please try again.")
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /sent/i })).not.toBeInTheDocument();
});

test("sends the honeypot field so the server can spot bots", async () => {
  const u = user();
  renderContact();

  // A bot fills every input it finds, including the off-screen one.
  await u.type(screen.getByLabelText("Company"), "spam-co");
  await fillForm(u);

  await u.click(submitButton());

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.company).toBe("spam-co");
});
