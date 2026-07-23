import { useEffect, useRef, useState } from "react";
import { useLang } from "../../shared/LangContext";
import { FEATURES, SLOTS, ARCHETYPES, MIN_TO_LAUNCH, computeArchetype } from "./appBuilderData";
import ArchetypeDashboard from "./ArchetypeDashboard";
import "./AppBuilderGame.css";

/* Generous hit-box padding around each slot — dropping "close enough"
   still counts, so the game never feels fiddly on a trackpad or a thumb. */
const HIT_PAD = 26;

const featureByKey = (key) => FEATURES.find((f) => f.key === key);

function AppBuilderGame() {
  const { lang, t } = useLang();
  const a = t.apps;

  const [placed, setPlaced] = useState(() => Array(SLOTS.length).fill(null));
  const [draggingKey, setDraggingKey] = useState(null);
  const [hoverSlot, setHoverSlot] = useState(null);
  // Tap-to-arm, tap-to-place — a second way to place a chip that doesn't
  // need the phone and the tray on screen together. On a tall phone the
  // two are often a scroll apart, and you can't drag across a scroll.
  const [armedKey, setArmedKey] = useState(null);
  const [launched, setLaunched] = useState(false);
  const [result, setResult] = useState(null);

  const followerRef = useRef(null);
  const slotRefs = useRef([]);
  const chipsRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPointerX = useRef(0);
  // Decided lazily on the first few pixels of movement: 'scroll' (mostly
  // sideways — browsing the strip) or 'place' (mostly upward — carrying
  // the chip toward a slot). Same gesture, disambiguated by direction.
  const dragMode = useRef(null);
  // Which physical pointer (finger/mouse) owns the current drag — without
  // this, a second pointerdown arriving before the first one's pointerup
  // (a stray second touch, or a very fast tap-then-drag) overwrites
  // dragStart/dragMode/draggingKey out from under the first pointer's
  // still-in-flight session, so its eventual pointerup fires against the
  // wrong chip/slot. That's the "chip gets stuck to the cursor" bug.
  const activePointerId = useRef(null);

  const filledCount = placed.filter(Boolean).length;
  const canLaunch = filledCount >= MIN_TO_LAUNCH;
  // All ten, always — a drip-fed reveal hid what was on offer and felt
  // scripted. Now everything is one swipe/click away in the strip below.
  const availableFeatures = FEATURES.filter((f) => !placed.includes(f.key));

  const scrollChips = (dir) => {
    const el = chipsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.7), behavior: "smooth" });
  };

  const findSlotAt = (x, y) => {
    for (let i = 0; i < slotRefs.current.length; i++) {
      const el = slotRefs.current[i];
      if (!el || placed[i]) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left - HIT_PAD && x <= r.right + HIT_PAD && y >= r.top - HIT_PAD && y <= r.bottom + HIT_PAD) return i;
    }
    return null;
  };

  const moveFollower = (x, y) => {
    const el = followerRef.current;
    if (el) el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  };

  const placeInSlot = (index, key) => {
    setPlaced((prev) => {
      const next = [...prev];
      next[index] = key;
      return next;
    });
  };

  const onChipPointerDown = (feature, e) => {
    // A drag is already owned by another pointer (stray second touch, or
    // a new pointerdown arriving a beat before the previous one's
    // pointerup) — ignore it rather than hijacking the in-flight session.
    if (draggingKey) return;
    e.preventDefault();
    activePointerId.current = e.pointerId;
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPointerX.current = e.clientX;
    dragMode.current = null;
    setDraggingKey(feature.key);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onChipPointerMove = (e) => {
    if (!draggingKey || e.pointerId !== activePointerId.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    if (dragMode.current === null && Math.hypot(dx, dy) > 8) {
      // Mostly sideways → browsing the strip. Mostly upward → carrying
      // the chip toward a slot (slots sit above the tray).
      dragMode.current = Math.abs(dy) < Math.abs(dx) * 0.6 ? "scroll" : "place";
      if (dragMode.current === "place" && followerRef.current) followerRef.current.style.opacity = "1";
    }

    if (dragMode.current === "scroll") {
      if (chipsRef.current) chipsRef.current.scrollLeft -= e.clientX - lastPointerX.current;
      lastPointerX.current = e.clientX;
      return;
    }

    if (dragMode.current === "place") {
      moveFollower(e.clientX, e.clientY);
      const idx = findSlotAt(e.clientX, e.clientY);
      setHoverSlot((prev) => (prev !== idx ? idx : prev));
    }
  };

  const endDrag = (e) => {
    if (!draggingKey) return;
    // Ignore pointerup/cancel from a pointer that never owned this drag
    // (e.g. a stray second touch lifting first) — only the window-level
    // safety-net call (see effect below) omits `e` and is allowed through
    // unconditionally, since its whole job is cleaning up a session whose
    // owning pointer's own events got lost.
    if (e && e.pointerId !== activePointerId.current) return;
    if (followerRef.current) followerRef.current.style.opacity = "0";
    if (dragMode.current === "place") {
      if (hoverSlot !== null) placeInSlot(hoverSlot, draggingKey);
    } else if (dragMode.current === null) {
      // No real movement at all — treat it as a tap: arm this chip so the
      // next tapped slot receives it, however far away it is on the page.
      setArmedKey((prev) => (prev === draggingKey ? null : draggingKey));
    }
    // dragMode 'scroll' ends here with no further action — it was just browsing.
    dragMode.current = null;
    activePointerId.current = null;
    setDraggingKey(null);
    setHoverSlot(null);
  };

  // Safety net: if the chip's own pointerup/cancel never arrives — lost
  // pointer capture, the element got removed mid-drag, whatever — this
  // still clears the drag on the next global pointer-end or window blur,
  // instead of leaving draggingKey (and the visible follower) stuck
  // forever. Reads the always-current endDrag via a ref so it's never
  // acting on a stale closure from whenever the drag started.
  const endDragRef = useRef(endDrag);
  endDragRef.current = endDrag;
  useEffect(() => {
    const onWindowPointerEnd = () => endDragRef.current();
    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);
    window.addEventListener("blur", onWindowPointerEnd);
    return () => {
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
      window.removeEventListener("blur", onWindowPointerEnd);
    };
  }, []);

  const onSlotClick = (index) => {
    if (!armedKey || placed[index]) return;
    placeInSlot(index, armedKey);
    setArmedKey(null);
  };

  const handleLaunch = () => {
    if (!canLaunch) return;
    setResult(computeArchetype(placed.filter(Boolean)));
    setLaunched(true);
  };

  const handleReset = () => {
    setPlaced(Array(SLOTS.length).fill(null));
    setLaunched(false);
    setResult(null);
  };

  const draggingFeature = draggingKey ? featureByKey(draggingKey) : null;

  const renderSlot = (slot, i) => {
    const filledKey = placed[i];
    const feature = filledKey ? featureByKey(filledKey) : null;
    const hintFeature = featureByKey(slot.featureKey);
    return (
      <div
        key={i}
        ref={(el) => (slotRefs.current[i] = el)}
        onClick={() => onSlotClick(i)}
        className={`abg-slot ${filledKey ? "is-filled" : ""} ${hoverSlot === i ? "is-hover" : ""} ${armedKey && !filledKey ? "is-receptive" : ""}`}
      >
        {feature ? (
          <div className={`abg-filled abg-filled--${feature.key}`}>
            <span className="abg-filled-icon">{feature.icon}</span>
            <span className="abg-filled-label">{lang === "ru" ? feature.titleRu : feature.titleEn}</span>
          </div>
        ) : (
          <div className="abg-slot-hint">
            <span className="abg-slot-hint-icon">{hintFeature.icon}</span>
            <span className="abg-slot-hint-label">{lang === "ru" ? hintFeature.titleRu : hintFeature.titleEn}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="abg">
      <div className={`abg-follower ${draggingKey ? "is-active" : ""}`} ref={followerRef} aria-hidden="true">
        {draggingFeature ? draggingFeature.icon : ""}
      </div>

      <div className="abg-board">
        <div className="abg-slots-col abg-slots-col--left">
          {SLOTS.slice(0, 5).map((slot, i) => renderSlot(slot, i))}
        </div>

        <div className="abg-phone-col">
          <div className={`abg-phone ${launched ? "is-launching" : ""}`}>
            <div className="abg-phone-notch" />
            <div className="abg-phone-screen">
              {launched && result ? (
                <>
                  <div className="abg-dash-header">
                    {lang === "ru" ? ARCHETYPES[result.primary].titleRu : ARCHETYPES[result.primary].titleEn}
                  </div>
                  <ArchetypeDashboard archetypeKey={result.primary} />
                </>
              ) : (
                <>
                  <div className="abg-phone-status">
                    <span>9:41</span>
                    <span className="abg-phone-status-icons">••📶🔋</span>
                  </div>
                  <div className="abg-phone-preview">
                    {filledCount === 0 && <div className="abg-preview-empty">{a.previewEmpty}</div>}
                    {placed.map((key, i) => {
                      if (!key) return null;
                      const feature = featureByKey(key);
                      return (
                        <div key={i} className="abg-preview-row">
                          <span className="abg-preview-icon">{feature.icon}</span>
                          <span className="abg-preview-label">{lang === "ru" ? feature.titleRu : feature.titleEn}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {!launched && (
            <div className="abg-progress">
              <div className="abg-progress-track">
                <div className="abg-progress-fill" style={{ width: `${(filledCount / SLOTS.length) * 100}%` }} />
                <div className="abg-progress-marker" style={{ left: `${(MIN_TO_LAUNCH / SLOTS.length) * 100}%` }} />
              </div>
              <span className="abg-progress-label">{filledCount}/{SLOTS.length}</span>
            </div>
          )}
        </div>

        <div className="abg-slots-col abg-slots-col--right">
          {SLOTS.slice(5).map((slot, i) => renderSlot(slot, i + 5))}
        </div>
      </div>

      {!launched && (
        <div className="abg-tray">
          <div className="abg-tray-hint">{armedKey ? a.armedHint : a.dragHint}</div>
          <div className="abg-chips-row">
            <button className="abg-chips-nav abg-chips-nav--prev" onClick={() => scrollChips(-1)} aria-label="Previous">‹</button>
            <div className="abg-chips" ref={chipsRef}>
              {availableFeatures.map((feature) => (
                <div
                  key={feature.key}
                  className={`abg-chip ${armedKey === feature.key ? "is-armed" : ""}`}
                  onPointerDown={(e) => onChipPointerDown(feature, e)}
                  onPointerMove={onChipPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <span className="abg-chip-icon">{feature.icon}</span>
                  <span className="abg-chip-label">{lang === "ru" ? feature.titleRu : feature.titleEn}</span>
                </div>
              ))}
            </div>
            <button className="abg-chips-nav abg-chips-nav--next" onClick={() => scrollChips(1)} aria-label="Next">›</button>
          </div>

          <button className="abg-launch" disabled={!canLaunch} onClick={handleLaunch}>
            {canLaunch ? a.launchBtn : `${MIN_TO_LAUNCH - filledCount} ${a.needMore}`}
          </button>
        </div>
      )}

      {launched && result && (
        <div className="abg-result">
          <div className="abg-result-eyebrow">{a.resultEyebrow}</div>
          <div className="abg-result-icon">{ARCHETYPES[result.primary].icon}</div>
          <h3 className="abg-result-title">
            {lang === "ru" ? ARCHETYPES[result.primary].titleRu : ARCHETYPES[result.primary].titleEn}
            {result.secondary && (
              <span className="abg-result-hybrid">
                {" × "}{lang === "ru" ? ARCHETYPES[result.secondary].titleRu : ARCHETYPES[result.secondary].titleEn}
              </span>
            )}
          </h3>
          <p className="abg-result-desc">
            {lang === "ru" ? ARCHETYPES[result.primary].descRu : ARCHETYPES[result.primary].descEn}
          </p>

          <div className="abg-result-bridge">{a.bridgeLine}</div>

          <div className="abg-result-actions">
            <button
              className="abg-result-cta"
              onClick={() => window.dispatchEvent(new CustomEvent("kato:openChat"))}
            >
              {a.cta} →
            </button>
            <button className="abg-result-reset" onClick={handleReset}>{a.resetBtn}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppBuilderGame;
