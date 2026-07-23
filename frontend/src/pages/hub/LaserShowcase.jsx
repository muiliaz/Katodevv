import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../shared/LangContext";
import { REAL_CASES } from "./realCases";
import "./LaserShowcase.css";

const IMAGE_CYCLE_MS = 2800;
const IDLE_DELAY_MS = 12000; // how long the ring waits after any interaction before auto-drifting again

function coverflowMetrics() {
  return window.innerWidth < 640
    ? { spacing: 180, depth: 130, angle: 30 }
    : { spacing: 260, depth: 180, angle: 34 };
}

/**
 * A CSS-3D (no WebGL) coverflow of portfolio cards — deliberately built on
 * transform: translateX/translateZ/rotateY rather than pulling Three.js into
 * the Hub bundle, which is lazy-loaded precisely so routes that don't need it
 * stay light (see App.js code-splitting). The first slide is a signature card
 * representing the /web black-hole hero itself, not a real portfolio item —
 * it has no match in REAL_CASES.
 *
 * Perf note: `pos` (continuous card-index position) drives every card's
 * transform/opacity/filter every animation frame. Those are written straight
 * to the DOM via cardRefs inside the rAF loop, bypassing React entirely —
 * only the *active* index (for the glow/dot highlighting) goes through
 * setState, and only when it actually changes card. Nothing here should also
 * be CSS-transitioned; double-driving the same property from both a CSS
 * transition and a per-frame imperative write is what causes carousel jank.
 */
