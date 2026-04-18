import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useLang } from '../LangContext'
import './Hero.css'

// ─── Service data (used by picker + holo-card) ────────────────────────────────
const SERVICE_INFO = [
  {
    icon: '🤖',
    backType: 'telegram',
    en: {
      title: 'Telegram Bots',
      desc: 'AI-powered bots for 24/7 customer support and full business automation.',
      features: ['Smart AI responses', 'Order & payment flows', 'CRM integration'],
    },
    ru: {
      title: 'Telegram Боты',
      desc: 'AI-боты для поддержки клиентов 24/7 и полной автоматизации бизнеса.',
      features: ['Умные AI-ответы', 'Оформление заказов и оплата', 'Интеграция с CRM'],
    },
  },
  {
    icon: '🧠',
    backType: 'ai',
    en: {
      title: 'AI Integration',
      desc: 'Embed cutting-edge AI models directly into your existing product.',
      features: ['GPT / Claude APIs', 'Custom model fine-tuning', 'Real-time inference'],
    },
    ru: {
      title: 'AI Интеграция',
      desc: 'Встраиваем передовые AI-модели прямо в ваш существующий продукт.',
      features: ['GPT / Claude API', 'Дообучение моделей', 'Инференс в реальном времени'],
    },
  },
  {
    icon: '🌐',
    backType: 'web',
    en: {
      title: 'Web Apps',
      desc: 'From landing pages to complex SaaS platforms — fast, modern & SEO-ready.',
      features: ['React / Next.js', 'SEO-optimised', 'Mobile-first design'],
    },
    ru: {
      title: 'Веб-приложения',
      desc: 'От лендингов до сложных SaaS-платформ — быстро, современно и с SEO.',
      features: ['React / Next.js', 'SEO-оптимизация', 'Mobile-first дизайн'],
    },
  },
  {
    icon: '📱',
    backType: 'mobile',
    en: {
      title: 'Mobile Apps',
      desc: 'Native iOS & Android apps with smooth UX and top performance.',
      features: ['Flutter / React Native', 'App Store publishing', 'Push notifications'],
    },
    ru: {
      title: 'Мобильные приложения',
      desc: 'Нативные iOS и Android приложения с отличным UX и производительностью.',
      features: ['Flutter / React Native', 'Публикация в App Store', 'Push-уведомления'],
    },
  },
  {
    icon: '⚡',
    backType: 'automation',
    en: {
      title: 'Automation',
      desc: 'Eliminate repetitive tasks and save hours every day with smart workflows.',
      features: ['n8n / Zapier flows', 'API integrations', 'Custom dashboards'],
    },
    ru: {
      title: 'Автоматизация',
      desc: 'Устраняем рутину и экономим часы каждый день с помощью умных воркфлоу.',
      features: ['n8n / Zapier потоки', 'API интеграции', 'Кастомные дашборды'],
    },
  },
]

gsap.registerPlugin(useGSAP)

// Title: K-A-T-O-[space]-D-E-V-V  (9 chars, 8 letters + 1 space)
const TITLE_CHARS = 'KATO DEVV'.split('')


