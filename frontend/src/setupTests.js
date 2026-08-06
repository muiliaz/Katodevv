// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// react-router v7 reaches for TextEncoder/TextDecoder at import time. Node has
// had both as globals for years, but the jsdom bundled with react-scripts 5's
// Jest does not expose them, so the import throws before any test runs.
//
// This shim exists only because the test runner is a decade behind the router;
// it goes away with the build-chain migration described in
// audit-fixes/05-dependency-hygiene.md.
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
