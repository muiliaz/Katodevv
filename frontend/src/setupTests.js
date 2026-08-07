// Custom matchers for asserting on DOM nodes, e.g. toBeInTheDocument().
import '@testing-library/jest-dom';

// React 18+ only applies act() semantics when this flag is set. create-react-app
// set it for us; Vitest does not, and without it state updates triggered from a
// click are not flushed before the assertion runs — the test then looks for text
// that has not been rendered yet.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The TextEncoder/TextDecoder shim that used to live here is gone: it existed
// only because the jsdom bundled with react-scripts 5's Jest predated them.
// The jsdom Vitest uses provides both.