function Hero() {
  const { t, lang } = useLang()
  const h = t.hero

  const containerRef    = useRef(null)
  const titleRef        = useRef(null)
  const serviceLineRef  = useRef(null)
  const buttonsRef      = useRef(null)
  const [showPicker, setShowPicker] = useState(false)

  // Close picker on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowPicker(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── rAF: idle arc+sway + BH-sync (GSAP owns DOM when p > 0) ─────────────
  useEffect(() => {
    const titleEl = titleRef.current
    if (!titleEl) return
    const spans = Array.from(titleEl.querySelectorAll('.char'))
    const total = spans.length
    let raf

    const tick = (time) => {
      const sp = Math.min(1, Math.max(0, window.__scrollProgress || 0))
      const p  = Math.min(1, sp / 0.35)

      // When scrolling: GSAP owns all transforms — rAF touches nothing
      if (p > 0) {
        raf = requestAnimationFrame(tick)
        return
      }

      // p === 0: idle arc + sway (positions now fixed in CSS, BH-sync removed)
      const mob     = window.innerWidth < 768
      const sLineEl = serviceLineRef.current
      const titleH1 = titleRef.current
      const btnsEl  = buttonsRef.current

      spans.forEach((span, i) => {
        const norm   = total > 1 ? (i / (total - 1)) * 2 - 1 : 0
        const t2     = norm * norm
        const arcAmp = mob ? 16 : 32
        const arcY   = arcAmp * (1 - t2)
        const arcRot = norm * (mob ? 6 : 12)
        const sway   = Math.sin(time / 6000 * Math.PI * 2 + i * 0.55) * 1.5
        span.style.transform = `translateY(${(arcY + sway).toFixed(2)}px) rotateZ(${arcRot.toFixed(2)}deg)`
      })

      // Subtle tidal pull on parent elements — BH "breathes" text toward it
      const pullY     = Math.sin(time / 3000 * Math.PI * 2) * 2
      const pullScale = 1 - Math.abs(Math.sin(time / 3000 * Math.PI * 2)) * 0.003
      if (titleH1) titleH1.style.transform = `translateY(${pullY.toFixed(3)}px) scale(${pullScale.toFixed(4)})`
      if (sLineEl) sLineEl.style.transform = `translateY(${(pullY * 0.7).toFixed(3)}px) scale(${pullScale.toFixed(4)})`
      if (btnsEl)  btnsEl.style.transform  = `translateY(${(pullY * 0.5).toFixed(3)}px) scale(${pullScale.toFixed(4)})`

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Service picker: broadcast to Contact ─────────────────────────────────
  function handleServicePick(service) {
    setShowPicker(false)
    window.dispatchEvent(new CustomEvent('kato:serviceSelected', { detail: service }))
    setTimeout(() => {
      document.querySelector('.contact')?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  // ── Entrance animations ───────────────────────────────────────────────────
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // Service line: opacity only (rAF drives position via style.top, skip y tween)
    tl.from('.hero-service-line', { opacity: 0, duration: 0.7 }, 0.3)
    tl.from('.hero-v2-title', {
      y: 30, opacity: 0, duration: 0.9, ease: 'power2.out', clearProps: 'transform',
    }, 0.4)
    tl.fromTo('.hero-v2-buttons > *',
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)', clearProps: 'all' },
    0.9)
  }, { scope: containerRef })

  return (
    <section className="hero-v2" ref={containerRef}>

      {/* ── Center content only ──────────────────────────────────────── */}
      <div className="hero-v2-inner">
        <div className="hero-v2-center">

          {/* ● WEB · APPS · MOBILE · AI */}
          <div className="hero-service-line" ref={serviceLineRef}>
            <span className="hero-service-dot" />
            <span>WEB · APPS · MOBILE · AI</span>
          </div>

          {/* Title — flat chars, rAF drives all per-letter transforms */}
          <h1 className="hero-v2-title" ref={titleRef}>
            {TITLE_CHARS.map((ch, i) => (
              <span
                key={i}
                className={`char${ch === ' ' ? ' char-space' : i < 4 ? ' char-kato' : ' char-dev'}`}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </h1>

          {/* CTA — opens service type picker */}
          <div className="hero-v2-buttons" ref={buttonsRef}>
            <button className="btn-primary-v2" onClick={() => setShowPicker(true)}>
              {h.startProject} ↗
            </button>
          </div>

        </div>
      </div>

      {/* ── Service type picker ──────────────────────────────────────────── */}
      {showPicker && (
        <>
          <div className="hero-picker-backdrop" onClick={() => setShowPicker(false)} />
          <div className="hero-picker-panel">
            <button className="hero-picker-close" onClick={() => setShowPicker(false)}>✕</button>
            <div className="hero-picker-heading">
              {lang === 'ru' ? 'Выберите тип проекта' : 'Choose a service'}
            </div>
            <div className="hero-picker-grid">
              {SERVICE_INFO.map((svc, i) => (
                <button
                  key={i}
                  className="hero-picker-item"
                  onClick={() => handleServicePick({
                    key:   svc.backType,
                    label: svc[lang].title,
                    icon:  svc.icon,
                  })}
                >
                  <span className="hero-picker-icon">{svc.icon}</span>
                  <span className="hero-picker-label">{svc[lang].title}</span>
                  <span className="hero-picker-desc">
                    {svc[lang].desc.split('.')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

    </section>
  )
}

export default Hero
