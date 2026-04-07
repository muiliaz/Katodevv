/**
 * Returns the global Lenis smooth-scroll instance created in App.js.
 * Safe to call on server (returns null) and before Lenis has initialised.
 */
export default function useLenis() {
  return typeof window !== 'undefined' ? window.__lenis ?? null : null
}
