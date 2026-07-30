// Server-side input validation for the form endpoints.
//
// The functions are public URLs: anyone can POST to /.netlify/functions/contact
// directly and bypass the browser's `required` / type="email" checks. These
// helpers are the actual gate in front of the Telegram bot.

// Bots fill in every field they find, including ones a human never sees.
// The forms ship a visually hidden "company" input — if it comes back with a
// value, the submission is automated.
const HONEYPOT_FIELD = 'company';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  name:        { min: 2,  max: 100  },
  email:       { min: 5,  max: 254  }, // 254 = max length of an email address
  message:     { min: 10, max: 5000 },
  contact:     { min: 2,  max: 200  },
  freeText:    { min: 0,  max: 5000 },
  shortChoice: { min: 0,  max: 200  }, // type / projectType / budget / deadline
};

function isHoneypotFilled(body) {
  return String(body?.[HONEYPOT_FIELD] ?? '').trim().length > 0;
}

function text(value) {
  return String(value ?? '').trim();
}

function checkLength(label, value, { min, max }) {
  const len = text(value).length;
  if (len < min)  return `${label} is too short`;
  if (len > max)  return `${label} is too long`;
  return null;
}

// Returns an array of human-readable problems; empty means the payload is fine.
function validateContact(body) {
  const errors = [];

  errors.push(checkLength('name',    body?.name,    LIMITS.name));
  errors.push(checkLength('email',   body?.email,   LIMITS.email));
  errors.push(checkLength('message', body?.message, LIMITS.message));

  if (!EMAIL_RE.test(text(body?.email))) {
    errors.push('email is not a valid address');
  }

  return errors.filter(Boolean);
}

function validateLead(body) {
  const errors = [];

  // The chat widget and the /bots modal always collect a contact before
  // submitting — a lead without one is unusable, so treat it as required.
  errors.push(checkLength('contact', body?.contact, LIMITS.contact));

  // Everything else is optional, but must stay within sane bounds.
  errors.push(checkLength('name',        body?.name,        { min: 0, max: LIMITS.name.max }));
  errors.push(checkLength('freeText',    body?.freeText,    LIMITS.freeText));
  errors.push(checkLength('type',        body?.type,        LIMITS.shortChoice));
  errors.push(checkLength('projectType', body?.projectType, LIMITS.shortChoice));
  errors.push(checkLength('budget',      body?.budget,      LIMITS.shortChoice));
  errors.push(checkLength('deadline',    body?.deadline,    LIMITS.shortChoice));
  errors.push(checkLength('timestamp',   body?.timestamp,   LIMITS.shortChoice));

  return errors.filter(Boolean);
}

module.exports = {
  HONEYPOT_FIELD,
  isHoneypotFilled,
  validateContact,
  validateLead,
};
