import { useEffect, useRef } from "react";
import "./Katobot.css";

/**
 * Katobot — the living mascot, built on the real kato-avatar.png artwork
 * (not a CSS redraw). Eye positions below were measured directly from the
 * PNG's pixel data (500×500, transparent) so the overlay lands exactly on
 * the glow in the source image at any display size:
 *   left eye  centroid ≈ (35.27%, 50.5%) of the 500×500 canvas
 *   right eye centroid ≈ (64.48%, 50.46%)
 *   screen matte behind the eyes ≈ rgb(20,28,36) — used for the blink lid
 * The face itself sits centered in its canvas (alpha bbox ~50.1%/49.5%),
 * so unlike the old bot-avatar.png it needs no offset correction.
 *
 * The face never slides its eyes (that would desync from the artwork) —
 * instead the whole mascot tilts toward the cursor like a device turning
 * to look at you, while the eyes themselves blink and breathe in place.
 */
function Katobot({ size = 320, interactive = true, className = "" }) {
  const stageRef = useRef(null);
  const faceRef  = useRef(null);
  const target   = useRef({ x: 0, y: 0 });
  const current  = useRef({ x: 0, y: 0 });
  const rafRef   = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch      = window.matchMedia("(hover: none)").matches;
    const stage = stageRef.current;
    const face  = faceRef.current;
    if (!stage || !face) return;

    const cleanups = [];

    /* ── tilt-toward-cursor, lerped for a silky, non-snappy feel ── */
    if (!reduceMotion) {
      const TILT_MAX = 7;
      const tick = () => {
        current.current.x += (target.current.x - current.current.x) * 0.08;
        current.current.y += (target.current.y - current.current.y) * 0.08;
        face.style.transform =
          `perspective(700px) rotateY(${(current.current.x * TILT_MAX).toFixed(2)}deg) ` +
          `rotateX(${(-current.current.y * TILT_MAX).toFixed(2)}deg)`;
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      cleanups.push(() => cancelAnimationFrame(rafRef.current));

      if (interactive && !isTouch) {
        const onMove = (e) => {
          const r = stage.getBoundingClientRect();
          target.current.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
          target.current.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        };
        const onLeave = () => { target.current.x = 0; target.current.y = 0; };
        stage.addEventListener("mousemove", onMove);
        stage.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          stage.removeEventListener("mousemove", onMove);
          stage.removeEventListener("mouseleave", onLeave);
        });
      } else if (interactive) {
        /* gentle autonomous sway for touch devices */
        let alive = true;
        (function idle() {
          if (!alive) return;
          target.current.x = (Math.random() - 0.5) * 1.1;
          target.current.y = (Math.random() - 0.5) * 1.1;
          setTimeout(idle, 2400 + Math.random() * 1800);
        })();
        cleanups.push(() => { alive = false; });
      }
    }

    /* ── autonomous blink loop ── */
    if (!reduceMotion) {
      let alive = true;
      let blinkTimer;
      (function blinkLoop() {
        blinkTimer = setTimeout(() => {
          if (!alive) return;
          face.classList.add("blinking");
          setTimeout(() => face.classList.remove("blinking"), 130);
          blinkLoop();
        }, 2800 + Math.random() * 2600);
      })();
      cleanups.push(() => { alive = false; clearTimeout(blinkTimer); });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [interactive]);

  function react() {
    const face = faceRef.current;
    if (!face) return;
    face.classList.add("blinking", "alert");
    setTimeout(() => face.classList.remove("blinking"), 120);
    setTimeout(() => face.classList.remove("alert"), 700);
  }

  return (
    <div
      className={`katobot-stage ${className}`}
      ref={stageRef}
      style={{ "--kb-size": `${size}px` }}
      onClick={interactive ? react : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Katobot" : undefined}
      onKeyDown={interactive ? (e) => (e.key === "Enter" || e.key === " ") && react() : undefined}
    >
      <div className="katobot" ref={faceRef}>
        <img src="/kato-avatar.png" alt="Katobot" className="katobot-img" draggable="false" />
        <span className="katobot-eye katobot-eye-l">
          <span className="katobot-eye-boost" />
          <span className="katobot-eye-lid" />
        </span>
        <span className="katobot-eye katobot-eye-r">
          <span className="katobot-eye-boost" />
          <span className="katobot-eye-lid" />
        </span>
      </div>
    </div>
  );
}

export default Katobot;
