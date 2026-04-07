import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useLang } from '../LangContext'
import './Hero.css'

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

function ServiceBack({ type }) {
  switch (type) {
    case 'telegram':
      return (
        <div className="sb-telegram">
          <div className="sb-tg-header"><span>🤖</span> KatoBot</div>
          <div className="sb-tg-msgs">
            <div className="sb-tg-msg sb-bot">Hello! How can I help? 👋</div>
            <div className="sb-tg-msg sb-user">Show me services</div>
            <div className="sb-tg-msg sb-bot">We build bots & apps 🚀</div>
            <div className="sb-tg-msg sb-user">Looks great!</div>
          </div>
        </div>
      )
    case 'ai':
      return (
        <div className="sb-ai">
          <div className="sb-ai-label">Neural Network</div>
          <div className="sb-nn">
            <div className="sb-nn-layer">{[0,1,2].map(i=><span key={i} className="sb-nn-node"/>)}</div>
            <div className="sb-nn-lines">
              {[0,1,2,3].map(i=><div key={i} className="sb-nn-line"/>)}
            </div>
            <div className="sb-nn-layer">{[0,1,2,3].map(i=><span key={i} className="sb-nn-node sb-nn-mid"/>)}</div>
            <div className="sb-nn-lines">
              {[0,1].map(i=><div key={i} className="sb-nn-line"/>)}
            </div>
            <div className="sb-nn-layer">{[0,1].map(i=><span key={i} className="sb-nn-node sb-nn-out"/>)}</div>
          </div>
          <div className="sb-ai-label" style={{fontSize:'10px',marginTop:'6px'}}>GPT · Claude · Gemini</div>
        </div>
      )
    case 'web':
      return (
        <div className="sb-web">
          <div className="sb-browser">
            <div className="sb-browser-bar">
              <span className="sb-dot sb-red"/><span className="sb-dot sb-yellow"/><span className="sb-dot sb-green"/>
              <div className="sb-url-bar">katodevv.com</div>
            </div>
            <div className="sb-browser-body">
              <div className="sb-wb-hero">
                <div className="sb-wb-line sb-big"/>
                <div className="sb-wb-line"/>
                <div className="sb-wb-btn">Get Started →</div>
              </div>
            </div>
          </div>
        </div>
      )
    case 'mobile':
      return (
        <div className="sb-mobile">
          <div className="sb-phone">
            <div className="sb-phone-notch"/>
            <div className="sb-phone-screen">
              <div className="sb-ph-status"/>
              <div className="sb-ph-card">
                <div className="sb-ph-line sb-ph-big"/>
                <div className="sb-ph-line"/>
              </div>
              <div className="sb-ph-grid">
                <div className="sb-ph-icon-box"/>
                <div className="sb-ph-icon-box"/>
                <div className="sb-ph-icon-box"/>
                <div className="sb-ph-icon-box"/>
              </div>
            </div>
          </div>
        </div>
      )
    case 'automation':
      return (
        <div className="sb-auto">
          <div className="sb-auto-node sb-auto-in">📥 Input</div>
          <div className="sb-auto-arrow">↓</div>
          <div className="sb-auto-node sb-auto-proc">⚙️ Process</div>
          <div className="sb-auto-arrow">↓</div>
          <div className="sb-auto-node sb-auto-out">✅ Output</div>
        </div>
      )
    default: return null
  }
}

gsap.registerPlugin(useGSAP)

const STACK_COL_A = [
  { name: 'Go',         icon: 'go'       },
  { name: 'Flutter',    icon: 'flutter'  },
  { name: 'Postgres',   icon: 'postgres' },
  { name: 'FastAPI',    icon: 'fastapi'  },
  { name: 'Next.js',    icon: 'nextjs'   },
  { name: 'Python',     icon: 'python'   },
  { name: 'TypeScript', icon: 'ts'       },
  { name: 'React',      icon: 'react'    },
  { name: 'Docker',     icon: 'docker'   },
  { name: 'Redis',      icon: 'redis'    },
  { name: 'MongoDB',    icon: 'mongodb'  },
  { name: 'Firebase',   icon: 'firebase' },
  { name: 'Kotlin',     icon: 'kotlin'   },
  { name: 'Swift',      icon: 'swift'    },
]

