// Shared response strings for the public form endpoints.
//
// Lives in lib/ for the same reason telegram.js does: Netlify only turns a
// subdirectory into a function when it holds an entry file named after the
// directory (or index.js), so this is bundled as shared code, never deployed
// as its own endpoint.
//
// The text is deliberately one fixed string for every internal failure. A
// caller must not be able to tell a JSON parse error from a missing env var
// from a Telegram rejection: those differences are recon material and none of
// them are actionable for the person filling in the form.
const GENERIC_ERROR = 'Something went wrong. Please try again later.';

// A malformed body is the caller's mistake, not ours, so it earns a 400 and a
// straight answer — same reasoning as the validation errors.
const INVALID_JSON = 'Request body is not valid JSON.';

// Deliberately says what happened. The honeypot lies to bots on purpose, but a
// throttled human is usually someone who double-clicked or resubmitted after a
// validation error, and telling them "success" would mean silently dropping a
// real enquiry.
const TOO_MANY_REQUESTS = 'Too many requests. Please wait a moment and try again.';

// Says what happened without saying how the check works. A visitor who sees
// this can retry — the widget re-issues a token — which is the only useful
// action available to them.
const CHALLENGE_FAILED = 'Could not verify the request. Please reload the page and try again.';

module.exports = { GENERIC_ERROR, INVALID_JSON, TOO_MANY_REQUESTS, CHALLENGE_FAILED };
