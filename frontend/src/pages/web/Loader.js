import { useEffect } from 'react'

/**
 * Invisible loader — drives window.__loaderProgress for the BH shader.
 * No DOM output; BH canvas is always visible behind everything.
 *
 * Timeline from mount:
 *   0–1600ms   disk breathes sin-wave 0.85×–1.15× (one full cycle)
 *   1600ms     __loaderProgress = -1 (disk instantly at baseline 1.0×)
 *   2000ms     onDone() window opens (400ms buffer)
 *   2050–2700ms  Hero cascade (driven by Hero.js + Navbar.js GSAP delays)
 *   2800ms     onDone() fires → Loader unmounts
 */
export default function Loader({ onDone }) {
  useEffect(() => {
    const DURATION    = 1600
    const DONE_DELAY  = 1200  // ms after breathing ends → 2800ms total
    const start       = performance.now()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf, t

    if (reducedMotion) {
      window.__loaderProgress = -1
      t = setTimeout(onDone, DURATION + DONE_DELAY)
      return () => { clearTimeout(t); window.__loaderProgress = -1 }
    }

    window.__loaderProgress = 0

    const tick = (now) => {
      const p = Math.min(1, (now - start) / DURATION)
      window.__loaderProgress = p
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        window.__loaderProgress = -1          // disk returns to baseline 1.0×
        t = setTimeout(onDone, DONE_DELAY)
      }
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.__loaderProgress = -1
    }
  }, [onDone])

  return null
}