const STACK_COL_B = [
  { name: 'GraphQL',    icon: 'graphql'  },
  { name: 'AWS',        icon: 'aws'      },
  { name: 'Nginx',      icon: 'nginx'    },
  { name: 'VS Code',    icon: 'vscode'   },
  { name: 'MySQL',      icon: 'mysql'    },
  { name: 'Node.js',    icon: 'nodejs'   },
  { name: 'Git',        icon: 'git'      },
  { name: 'GitHub',     icon: 'github'   },
  { name: 'Figma',      icon: 'figma'    },
  { name: 'Tailwind',   icon: 'tailwind' },
  { name: 'Linux',      icon: 'linux'    },
  { name: 'Vue',        icon: 'vue'      },
  { name: 'Jira',       icon: 'jira'     },
  { name: 'Jenkins',    icon: 'jenkins'  },
]

const STATS = [
  { target: 10,  suffix: '+', labelKey: 0 },
  { target: 10,  suffix: '+', labelKey: 1 },
  { target: 100, suffix: '%', labelKey: 2 },
]

function Hero() {
  const { t, lang } = useLang()
  const h = t.hero

  const containerRef = useRef(null)
  const [statValues, setStatValues] = useState([0, 0, 0])
  const [activeService, setActiveService] = useState(null)

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setActiveService(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // ── Badge ──────────────────────────────────────────────────────────────
    tl.from('.hero-badge', {
      y: 26, opacity: 0, duration: 0.65,
    }, 0.3)

    // ── Title: line-reveal — chars slide up from below the clip boundary ──
    tl.from('.hero-v2-title .char', {
      y: 88, duration: 0.88, stagger: 0.044,
      // No opacity: overflow:hidden on .title-word handles visibility.
      // Keeping opacity off avoids conflicts with gradient-text rendering.
    }, 0.5)

    // ── Subtitle ───────────────────────────────────────────────────────────
    tl.from('.hero-v2-subtitle', {
      y: 22, opacity: 0, duration: 0.65,
    }, 0.92)

    // ── Buttons: scale + fade ──────────────────────────────────────────────
    tl.fromTo('.hero-v2-buttons > *',
      { y: 22, opacity: 0, scale: 0.92 },
      { y: 0, opacity: 1, scale: 1, duration: 0.58, ease: 'back.out(1.8)', stagger: 0.12, clearProps: 'all' },
    1.12)

    // ── Left sidebar entrance — target only children, ScrollJourney owns the parent ──
    tl.from('.stack-columns', {
      x: -32, opacity: 0, duration: 0.6, ease: 'power2.out',
      clearProps: 'transform,opacity',
    }, 0.55)
    tl.from('.hero-sidebar-left .sidebar-label', {
      x: -16, opacity: 0, duration: 0.5, ease: 'power2.out',
      clearProps: 'transform,opacity',
    }, 0.55)

    // ── Right sidebar tags slide in from right ─────────────────────────────
    tl.from('.hero-sidebar-right .sidebar-tag', {
      x: 32, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08,
    }, 0.55)

    // ── Stats counter (all three count up simultaneously) ──────────────────
    const c = { p: 0, c: 0, s: 0 }
    tl.to(c, {
      p: STATS[0].target,
      c: STATS[1].target,
      s: STATS[2].target,
      duration: 2.0,
      ease: 'power2.out',
      onUpdate() {
        setStatValues([Math.round(c.p), Math.round(c.c), Math.round(c.s)])
      },
    }, 1.3)

  }, { scope: containerRef })

  return (
    <section className="hero-v2" ref={containerRef}>

      <div className="hero-v2-inner">

        {/* ── Left tech-stack sidebar ─────────────────────────────────────── */}
        <aside className="hero-sidebar hero-sidebar-left">
          <div className="sidebar-label">{h.stackLabel}</div>
          <div className="stack-columns">

            {/* Column A — scrolls bottom → top */}
            <div className="stack-marquee">
              <div className="stack-track stack-track-up">
                {[...STACK_COL_A, ...STACK_COL_A].map((item, i) => (
                  <div key={item.icon + i} className="stack-card">
                    <img src={`https://skillicons.dev/icons?i=${item.icon}`} alt={item.name} width={32} height={32} />
                    <span className="stack-card-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B — scrolls top → bottom */}
            <div className="stack-marquee">
              <div className="stack-track stack-track-down">
                {[...STACK_COL_B, ...STACK_COL_B].map((item, i) => (
                  <div key={item.icon + i} className="stack-card">
                    <img src={`https://skillicons.dev/icons?i=${item.icon}`} alt={item.name} width={32} height={32} />
                    <span className="stack-card-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* ── Center content ──────────────────────────────────────────────── */}
        <div className="hero-v2-center">

          {/* Availability badge */}
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            {h.available}
          </div>

          {/* Title – each character is a separate span for GSAP stagger */}
          <h1 className="hero-v2-title">
            <span className="title-word title-kato" data-text="KATO">
              {'KATO'.split('').map((c, i) => (
                <span key={i} className="char">{c}</span>
              ))}
            </span>
            <span className="title-word title-devv" data-text="DEVV">
              {'DEVV'.split('').map((c, i) => (
                <span key={i} className="char">{c}</span>
              ))}
            </span>
          </h1>

          <p className="hero-v2-subtitle">
            {h.subtitle}
          </p>

          <div className="hero-v2-buttons">
            <button
              className="btn-primary-v2"
              onClick={() => document.querySelector('.contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {h.startProject}
            </button>
            <button
              className="btn-ghost-v2"
              onClick={() => document.querySelector('.services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {h.viewOurWork}
            </button>
          </div>

          {/* Live counter stats */}
          <div className="hero-v2-stats">
            <div className="stat-item">
              <span className="stat-num">{statValues[0]}{STATS[0].suffix}</span>
              <span className="stat-label">{h.statsLabels[0]}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">{statValues[1]}{STATS[1].suffix}</span>
              <span className="stat-label">{h.statsLabels[1]}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">{statValues[2]}{STATS[2].suffix}</span>
              <span className="stat-label">{h.statsLabels[2]}</span>
            </div>
          </div>

        </div>

        {/* ── Right services sidebar ───────────────────────────────────────── */}
        <aside className="hero-sidebar hero-sidebar-right">
          <div className="sidebar-label">{h.servicesLabel}</div>
          {h.rightTags.map((tag, i) => (
            <div
              key={tag}
              className={`sidebar-tag service-tag${activeService === i ? ' tag-active' : ''}`}
              onClick={() => setActiveService(activeService === i ? null : i)}
            >
              {tag}
            </div>
          ))}
        </aside>

      </div>

      {/* ── Service card overlay ─────────────────────────────────────────── */}
      {activeService !== null && (
        <>
          <div className="holo-dim" onClick={() => setActiveService(null)} />
          <div
            className="holo-card"
            style={{ '--tag-offset': `${(activeService - 2) * 54}px` }}
          >
            <div className="holo-scan-line" />
            <div className="holo-beam" />

            {/* ── Flip card (icon front / illustration back) ── */}
            <div className="holo-flip-wrapper" title="hover to flip">
              <div className="holo-flip-inner">
                <div className="holo-flip-front">
                  <div className="holo-icon">{SERVICE_INFO[activeService].icon}</div>
                  <div className="holo-flip-hint">hover</div>
                </div>
                <div className="holo-flip-back">
                  <ServiceBack type={SERVICE_INFO[activeService].backType} />
                </div>
              </div>
            </div>

            <div className="holo-title">{SERVICE_INFO[activeService][lang].title}</div>
            <div className="holo-desc">{SERVICE_INFO[activeService][lang].desc}</div>

            <ul className="holo-features">
              {SERVICE_INFO[activeService][lang].features.map(f => (
                <li key={f}><span className="holo-check">✦</span>{f}</li>
              ))}
            </ul>

            <button className="holo-close" onClick={() => setActiveService(null)}>✕</button>
          </div>
        </>
      )}

    </section>
  )
}

export default Hero
