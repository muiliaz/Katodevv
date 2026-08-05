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

module.exports = { GENERIC_ERROR };