function useCoverflowMetrics() {
  const [m, setM] = useState(coverflowMetrics);
  useEffect(() => {
    const onResize = () => setM(coverflowMetrics());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return m;
}

// Shortest signed distance from `pos` to card index `i` around an n-card loop.
function shortestOffset(i, pos, n) {
  let raw = (i - pos) % n;
  if (raw > n / 2) raw -= n;
  if (raw < -n / 2) raw += n;
  return raw;
}
function useSlides(lang, t) {
  const s = t.showcase;
  const signature = {
    key: "signature",
    icon: "◉",
    tag: s.signature.tag,
    title: s.signature.title,
    desc: s.signature.desc,
    gradient: "radial-gradient(circle at 50% 40%, #3a2308 0%, #150d05 34%, #030202 68%)",
    images: ["/cases/kato-devv/1-hero.jpg"],
    isSignature: true,
  };
  const items = REAL_CASES.map((c) => ({
    key: c.key,
    tag: lang === "ru" ? c.tagRu : c.tagEn,
    title: c.title,
    desc: lang === "ru" ? c.descRu : c.descEn,
    gradient: c.gradient,
    images: c.images,
    url: c.url,
  }));
  return [signature, ...items];
}

export default function LaserShowcase({ onClose }) {
  const { lang, t } = useLang();
  const s = t.showcase;
  const navigate = useNavigate();
  const slides = useSlides(lang, t);
  const n = slides.length;
  const { spacing, depth, angle } = useCoverflowMetrics();

  const [active, setActive] = useState(0);
  const cardRefs = useRef([]);
  const pos = useRef(0); // continuous card-index position; card i is centered when pos === i
  const velocity = useRef(0);
  // Non-null while easing toward a specific index — either a deliberate
  // goTo() (dot/arrow/card click) or the post-drag settle once momentum
  // dies down. Null means "free" (idle drift or mid-momentum).
  const targetPos = useRef(null);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const idleUntil = useRef(0);
  const reducedMotion = useRef(false);
  const rafRef = useRef(null);

  // Crossfades through each real case's screenshots while the ring is open.
  const [imgTick, setImgTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setImgTick((v) => v + 1), IMAGE_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // idleUntil defaults to 0, which is already "in the past" — without this
    // the auto-drift condition below is true from the very first frame, so
    // the ring starts drifting the instant it opens instead of waiting.
    idleUntil.current = performance.now() + IDLE_DELAY_MS;
    let lastFrameTs = null;

    const applyLayout = () => {
      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const offset = shortestOffset(i, pos.current, n);
        const dist = Math.abs(offset);
        const rotClamped = Math.max(-1.6, Math.min(1.6, offset));
        const rotateY = -rotClamped * angle;
        const translateX = offset * spacing;
        const translateZ = -dist * depth;
        const scale = Math.max(0.68, 1 - Math.min(dist, 2.2) * 0.13);
        const opacity = Math.max(0, 1 - dist / 2.3);
        // transform + opacity only — both are cheap, GPU-compositable
        // properties. `filter` (brightness/saturate) used to drive the same
        // depth-dimming here, but animating `filter` every frame forces a
        // much heavier repaint path and was the actual cause of dropped
        // frames; opacity + scale alone still reads as "receding into depth".
        el.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
        el.style.opacity = opacity;
        const interactive = dist < 2.3;
        if (el.dataset.interactive !== String(interactive)) {
          el.style.pointerEvents = interactive ? "auto" : "none";
          el.dataset.interactive = String(interactive);
        }
      }
    };

    const tick = () => {
      const now = performance.now();
      // Normalize the idle-drift speed to real elapsed time rather than
      // frames — this environment renders at ~120fps, so a flat per-frame
      // increment would drift twice as fast here as on a 60Hz display.
      const dt = lastFrameTs === null ? 16.7 : now - lastFrameTs;
      lastFrameTs = now;

      if (dragging.current) {
        targetPos.current = null;
      } else if (targetPos.current !== null) {
        const diff = targetPos.current - pos.current;
        if (Math.abs(diff) > 0.001) {
          pos.current += diff * 0.16;
        } else {
          pos.current = targetPos.current;
          targetPos.current = null;
          idleUntil.current = now + IDLE_DELAY_MS;
        }
      } else if (Math.abs(velocity.current) > 0.0006) {
        pos.current += velocity.current;
        velocity.current *= 0.9;
        if (Math.abs(velocity.current) <= 0.0006) {
          // Momentum just died — ease into the nearest card rather than
          // resting at whatever odd in-between position it coasted to.
          targetPos.current = Math.round(pos.current);
        }
      } else if (!reducedMotion.current && now > idleUntil.current) {
        pos.current += 0.0012 * (dt / 16.7);
      }

      applyLayout();
      const idx = (((Math.round(pos.current) % n) + n) % n);
      setActive((prev) => (prev !== idx ? idx : prev));
      rafRef.current = requestAnimationFrame(tick);
    };
    applyLayout();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [n, spacing, depth, angle]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const goTo = (i) => {
    targetPos.current = pos.current + shortestOffset(i, pos.current, n);
    velocity.current = 0;
    idleUntil.current = performance.now() + IDLE_DELAY_MS;
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    lastX.current = e.clientX;
    velocity.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault(); // stop native text/image drag-selection while dragging the ring
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    const delta = -dx / spacing;
    pos.current += delta;
    velocity.current = delta;
  };
  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    idleUntil.current = performance.now() + IDLE_DELAY_MS;
  };

  const activeSlide = slides[active];
  // Real cases without a live link yet (url: null) get a disabled CTA rather
  // than silently falling through to the studio's own /web route.
  const canEnter = activeSlide?.isSignature || !!activeSlide?.url;

  const enterSite = () => {
    if (!canEnter) return;
    const url = activeSlide.url;
    onClose();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else navigate("/web");
  };

  return (
    <div
      className="laser-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={s.eyebrow}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="laser-vignette" />
      <button className="laser-close" onClick={onClose} aria-label={s.close}>×</button>
      <div className="laser-eyebrow">{s.eyebrow}</div>

      <div className="laser-scene">
        <div className="laser-floor" />
        <div className="laser-beam" />
        <div
          className="laser-ring"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          {slides.map((slide, i) => {
            const hasMedia = !!slide.images?.length;
            const imgIdx = hasMedia ? imgTick % slide.images.length : 0;
            return (
              <div
                key={slide.key}
                ref={(el) => { cardRefs.current[i] = el; }}
                className={`laser-card ${i === active ? "is-active" : ""} ${slide.isSignature ? "is-signature" : ""} ${hasMedia ? "has-media" : ""}`}
                style={{ background: slide.gradient }}
                onClick={() => goTo(i)}
              >
                {hasMedia && (
                  <>
                    <div className="laser-card-media">
                      {slide.images.map((src, imgI) => (
                        <img
                          key={src}
                          src={src}
                          alt=""
                          className={`laser-card-img ${imgI === imgIdx ? "is-shown" : ""}`}
                        />
                      ))}
                    </div>
                    <div className="laser-card-scrim" />
                  </>
                )}
                <div className="laser-card-content">
                  {!hasMedia && <span className="laser-card-icon">{slide.icon}</span>}
                  <span className="laser-card-tag">{slide.tag}</span>
                  <h3>{slide.title}</h3>
                  <p>{slide.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="laser-hint">{s.dragHint}</div>

      <div className="laser-controls">
        <button className="laser-nav" onClick={() => goTo((active - 1 + n) % n)} aria-label="Previous">‹</button>
        <div className="laser-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              className={`laser-dot ${i === active ? "is-active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={slide.title}
            />
          ))}
        </div>
        <button className="laser-nav" onClick={() => goTo((active + 1) % n)} aria-label="Next">›</button>
      </div>

      <button
        className={`laser-enter-cta ${canEnter ? "" : "is-disabled"}`}
        onClick={enterSite}
        disabled={!canEnter}
      >
        {canEnter ? s.enterSite : s.comingSoon} →
      </button>
    </div>
  );
}
