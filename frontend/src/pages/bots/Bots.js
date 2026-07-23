import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLang } from "../../shared/LangContext";
import ChatWidget from "../../shared/ChatWidget/ChatWidget";
import { PORTFOLIO_DATA } from "../web/portfolioData";
import Katobot from "./Katobot";
import "./Bots.css";

gsap.registerPlugin(ScrollTrigger);

const CASE_VISUAL_KIND = { "tg-bot": "chat", "ai-bot": "pulse", "mini-app": "grid", "booking-bot": "calendar" };

// Language-agnostic glyphs for the "how it works" pipeline, in order.
const FLOW_ICONS = ["💬", "⚡", "📋", "🔁"];

// Visuals (icon/tag) for offers with no counterpart in the shared
// portfolioData.js — that file stays untouched since /web's own Portfolio
// tab still reads it as "bots we've built", unrelated to this page's pricing.
const EXTRA_VISUALS = {
  "automation-pro": { icon: "⚙️", tagEn: "PRO", tagRu: "PRO" },
};

// Accent colors reused from the Hub's own palette (Hub.css --hub-blue/violet/
// cyan/emerald/amber) so the two pages read as one system.
const OFFER_ACCENTS = {
  "tg-bot": "#3b82f6",
  "ai-bot": "#8b5cf6",
  "mini-app": "#22d3ee",
  "booking-bot": "#34d399",
  "automation-pro": "#FFB000",
};
function CaseVisual({ kind }) {
  if (kind === "chat") return (
    <div className="bots-case-visual bots-case-visual--chat" aria-hidden="true">
      <span className="bcv-bubble bcv-bubble-a" />
      <span className="bcv-bubble bcv-bubble-b" />
    </div>
  );
  if (kind === "pulse") return (
    <div className="bots-case-visual bots-case-visual--pulse" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => <span className="bcv-bar" key={i} />)}
    </div>
  );
  if (kind === "grid") return (
    <div className="bots-case-visual bots-case-visual--grid" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => <span className="bcv-tile" key={i} />)}
    </div>
  );
  if (kind === "calendar") return (
    <div className="bots-case-visual bots-case-visual--calendar" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <span className={`bcv-cell ${i === 4 ? "bcv-cell--active" : ""}`} key={i} />
      ))}
    </div>
  );
  return null;
}

function OfferCard({ o, lang, onMouseMove, onStart, cta }) {
  return (
    <div className="bots-offer-wrap">
      {o.featured && <span className="bots-offer-badge">POPULAR</span>}
      <div
        className={`bots-offer ${o.featured ? "is-featured" : ""}`}
        style={{ "--accent": OFFER_ACCENTS[o.id] }}
        onMouseMove={onMouseMove}
      >
        <div className="bots-offer-spotlight" />
        <CaseVisual kind={CASE_VISUAL_KIND[o.id]} />
        <span className="bots-offer-icon">{o.icon}</span>
        <span className="bots-offer-tag">{lang === "ru" ? o.tagRu : o.tagEn}</span>
        <h3>{o.name}</h3>
        <p>{o.desc}</p>
        <div className="bots-offer-footer">
          <span className="bots-offer-price">{o.price}</span>
          <button className="bots-offer-cta" onClick={onStart}>{cta} →</button>
        </div>
      </div>
    </div>
  );
}

