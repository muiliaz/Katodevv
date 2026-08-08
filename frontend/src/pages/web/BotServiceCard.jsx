// The fourth service card. It gets its own file because it is not the same
// component as the other three: it carries the POPULAR badge and, on hover,
// replaces its description with a typed-out terminal listing the bot products.
//
// The prices in that listing come from shared/pricing.js. Never type an amount
// here — pricing.test.js scans the whole source tree for hard-coded ones.
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLang } from "../../shared/LangContext";
import { formatPrice } from "../../shared/pricing";
import "./Services.css";

function BotServiceCard({ card, onClick }) {
  const { lang } = useLang()
  const badgeRef    = useRef(null)
  const cardElRef   = useRef(null)
  const descWrapRef = useRef(null)
  const termRef     = useRef(null)
  const iconRef     = useRef(null)
  const typeTimers      = useRef([])
  const iconTween       = useRef(null)
  const badgeOpTween    = useRef(null)
  const badgePulseTween = useRef(null)
  const isHoveredRef    = useRef(false)

  useEffect(() => {
    if (!badgeRef.current) return
    badgeOpTween.current = gsap.fromTo(
      badgeRef.current,
      { opacity: 0.85 },
      { opacity: 1, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1 }
    )
    return () => { if (badgeOpTween.current) badgeOpTween.current.kill() }
  }, [])

  useEffect(() => () => { typeTimers.current.forEach(clearTimeout) }, [])

  function startTypewriter() {
    const termEl = termRef.current
    if (!termEl) return
    termEl.innerHTML = ''

    // Prices come from shared/pricing.js — never hard-code an amount here.
    // The label column is padded to a fixed width so the prices line up in the
    // monospaced terminal.
    const LABEL_WIDTH = 28
    const row = (label, id) =>
      `- ${label.padEnd(LABEL_WIDTH)}${formatPrice(id, lang === 'ru' ? 'ru' : 'en')}`

    const lines = lang === 'ru' ? [
      '> bot_types.exe',
      '> loading...',
      row('Telegram-бот',        'tg-bot'),
      row('Бот записи / заявки', 'booking-bot'),
      row('AI-консультант',      'ai-bot'),
      row('Бот для магазина',    'shop-bot'),
      row('Mini App + оплата',   'mini-app'),
      row('Кастомный AI-агент',  'custom-ai'),
    ] : [
      '> bot_types.exe',
      '> loading...',
      row('Telegram bot',        'tg-bot'),
      row('Booking / lead bot',  'booking-bot'),
      row('AI consultant',       'ai-bot'),
      row('E-commerce bot',      'shop-bot'),
      row('Mini App + payments', 'mini-app'),
      row('Custom AI agent',     'custom-ai'),
    ]

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lines.forEach(line => {
        const d = document.createElement('div')
        d.className = 'bot-term-line'
        d.textContent = line
        termEl.appendChild(d)
      })
      const cur = document.createElement('span')
      cur.className = 'bot-cursor'
      cur.textContent = '_'
      termEl.appendChild(cur)
      return
    }

    let delay = 0
    lines.forEach(line => {
      const lineEl = document.createElement('div')
      lineEl.className = 'bot-term-line'
      termEl.appendChild(lineEl)

      const d = delay
      typeTimers.current.push(setTimeout(() => {
        let i = 0
        const tick = () => {
          lineEl.textContent = line.slice(0, i++)
          if (i <= line.length) {
            typeTimers.current.push(setTimeout(tick, 15))
          }
        }
        tick()
      }, d))

      delay += 80 + line.length * 15
    })

    typeTimers.current.push(setTimeout(() => {
      const cur = document.createElement('span')
      cur.className = 'bot-cursor'
      cur.textContent = '_'
      termEl.appendChild(cur)
    }, delay))
  }

  function handleMouseEnter() {
    if (window.matchMedia('(hover: none)').matches) return
    isHoveredRef.current = true
    typeTimers.current.forEach(clearTimeout)
    typeTimers.current = []

    gsap.to(descWrapRef.current, { opacity: 0, duration: 0.2 })

    const termEl = termRef.current
    termEl.style.display = 'block'
    gsap.fromTo(termEl, { opacity: 0 }, { opacity: 1, duration: 0.2, delay: 0.15 })

    cardElRef.current.style.backgroundImage =
      'repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(255,176,0,0.03) 2px,rgba(255,176,0,0.03) 3px)'

    iconTween.current = gsap.to(iconRef.current, {
      opacity: 0.5, duration: 0.2, ease: 'none', yoyo: true, repeat: -1,
    })

    // Badge: kill idle pulse, switch to amber terminal mode
    if (badgeOpTween.current) { badgeOpTween.current.kill(); badgeOpTween.current = null }
    const badgeEl   = badgeRef.current
    const badgeTxtEl = badgeEl.querySelector('.popular-badge-text')

    // Glitch flash
    gsap.timeline()
      .to(badgeEl, { x: -1.5, duration: 0.04, ease: 'none' })
      .to(badgeEl, { x:  1.5, duration: 0.04, ease: 'none' })
      .to(badgeEl, { x:  0,   duration: 0.04, ease: 'none' })

    // Amber glow (CSS transition handles smoothing)
    badgeEl.style.boxShadow = '0 0 32px rgba(255,176,0,0.35), 0 0 64px rgba(255,176,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)'
    badgeEl.style.borderColor = 'rgba(255,176,0,0.5)'

    // Text crossfade: POPULAR → > POPULAR
    gsap.to(badgeEl, { opacity: 0, duration: 0.075, onComplete: () => {
      if (!isHoveredRef.current) return
      badgeTxtEl.style.cssText = [
        "font-family:'JetBrains Mono',monospace",
        'font-size:11px', 'font-weight:500', 'letter-spacing:0.05em',
        'background:none', '-webkit-background-clip:unset', '-webkit-text-fill-color:#FFB000',
        'background-clip:unset', 'text-shadow:0 0 6px rgba(255,176,0,0.5)',
      ].join(';')
      badgeTxtEl.textContent = '> POPULAR'
      gsap.to(badgeEl, { opacity: 1, duration: 0.075 })
    }})

    // Scale pulse
    badgePulseTween.current = gsap.to(badgeEl, {
      scale: 1.05, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })

    startTypewriter()
  }

  function handleMouseLeave() {
    if (window.matchMedia('(hover: none)').matches) return
    isHoveredRef.current = false
    typeTimers.current.forEach(clearTimeout)
    typeTimers.current = []

    if (iconTween.current) {
      iconTween.current.kill()
      iconTween.current = null
      gsap.set(iconRef.current, { opacity: 1 })
    }

    const termEl = termRef.current
    gsap.to(termEl, {
      opacity: 0, duration: 0.15,
      onComplete: () => { termEl.style.display = 'none'; termEl.innerHTML = '' },
    })

    gsap.to(descWrapRef.current, { opacity: 1, duration: 0.2, delay: 0.1 })
    cardElRef.current.style.backgroundImage = ''

    // Badge: kill pulse, restore silver
    if (badgePulseTween.current) { badgePulseTween.current.kill(); badgePulseTween.current = null }
    const badgeEl    = badgeRef.current
    const badgeTxtEl = badgeEl.querySelector('.popular-badge-text')

    badgeEl.style.boxShadow  = ''
    badgeEl.style.borderColor = ''
    gsap.to(badgeEl, { scale: 1, duration: 0.3 })

    // Text crossfade back to silver POPULAR
    gsap.to(badgeEl, { opacity: 0, duration: 0.075, delay: 0.1, onComplete: () => {
      badgeTxtEl.textContent = 'POPULAR'
      badgeTxtEl.removeAttribute('style')
      gsap.to(badgeEl, { opacity: 0.85, duration: 0.075 })
    }})

    // Restart idle opacity pulse
    badgeOpTween.current = gsap.fromTo(
      badgeEl,
      { opacity: 0.85 },
      { opacity: 1, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.4 }
    )
  }

  return (
    <div className="bot-card-outer">
      <div ref={badgeRef} className="popular-badge">
        <span className="popular-badge-text">POPULAR</span>
      </div>
      <div
        ref={cardElRef}
        className="card"
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-cube-anchor"><div className="card-cube-dot" /></div>
        <span ref={iconRef} className="card-icon">🤖</span>
        <h3>{card.title}</h3>
        <div className="bot-body">
          <div ref={descWrapRef} className="bot-desc-wrap">
            <p>{card.description}</p>
            <p className="card-hint">{card.hint}</p>
          </div>
          <div ref={termRef} className="bot-terminal" style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )
}
export default BotServiceCard;
