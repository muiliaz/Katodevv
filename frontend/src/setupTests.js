// Custom matchers for asserting on DOM nodes, e.g. toBeInTheDocument().
import "@testing-library/jest-dom";

// React 18+ only applies act() semantics when this flag is set. create-react-app
// set it for us; Vitest does not, and without it state updates triggered from a
// click are not flushed before the assertion runs — the test then looks for text
// that has not been rendered yet.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The TextEncoder/TextDecoder shim that used to live here is gone: it existed
// only because the jsdom bundled with react-scripts 5's Jest predated them.
// The jsdom Vitest uses provides both.

// ── Browser APIs jsdom does not implement ────────────────────────────────────
//
// The animated pages call all of these on mount, so without them a page cannot
// be rendered in a test at all — which is why route-level tests did not exist.
//
// Every stub is inert on purpose. They let a component mount and unmount; they
// do not pretend to measure or match anything. A test that needs real layout or
// a real media query has to arrange that itself.

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

if (typeof window.matchMedia === "undefined") {
  // matches: false means "no reduced motion, no narrow viewport" — the full
  // desktop experience, which is the riskiest path and so the one worth
  // rendering by default.
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {}, // deprecated, still called by some libraries
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof window.scrollTo === "undefined") window.scrollTo = () => {};
if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = () => {};
}

// Canvas: the hub's starfield and the /web loader draw on a 2D context. jsdom
// returns null from getContext, and the components then throw on the first
// call. This returns a context whose every method is a no-op.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function getContext(kind) {
    if (kind !== "2d") return null; // WebGL is not stubbed — see below
    return new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === "canvas") return this;
          if (prop === "measureText") return () => ({ width: 0 });
          if (prop === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
          if (prop === "createLinearGradient" || prop === "createRadialGradient") {
            return () => ({ addColorStop: () => {} });
          }
          return () => {};
        },
        set: () => true,
      }
    );
  };
}

// SVG path geometry: the hub animates the connector lines between its cards by
// stroke-dash offset, which GSAP computes from getTotalLength(). jsdom ships no
// SVG geometry engine at all.
if (typeof SVGElement !== "undefined" && !SVGElement.prototype.getTotalLength) {
  SVGElement.prototype.getTotalLength = () => 0;
  SVGElement.prototype.getPointAtLength = () => ({ x: 0, y: 0 });
}

// WebGL is deliberately not stubbed. /web's BlackHole compiles real GLSL
// shaders, and a fake context would either throw somewhere deep inside three.js
// or — worse — pass while proving nothing. That page is verified in a real
// browser instead; see audit-fixes/12-page-smoke-tests.md.