function Bots() {
  const { lang, setLang, t } = useLang();
  const b = t.bots;
  const offers = b.offers.map((o) => ({
    ...o,
    ...(PORTFOLIO_DATA.bots.items.find((i) => i.id === o.id) || EXTRA_VISUALS[o.id]),
  }));
  const pageRef = useRef(null);
  const [modalOffer, setModalOffer] = useState(null);
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const scrollToPillars = (e) => {
    e.preventDefault();
    document.getElementById("bots-pillars")?.scrollIntoView({ behavior: "smooth" });
  };

  const openChat = () => window.dispatchEvent(new CustomEvent("kato:openChat"));

  const onOfferMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const ctx = gsap.context(() => {
      [".bots-flow-step", ".bots-offer"].forEach((selector) => {
        const els = gsap.utils.toArray(selector);
        if (!els.length) return;
        gsap.set(els, { opacity: 0, y: 26 });
        ScrollTrigger.batch(els, {
          start: "top 88%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.09 }),
        });
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="bots-page" ref={pageRef}>
      <div className="bots-aurora" />
      <div className="bots-grid" />
      <div className="bots-vignette" />

      <header className="bots-header">
        <Link to="/" className="bots-back">
          <span className="bots-back-arrow">←</span> KATO DEVV
        </Link>
        <div className="bots-lang">
          <button className={`bots-lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>ENG</button>
          <span className="bots-lang-sep" />
          <button className={`bots-lang-btn ${lang === "ru" ? "active" : ""}`} onClick={() => setLang("ru")}>RU</button>
        </div>
      </header>

      <main className="bots-hero">
        <div className="bots-stage">
          <div className="bots-stage-ring" />
          <div className="bots-stage-scanlines" />
          <span className="bots-hud bots-hud-online">
            <span className="bots-hud-dot" /> {b.hudOnline}
          </span>
          <Katobot size={280} className="bots-mascot" />
          <div className="bots-stage-reflection" />
        </div>

        <div className="bots-copy">
          <div className="bots-eyebrow">{b.eyebrow}</div>
          <h1 className="bots-headline">
            {b.headlineLead}<br />
            <span className="bots-headline-hot">{b.headlineHot}</span>
          </h1>
          <p className="bots-subtitle">{b.subtitle}</p>
          <div className="bots-cta-row">
            <button className="bots-cta-primary" onClick={openChat}>{b.cta} →</button>
            <a href="#bots-pillars" className="bots-cta-secondary" onClick={scrollToPillars}>{b.secondaryCta}</a>
          </div>
          <div className="bots-comingsoon">
            <img src="/kato-avatar.png" alt="" className="bots-comingsoon-icon" />
            <span>{b.comingSoonBadge}</span>
          </div>
        </div>
      </main>

      <section className="bots-flow" id="bots-pillars">
        <div className="bots-flow-eyebrow">{b.flowEyebrow}</div>
        <h2 className="bots-flow-title">{b.flowTitle}</h2>
        <div className="bots-flow-grid">
          <svg className="bots-flow-path" viewBox="0 0 400 56" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M 50 14 C 90 14, 110 42, 150 42 C 190 42, 210 14, 250 14 C 290 14, 310 42, 350 42"
              className="bots-flow-path-line"
            />
            {[[50, 14], [150, 42], [250, 14], [350, 42]].map(([cx, cy]) => (
              <circle key={cx} cx={cx} cy={cy} r="3" className="bots-flow-path-node" />
            ))}
            {!reducedMotion && (
              <circle r="3.5" className="bots-flow-path-dot">
                <animateMotion
                  dur="6s"
                  repeatCount="indefinite"
                  path="M 50 14 C 90 14, 110 42, 150 42 C 190 42, 210 14, 250 14 C 290 14, 310 42, 350 42"
                />
              </circle>
            )}
          </svg>
          {b.flow.map((f, i) => (
            <div className="bots-flow-step" key={f.step}>
              <span className="bots-flow-step-icon">{FLOW_ICONS[i]}</span>
              <span className="bots-flow-step-label">STEP {f.step}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bots-offers">
        <div className="bots-offers-eyebrow">{b.offersEyebrow}</div>
        <h2 className="bots-offers-title">{b.offersTitle}</h2>
        <div className="bots-offers-grid">
          <div className="bots-offers-row">
            {offers.slice(0, 3).map((o) => (
              <OfferCard key={o.id} o={o} lang={lang} onMouseMove={onOfferMouseMove} onStart={() => setModalOffer(o)} cta={b.cta} />
            ))}
          </div>
          <div className="bots-offers-row bots-offers-row-2">
            {offers.slice(3, 5).map((o) => (
              <OfferCard key={o.id} o={o} lang={lang} onMouseMove={onOfferMouseMove} onStart={() => setModalOffer(o)} cta={b.cta} />
            ))}
          </div>
        </div>
      </section>

      <footer className="bots-footer">© {new Date().getFullYear()} Kato Devv</footer>
      <ChatWidget />

      {modalOffer && (
        <StartProjectModal offer={modalOffer} copy={b.modal} onClose={() => setModalOffer(null)} />
      )}
    </div>
  );
}

// ── Small lead-capture popup opened from an offer card's CTA ──────────────
function StartProjectModal({ offer, copy, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/.netlify/functions/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: offer.name,
          name: name.trim(),
          contact: email.trim(),
          freeText: idea.trim(),
          timestamp: new Date().toLocaleString("ru-RU"),
        }),
      });
      const json = await res.json();
      setStatus(json.success ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="bots-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bots-modal" role="dialog" aria-modal="true" aria-label={copy.title}>
        <button className="bots-modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="bots-modal-tag">{offer.name}</div>
        <h3 className="bots-modal-title">{copy.title}</h3>

        {status === "done" ? (
          <p className="bots-modal-status is-success">{copy.success}</p>
        ) : (
          <form onSubmit={submit}>
            <label className="bots-modal-field">
              <span>{copy.nameLabel}</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={copy.namePlaceholder} required />
            </label>
            <label className="bots-modal-field">
              <span>{copy.emailLabel}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={copy.emailPlaceholder} required />
            </label>
            <label className="bots-modal-field">
              <span>{copy.ideaLabel}</span>
              <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={copy.ideaPlaceholder} rows={3} />
            </label>
            {status === "error" && <p className="bots-modal-status is-error">{copy.error}</p>}
            <button className="bots-modal-submit" type="submit" disabled={status === "sending"}>
              {status === "sending" ? copy.sending : copy.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Bots;
