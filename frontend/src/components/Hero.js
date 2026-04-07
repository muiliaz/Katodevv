import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useLang } from '../LangContext'
import './Hero.css'

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
  const { t } = useLang()
  const h = t.hero

  const containerRef = useRef(null)
  const [statValues, setStatValues] = useState([0, 0, 0])

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // ── Badge ──────────────────────────────────────────────────────────────
    tl.from('.hero-badge', {
      y: 26, opacity: 0, duration: 0.65,
      clearProps: 'transform,opacity',
    }, 0.3)

    // ── Title: line-reveal — chars slide up from below the clip boundary ──
    tl.from('.hero-v2-title .char', {
      y: 88, duration: 0.88, stagger: 0.044,
      clearProps: 'transform',
      // No opacity: overflow:hidden on .title-word handles visibility.
      // Keeping opacity off avoids conflicts with gradient-text rendering.
    }, 0.5)

    // ── Subtitle ───────────────────────────────────────────────────────────
    tl.from('.hero-v2-subtitle', {
      y: 22, opacity: 0, duration: 0.65,
      clearProps: 'transform,opacity',
    }, 0.92)

    // ── Buttons: scale + fade ──────────────────────────────────────────────
    tl.from('.hero-v2-buttons > *', {
      y: 22, opacity: 0, scale: 0.92, duration: 0.58,
      ease: 'back.out(1.8)', stagger: 0.12,
      clearProps: 'transform,opacity',
    }, 1.12)

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
          {h.rightTags.map(tag => (
            <div key={tag} className="sidebar-tag">{tag}</div>
          ))}
        </aside>

      </div>
    </section>
  )
}

export default Hero
