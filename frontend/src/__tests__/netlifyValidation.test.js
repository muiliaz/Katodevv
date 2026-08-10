// Tests for the Netlify functions' shared input validation.
// The test lives under src/ because create-react-app's Jest setup only picks up
// test files there; the module itself is imported from the functions folder.
import {
  isHoneypotFilled,
  validateContact,
  validateLead,
} from "../../netlify/functions/lib/validation";

const validContact = {
  name: "Ada",
  email: "ada@example.com",
  message: "I need a landing page for my shop.",
};

describe("isHoneypotFilled", () => {
  test("passes a submission where the hidden field is untouched", () => {
    expect(isHoneypotFilled({ ...validContact, company: "" })).toBe(false);
    expect(isHoneypotFilled(validContact)).toBe(false);
  });

  test("flags a submission that filled the hidden field", () => {
    expect(isHoneypotFilled({ ...validContact, company: "spam-co" })).toBe(true);
  });
});

describe("validateContact", () => {
  test("accepts a well-formed submission", () => {
    expect(validateContact(validContact)).toEqual([]);
  });

  test("rejects a missing or malformed email", () => {
    expect(validateContact({ ...validContact, email: "not-an-email" })).not.toEqual([]);
    expect(validateContact({ ...validContact, email: "" })).not.toEqual([]);
  });

  test("rejects a message that is too short or too long", () => {
    expect(validateContact({ ...validContact, message: "hi" })).not.toEqual([]);
    expect(validateContact({ ...validContact, message: "x".repeat(5001) })).not.toEqual([]);
  });

  test("rejects an empty payload instead of throwing", () => {
    expect(validateContact({}).length).toBeGreaterThan(0);
    expect(validateContact(undefined).length).toBeGreaterThan(0);
  });
});

describe("validateLead", () => {
  test("accepts a lead from the chat widget", () => {
    expect(
      validateLead({
        type: "project",
        projectType: "Сайт",
        budget: "$1000–3000",
        deadline: "Месяц",
        contact: "@ada",
      })
    ).toEqual([]);
  });

  test("requires a contact — a lead without one is unusable", () => {
    expect(validateLead({ projectType: "Сайт" })).not.toEqual([]);
  });

  test("caps the free-text field", () => {
    expect(validateLead({ contact: "@ada", freeText: "x".repeat(5001) })).not.toEqual([]);
  });
});
