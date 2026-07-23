/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ScrollJourney — GSAP ScrollTrigger timeline.
 *
 * Journey (300vh sticky Hero):
 *   0–35%   hero text + sidebars sucked into BH center (convergence + spaghettification)
 *   15–75%  glass cubes fly from startPos → endPos (BlackHole useFrame)
 *   75–100% cubes land, rotation slows, float amplitude shrinks
 *   70–90%  canvas fades concurrently with cube landing
 *   95–100% "Our Services" title fades in (scrollProgress-driven)
 *
 * Content sections (after journey):
 *   services h2   — scrubbed reveal y:80→0 on viewport entry
 *   service cards  — stagger 0.12 s, fade up on entry
 *   portfolio/other — same
 *
 * Renders nothing — pure side-effect component.
 */
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ScrollJourney() {
  useEffect(() => {
    window.__scrollProgress = 0

    // ── Journey progress tracker (0→1 over 300vh) ─────────────────────────
    const progressST = ScrollTrigger.create({
      trigger: '#journey-scroll',
      start:   'top top',
      end:     'bottom top',
      scrub:   1,
      onUpdate(self) { window.__scrollProgress = self.progress },
    })

    // ── Sidebars: suck toward BH center (5–30%) ───────────────────────────
    // Left sidebar moves RIGHT toward center; right sidebar moves LEFT toward center.
    // scaleX narrows, scaleY stretches — spaghettification matching the text.
    const heroCtx = gsap.context(() => {
      gsap.fromTo('.hero-sidebar-left',
        { opacity: 1, x: 0, scaleX: 1, scaleY: 1 },
        {
          opacity: 0, x: 320, scaleX: 0.15, scaleY: 1.3, ease: 'none',
          transformOrigin: 'center center',
          scrollTrigger: {
            trigger: '#journey-scroll',
            start: '5% top', end: '30% top', scrub: 1.2,
          },
        }
      )
      gsap.fromTo('.hero-sidebar-right',
        { opacity: 1, x: 0, scaleX: 1, scaleY: 1 },
        {
          opacity: 0, x: -320, scaleX: 0.15, scaleY: 1.3, ease: 'none',
          transformOrigin: 'center center',
          scrollTrigger: {
            trigger: '#journey-scroll',
            start: '5% top', end: '30% top', scrub: 1.2,
          },
        }
      )
    })

    // ── Hero suck-into-BH ─────────────────────────────────────────────────────
    // transformOrigin '50% 120%' pulls the collapse point below center of each
    // element — text is drawn downward toward the hole's dark region.

    // Title: KATO DEVV
    const titleTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#journey-scroll',
        start: '12% top',
        end:   '38% top',
        scrub: 1,
      },
    })
    titleTl.to('.hero-v2-title', {
      scale: 0.02, opacity: 0, filter: 'blur(12px)',
      transformOrigin: '50% 80%',
      duration: 1, ease: 'power3.in',
    })

    // Service line — starts slightly earlier
    const sLineTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#journey-scroll',
        start: '10% top',
        end:   '35% top',
        scrub: 1,
      },
    })
    sLineTl.to('.hero-service-line', {
      scale: 0.02, opacity: 0, filter: 'blur(10px)',
      transformOrigin: '50% 200%',
      duration: 1, ease: 'power3.in',
    })

    // Buttons — slightly earlier than title
    const btnsTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#journey-scroll',
        start: '10% top',
        end:   '34% top',
        scrub: 1,
      },
    })
    btnsTl.to('.hero-v2-buttons', {
      scale: 0.02, opacity: 0, filter: 'blur(8px)',
      transformOrigin: '50% -120%',
      duration: 1, ease: 'power3.in',
    })

    // ── "Our Services" title: fade in during Phase 2 (95–100% of journey) ──
    // Cubes are landing; title rises up to greet them.
    const servicesH2 = document.querySelector('.services h2')
    const titleCtx = gsap.context(() => {
      if (servicesH2) {
        // Prepare initial state (will be overridden by ScrollTrigger below)
        gsap.set(servicesH2, { opacity: 0, y: 40 })
        gsap.to(servicesH2, {
          opacity: 1, y: 0, ease: 'none',
          scrollTrigger: {
            trigger: '#journey-scroll',
            start: '92% top',
            end:   '100% top',
            scrub: 1,
          },
        })
      }
    })

    // ── Canvas fade (85% → 100%) — stars stay at 0.4, card overlays fade to 0
    const canvasCtx = gsap.context(() => {
      // Fade blackhole canvas out completely — StarField component provides permanent stars
      gsap.to('.bh-canvas-wrapper', {
        opacity: 0, ease: 'none',
        scrollTrigger: {
          trigger: '#journey-scroll',
          start: '85% top', end: '100% top', scrub: 1.5,
        },
      })
      // Fade out cube-card-overlays independently so they don't bleed into content
      gsap.to('.bh-cards-layer', {
        opacity: 0, ease: 'none',
        scrollTrigger: {
          trigger: '#journey-scroll',
          start: '85% top', end: '100% top', scrub: 1.5,
        },
      })
    })

    // ── Content section reveals (after 300vh journey) ──────────────────────
    const contentCtx = gsap.context(() => {

      // Services h2 — also gets a viewport-entry scrub reveal for when
      // users arrive from the top without doing the journey scroll.
      if (servicesH2) {
        ScrollTrigger.create({
          trigger: servicesH2,
          start: 'top 90%',
          once: true,
          onEnter() {
            gsap.to(servicesH2, {
              opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
            })
          },
        })
      }

      // Other section headings
      document.querySelectorAll(
        '#content-sections .portfolio h2, #content-sections .about h2, #content-sections .contact h2'
      ).forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 36 },
          {
            opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          }
        )
      })

      // Services cards — stagger 0.12 s (cube landing echo)
      const serviceCards = document.querySelectorAll('.services-grid .card')
      if (serviceCards.length) {
        gsap.fromTo(serviceCards,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: '.services-grid',
              start: 'top 80%',
              once:  true,
            },
          }
        )
      }

      // Portfolio cards
      const portfolioCards = document.querySelectorAll('.portfolio-card')
      if (portfolioCards.length) {
        gsap.fromTo(portfolioCards,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: '.portfolio-grid',
              start: 'top 80%',
              once:  true,
            },
          }
        )
      }
    })

    return () => {
      progressST.kill()
      heroCtx.revert()
      titleTl?.kill()
      sLineTl?.kill()
      btnsTl?.kill()
      titleCtx.revert()
      canvasCtx.revert()
      contentCtx.revert()
    }
  }, [])

  return null
}
