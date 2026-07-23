import { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useLang } from "../../shared/LangContext";
import "./Hub.css";

const LaserShowcase = lazy(() => import("./LaserShowcase"));

const CARD_ACCENT = {
  bots: "rgba(255,176,0,.85)",
  web: "rgba(59,130,246,.85)",
  apps: "rgba(52,211,153,.85)",
};

/* Lightweight starfield — drawn on a 2D canvas, no WebGL / shaders /
   postprocessing. Redrawn every frame for two cheap effects: a slow
   per-star opacity twinkle, and a subtle parallax offset toward the
   cursor (each star's own random depth sets how far it shifts). Both are
   plain canvas fills — far cheaper per-frame than animating N DOM nodes. */
function HubStars() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars = [];
    let w = 0, h = 0, dpr = 1;
    let resizeTimer;
    let rafId;
    const mouse = { x: 0, y: 0 }; // normalized -1..1, eased toward target
    const mouseTarget = { x: 0, y: 0 };

    function buildStars() {
      const count = Math.round((w * h) / 8000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.2,
        baseAlpha: Math.random() * 0.5 + 0.12,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        depth: 0.3 + Math.random() * 0.7,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = s.baseAlpha;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function tick(t) {
      mouse.x += (mouseTarget.x - mouse.x) * 0.06;
      mouse.y += (mouseTarget.y - mouse.y) * 0.06;
      ctx.clearRect(0, 0, w, h);
      const tSec = t / 1000;
      const parallaxRange = 14; // px at full depth
      for (const s of stars) {
        const alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(tSec * s.speed + s.phase));
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(
          s.x + mouse.x * parallaxRange * s.depth,
          s.y + mouse.y * parallaxRange * s.depth,
          s.r, 0, Math.PI * 2
        );
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    }

    resize();
    if (reducedMotion) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reducedMotion) drawStatic();
      }, 200);
    };
    const onMouseMove = (e) => {
      mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("resize", onResize);
    if (!reducedMotion) window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      clearTimeout(resizeTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas className="hub-stars" ref={canvasRef} />;
}

// At rest the lines reach all the way to the card's own top edge (no
// gap); only the specific line whose card is hovered pulls back, so it
// clears the card once it lifts (see .hub-card :hover translateY).
const HOVER_RETRACT = 13;
const WAVE_AMPLITUDE = 3; // px of horizontal wobble on the curve's control points
const WAVE_EASE = 0.12; // per-frame lerp factor easing retract toward its target

function buildConnectorPath(cx, h, geo, wobble1, wobble2, retract) {
  const endY = h - retract;
  const c2y = geo.c2yBase - retract * 0.7;
  return `M ${cx} 0 C ${cx + wobble1} ${geo.c1yBase}, ${geo.targetX + wobble2} ${c2y}, ${geo.targetX} ${endY}`;
}

/* Draws the "one hub, three paths" connector: a small node centered above
   the cards row, with one curved line running down to each card, colored
   to match that card's own accent. Positions are measured from the real
   DOM (cards reflow at the 860px breakpoint into a single column), so the
   paths stay correct without hardcoding breakpoint-specific coordinates.
   Desktop/tablet only — collapsed to a stacked column on mobile, where a
   3-way fan has nothing to fan out to.

   Fully self-contained entrance: this component hides its own paths the
   moment they're first measured (useLayoutEffect, so there's no flash of
   a fully-drawn line before hiding), and only draws them in when the
   parent bumps `playToken` — instead of the parent reaching into this
   component's DOM to query <path> elements and hoping they already exist,
   which is exactly the kind of cross-component timing race that made the
   very first page load behave differently from a language-switch replay
   (paths measured lazily vs. already present, respectively). */
function HubConnector({ cardsWrapRef, cardKeys, hideToken, revealToken, hoveredKey }) {
  const wrapRef = useRef(null);
  const nodeRef = useRef(null);
  const pathRefs = useRef({});
  const [paths, setPaths] = useState([]);
  const [box, setBox] = useState({ w: 0, h: 56 });
  const [nodeX, setNodeX] = useState(0);
  const pathsRef = useRef(paths);
  pathsRef.current = paths;
  const boxRef = useRef(box);
  boxRef.current = box;
  const nodeXRef = useRef(nodeX);
  nodeXRef.current = nodeX;
  const hoveredKeyRef = useRef(hoveredKey);
  hoveredKeyRef.current = hoveredKey;
  // Gates the continuous wave/retract loop below off until the entrance
  // draw-in has actually finished — it also writes the `d` attribute, and
  // doing that while the dash-array reveal is still running would fight
  // over the same attribute mid-animation.
  const animateEnabledRef = useRef(false);
  const retractStateRef = useRef({});

  useLayoutEffect(() => {
    function measure() {
      const wrapEl = wrapRef.current;
      const cardsEl = cardsWrapRef.current;
      if (!wrapEl || !cardsEl) return;
      if (window.innerWidth < 861) { setPaths([]); return; }

      const wrapRect = wrapEl.getBoundingClientRect();
      const cardEls = cardsEl.querySelectorAll(".hub-card");
      const w = wrapRect.width;
      const h = wrapRect.height;
      const cx = w / 2;
      const nextPaths = [...cardEls].map((el, i) => {
        const r = el.getBoundingClientRect();
        const targetX = r.left + r.width / 2 - wrapRect.left;
        const geo = { key: cardKeys[i], targetX, c1yBase: h * 0.38, c2yBase: h - 6 };
        return { ...geo, d: buildConnectorPath(cx, h, geo, 0, 0, 0) };
      });
      setBox({ w, h });
      setNodeX(cx);
      setPaths(nextPaths);
    }

    measure();
    const ro = new ResizeObserver(measure);
    if (cardsWrapRef.current) ro.observe(cardsWrapRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKeys.join(",")]);

  // Continuous "alive" wobble + hover retract, driven straight off the
  // DOM (setAttribute, no React re-render) — same reasoning as the
  // coverflow ring in LaserShowcase: a handful of elements updated every
  // frame is cheap as long as it bypasses React and CSS transitions on
  // the same property. Reduced motion keeps the retract (it's functional
  // — clearing the hovered card) but drops the decorative wobble.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) animateEnabledRef.current = true;
    let rafId;
    const phases = {};
    const tick = (t) => {
      if (animateEnabledRef.current) {
        const { h } = boxRef.current;
        const cx = nodeXRef.current;
        const tSec = t / 1000;
        for (const g of pathsRef.current) {
          if (!phases[g.key]) phases[g.key] = { p1: Math.random() * Math.PI * 2, p2: Math.random() * Math.PI * 2, speed: 0.35 + Math.random() * 0.25 };
          const ph = phases[g.key];
          const targetRetract = hoveredKeyRef.current === g.key ? HOVER_RETRACT : 0;
          const cur = retractStateRef.current[g.key] ?? 0;
          const next = reduced ? targetRetract : cur + (targetRetract - cur) * WAVE_EASE;
          retractStateRef.current[g.key] = next;
          const w1 = reduced ? 0 : Math.sin(tSec * ph.speed + ph.p1) * WAVE_AMPLITUDE;
          const w2 = reduced ? 0 : Math.sin(tSec * ph.speed * 0.75 + ph.p2) * WAVE_AMPLITUDE;
          const el = pathRefs.current[g.key];
          if (el) el.setAttribute("d", buildConnectorPath(cx, h, g, w1, w2, next));
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Hides the paths instantly (no animation) — fires both the moment the
  // paths first exist (so there's no flash-of-drawn-line before this can
  // even run) *and* every time the parent bumps hideToken, which it does
  // right when it starts hiding the headline/subtitle too (in sync, not
  // deferred to the reveal cue — otherwise a replay, e.g. a language
  // switch, would leave the connector sitting fully-drawn while the text
  // resets, then have it snap to hidden only once reveal fires).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const pathEls = Object.values(pathRefs.current).filter(Boolean);
    if (!pathEls.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(pathEls, { strokeDashoffset: 0 });
      gsap.set(nodeRef.current, { opacity: 1, scale: 1 });
      return;
    }
    animateEnabledRef.current = false; // pause the wobble loop while hidden/re-hiding
    pathEls.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set(nodeRef.current, { opacity: 0, scale: 0.4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths.length > 0, hideToken]);

  // Draws in on cue from the parent, once the headline/subtitle have
  // finished (see Hub()'s timeline) — always fires after a hideToken bump,
  // never on its own from a resize-triggered remeasure.
  useEffect(() => {
    if (!revealToken || !pathsRef.current.length) return;
    const pathEls = Object.values(pathRefs.current).filter(Boolean);
    if (!pathEls.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline({ onComplete: () => { animateEnabledRef.current = true; } });
    tl.to(nodeRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" })
      .to(pathEls, { strokeDashoffset: 0, duration: 0.7, stagger: 0.08, ease: "power2.inOut" }, "-=0.15");
    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealToken]);

  return (
    <div className="hub-connector" ref={wrapRef} aria-hidden="true">
      {paths.length > 0 && (
        <svg
          className="hub-connector-svg"
          width={box.w} height={box.h}
          viewBox={`0 0 ${box.w} ${box.h}`}
          preserveAspectRatio="none"
        >
          {paths.map((p, i) => {
            const begin = `${1.6 + i * 0.5}s`;
            const lit = hoveredKey === p.key;
            return (
              <g key={p.key} className={lit ? "is-lit" : ""} style={{ color: CARD_ACCENT[p.key] }}>
                <path
                  ref={(el) => { pathRefs.current[p.key] = el; }}
                  className="hub-connector-path"
                  data-key={p.key}
                  d={p.d}
                  stroke={CARD_ACCENT[p.key]}
                  fill="none"
                />
                <circle r="2.2" fill={CARD_ACCENT[p.key]} className="hub-connector-pulse">
                  <animateMotion dur="3.2s" repeatCount="indefinite" begin={begin} path={p.d} />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.12;0.82;1"
                    dur="3.2s"
                    repeatCount="indefinite"
                    begin={begin}
                  />
                </circle>
              </g>
            );
          })}
        </svg>
      )}
      <div className="hub-connector-node" ref={nodeRef} style={{ left: nodeX }} />
    </div>
  );
}

function CardIcon({ variant }) {
  if (variant === "bots") {
    return (
      <div className="hci hci-bots">
        <img src="/kato-avatar.png" alt="" className="hci-bots-img" draggable="false" />
      </div>
    );
  }
  if (variant === "web") {
    return (
      <div className="hci hci-web">
        <div className="hci-web-bar"><span /><span /><span /></div>
        <div className="hci-web-line w1" />
        <div className="hci-web-line w2" />
      </div>
    );
  }
  return (
    <div className="hci hci-apps">
      <div className="hci-apps-notch" />
      <div className="hci-apps-home" />
    </div>
  );
}

/* Magnetic tilt + cursor spotlight — both driven straight off the pointer
   event, no rAF loop needed since it's only live while a single card is
   actually being hovered. Return-to-rest relies on the CSS transition
   already defined on .hub-card (cleared inline style falls back to it).
   onHoverChange(key | null) additionally tells the connector which line
   to light up / retract for (see HubConnector's `hoveredKey` prop). */
function useCardTilt(onHoverChange) {
  const onMouseEnter = (e) => onHoverChange(e.currentTarget.dataset.cardKey);
  const onMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 12;
    const rotateX = (0.5 - py) * 9;
    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
    card.style.transform = `translateY(-7px) scale(1.015) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };
  const onMouseLeave = (e) => {
    e.currentTarget.style.transform = "";
    onHoverChange(null);
  };
  return { onMouseEnter, onMouseMove, onMouseLeave };
}

function Hub() {
  const { lang, setLang, t } = useLang();
  const h = t.hub;
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [connectorHideToken, setConnectorHideToken] = useState(0);
  const [connectorRevealToken, setConnectorRevealToken] = useState(0);
  const tilt = useCardTilt(setHoveredKey);

  const eyebrowRef = useRef(null);
  const headlineRef = useRef(null);
  const subtitleRef = useRef(null);
  const cardsWrapRef = useRef(null);
  const cardKeys = h.cards.map((c) => c.key);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = Array.from(cardsWrapRef.current?.querySelectorAll(".hub-card") ?? []);
    const words = Array.from(headlineRef.current?.querySelectorAll(".hub-word-inner") ?? []);

    if (reduced) {
      gsap.set([eyebrowRef.current, subtitleRef.current, ...cards], { opacity: 1, y: 0, scale: 1, filter: "none" });
      gsap.set(words, { y: 0 });
      setConnectorRevealToken((v) => v + 1);
      return;
    }

    // Hide the connector in the same beat the text resets to hidden — not
    // deferred to the reveal cue below, or a replay (language switch)
    // would leave it sitting fully-drawn while the text resets around it,
    // then have it snap to hidden right as the reveal kicks off.
    setConnectorHideToken((v) => v + 1);

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.set([eyebrowRef.current, subtitleRef.current], { opacity: 0, y: 14 })
      .set(words, { y: "110%" })
      .set(cards, { opacity: 0, y: 26, scale: 0.94, filter: "blur(10px)" })
      .to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.55 })
      .to(words, { y: "0%", duration: 0.75, stagger: 0.045, ease: "power4.out" }, "-=0.3")
      .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.6 }, "-=0.45")
      // Connector only starts drawing once the text above it is fully in
      // place — it's a separate, self-contained entrance (see
      // HubConnector), cued here rather than driven from this timeline.
      .call(() => setConnectorRevealToken((v) => v + 1))
      .to(cards, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.65, stagger: 0.09 }, "-=0.1");

    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <div className="hub-page">
      <HubStars />
      <div className="hub-ambient" />
      <div className="hub-vignette" />

      <header className="hub-header">
        <div className="hub-brand">
          <div className="hub-logo-frame">
            <img src="/logo-kd.png" alt="" className="hub-logo" />
          </div>
          <span className="hub-wordmark">Kato<span className="hub-wordmark-accent">Devv</span></span>
        </div>
        <div className="hub-lang">
          <button
            className={`hub-lang-btn ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}
          >ENG</button>
          <span className="hub-lang-sep" />
          <button
            className={`hub-lang-btn ${lang === "ru" ? "active" : ""}`}
            onClick={() => setLang("ru")}
          >RU</button>
        </div>
      </header>

      <main className="hub-main">
        <div className="hub-eyebrow-wrap">
          <div className="hub-eyebrow" ref={eyebrowRef}>{h.eyebrow}</div>
          <span className="hub-eyebrow-rule" />
        </div>

        <h1 className="hub-headline" ref={headlineRef}>
          {h.headline.split(" ").map((word, i) => (
            <span className="hub-word-mask" key={i}>
              <span className="hub-word-inner">{word}{i < h.headline.split(" ").length - 1 ? " " : ""}</span>
            </span>
          ))}
        </h1>

        <p className="hub-subtitle" ref={subtitleRef}>{h.subtitle}</p>

        {/* Rendered before HubConnector so cardsWrapRef is already attached
            to the DOM by the time HubConnector's own layout effect measures
            card positions — refs attach in tree order during the layout
            phase, so a connector rendered earlier in the JSX would still
            see a null cardsWrapRef.current on first measure. Visual order
            (connector above cards) comes from the `order` values in
            Hub.css, not from this markup order. */}
        <div className="hub-cards" ref={cardsWrapRef}>
          {h.cards.map((card) => {
            if (card.status !== "live") {
              return (
                <div key={card.key} className={`hub-card hub-card-${card.key} is-soon`}>
                  <span className="hub-card-badge">{h.soonBadge}</span>
                  <CardIcon variant={card.key} />
                  <h2>{card.title}</h2>
                  <p>{card.desc}</p>
                </div>
              );
            }
            if (card.key === "web") {
              return (
                <button
                  key={card.key}
                  data-card-key={card.key}
                  className={`hub-card hub-card-${card.key}`}
                  onClick={() => setShowcaseOpen(true)}
                  onMouseEnter={tilt.onMouseEnter}
                  onMouseMove={tilt.onMouseMove}
                  onMouseLeave={tilt.onMouseLeave}
                >
                  <div className="hub-card-spotlight" />
                  <CardIcon variant={card.key} />
                  <h2>{card.title}</h2>
                  <p>{card.desc}</p>
                  <span className="hub-card-cta">{card.cta} →</span>
                </button>
              );
            }
            return (
              <Link
                key={card.key}
                data-card-key={card.key}
                to={`/${card.key}`}
                className={`hub-card hub-card-${card.key}`}
                onMouseEnter={tilt.onMouseEnter}
                onMouseMove={tilt.onMouseMove}
                onMouseLeave={tilt.onMouseLeave}
              >
                <div className="hub-card-spotlight" />
                <CardIcon variant={card.key} />
                <h2>{card.title}</h2>
                <p>{card.desc}</p>
                <span className="hub-card-cta">{card.cta} →</span>
              </Link>
            );
          })}
        </div>

        <HubConnector
          cardsWrapRef={cardsWrapRef}
          cardKeys={cardKeys}
          hideToken={connectorHideToken}
          revealToken={connectorRevealToken}
          hoveredKey={hoveredKey}
        />
      </main>

      <div className="hub-social">
        <a href="https://instagram.com/katodevv" target="_blank" rel="noreferrer" className="hub-social-btn ig" aria-label="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <a href="https://t.me/katodevv" target="_blank" rel="noreferrer" className="hub-social-btn tg" aria-label="Telegram">
          <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.086l-2.95-.924c-.64-.203-.654-.64.136-.949l11.52-4.443c.535-.194 1.004.131.686.478z" />
          </svg>
        </a>
        <a href="https://wa.me/" target="_blank" rel="noreferrer" className="hub-social-btn wa" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.46 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.35-.5.05-1 .25-3.36-.7-2.84-1.16-4.67-4.06-4.81-4.25-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.82 2.01.89 2.16.07.14.11.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.37-.41.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.64-.14.26.09 1.68.79 1.97.94.28.14.47.21.54.33.07.12.07.71-.17 1.4z" />
          </svg>
        </a>
      </div>

      <footer className="hub-footer">© {new Date().getFullYear()} Kato Devv</footer>

      {showcaseOpen && (
        <Suspense fallback={null}>
          <LaserShowcase onClose={() => setShowcaseOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default Hub;
