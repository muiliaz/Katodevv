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

function fillForm({ name = "Ada", email = "ada@example.com", message = "I need a landing page for my shop." } = {}) {
  if (name)    userEvent.type(screen.getByPlaceholderText("Your name"), name);
  if (email)   userEvent.type(screen.getByPlaceholderText("Your email"), email);
  if (message) userEvent.type(screen.getByPlaceholderText("Tell us about your project"), message);
}

const submitButton = () => screen.getByRole("button", { name: /send request/i });

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
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

test("does not submit a blank or whitespace-only form", async () => {
  renderContact();

  // Whitespace satisfies the browser's `required` check, so the component has
  // to reject it itself.
  fillForm({ name: "   ", email: "  ", message: "   " });
  userEvent.click(submitButton());

  expect(await screen.findByText("Please fill in all fields.")).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test("posts the form values and shows the sent state", async () => {
  renderContact();
  fillForm();

  userEvent.click(submitButton());

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

  renderContact();
  fillForm();

  userEvent.click(submitButton());

  expect(
    await screen.findByText("Something went wrong. Please try again.")
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /sent/i })).not.toBeInTheDocument();
});

test("sends the honeypot field so the server can spot bots", async () => {
  renderContact();

  // A bot fills every input it finds, including the off-screen one.
  userEvent.type(screen.getByLabelText("Company"), "spam-co");
  fillForm();

  userEvent.click(submitButton());

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.company).toBe("spam-co");
});
