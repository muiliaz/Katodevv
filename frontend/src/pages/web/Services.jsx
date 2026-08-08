import { useEffect, useState } from "react";
import { useLang } from "../../shared/LangContext";
import BotServiceCard from "./BotServiceCard";
import WebDevExample from "./serviceDemos/WebDevExample";
import MobileExample from "./serviceDemos/MobileExample";
import AutomationExample from "./serviceDemos/AutomationExample";
import BotExample from "./serviceDemos/BotExample";
import "./Services.css";

// The services grid and the modal it opens. The four demos inside that modal
// live in serviceDemos/ — this file used to hold all of them and ran to 572
// lines (tech-health TH-004).
//
// The three arrays below are parallel to t.services.cards and are indexed by
// position, not by name: card i shows CARD_ICONS[i] and opens CARD_EXAMPLES[i]
// under CARD_IDS[i]. Reordering one without the others silently opens the wrong
// demo — lang.test.js pins the card count and Services.test.jsx pins the
// pairing, because neither the build nor the linter would say a word.

/* ── Card ids (fixed, not translated) ── */
const CARD_IDS = ["web", "mobile", "automation", "bot"];
const CARD_ICONS = ["🌐", "📱", "⚙️", "🤖"];
const CARD_EXAMPLES = [WebDevExample, MobileExample, AutomationExample, BotExample];

// The bot card is the odd one out — its own component, with the badge and the
// hover terminal.
const BOT_INDEX = CARD_IDS.indexOf("bot");

function Services() {
  const { t } = useLang();
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setActiveCard(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Stop/start Lenis when modal opens/closes */
  useEffect(() => {
    if (window.__lenis) {
      activeCard ? window.__lenis.stop() : window.__lenis.start();
    }
  }, [activeCard]);

  const activeIdx = CARD_IDS.indexOf(activeCard);
  const activeCardData = activeIdx >= 0 ? t.services.cards[activeIdx] : null;
  const ActiveExample  = activeIdx >= 0 ? CARD_EXAMPLES[activeIdx] : null;

  return (
    <section className="services">
      <h2>{t.services.sectionTitle}</h2>

      <div className="services-grid">
        {t.services.cards.map((card, i) =>
          i === BOT_INDEX ? (
            <BotServiceCard key={CARD_IDS[i]} card={card} onClick={() => setActiveCard(CARD_IDS[i])} />
          ) : (
            <div key={CARD_IDS[i]} className="card" onClick={() => setActiveCard(CARD_IDS[i])}>
              <div className="card-cube-anchor"><div className="card-cube-dot" /></div>
              <span className="card-icon">{CARD_ICONS[i]}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <p className="card-hint">{card.hint}</p>
            </div>
          )
        )}
      </div>

      {activeCardData && ActiveExample && (
        <div className="modal-overlay" onClick={() => setActiveCard(null)}>
          <div className="modal-box" data-lenis-prevent onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveCard(null)}>✕</button>
            <div className="modal-title">{activeCardData.modalTitle}</div>
            <div className="modal-subtitle">{activeCardData.modalSub}</div>
            <ActiveExample />
          </div>
        </div>
      )}
    </section>
  );
}

export default Services;
