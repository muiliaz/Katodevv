import { useEffect, useState, useRef, Fragment } from "react";
import { useLang } from "../LangContext";
import "./Services.css";

/* ── Card ids (fixed, not translated) ── */
const CARD_IDS = ["web", "mobile", "automation", "bot"];

/* ── 1. Web Development ── */
function WebDevExample() {
  const { t } = useLang();
  const d = t.demos.web;
  return (
    <div className="browser-mockup">
      <div className="browser-bar">
        <div className="browser-dots"><span /><span /><span /></div>
        <div className="browser-url">https://brandco.com</div>
      </div>
      <div className="browser-page">
        <div className="bp-nav">
          <div className="bp-logo">BrandCo</div>
          <div className="bp-links">
            {d.navLinks.map(l => <span key={l}>{l}</span>)}
          </div>
          <div className="bp-cta">{d.navCta}</div>
        </div>
        <div className="bp-hero">
          <div className="bp-hero-left">
            <div className="bp-badge">{d.badge}</div>
            <h1>{d.h1a}<br />{d.h1b}</h1>
            <p>{d.subtitle}</p>
            <div className="bp-btn">{d.cta}</div>
          </div>
          <div className="bp-hero-right">
            {d.stats.map(s => (
              <div className="bp-stat-card" key={s.l}>
                <div className="bp-stat-n">{s.n}</div>
                <div className="bp-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bp-cards">
          {d.features.map(c => (
            <div className="bp-card" key={c.title}>
              <div className="bp-card-icon">{c.icon}</div>
              <div className="bp-card-title">{c.title}</div>
              <div className="bp-card-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 2. Mobile Apps ── */
function MobileExample() {
  const { t } = useLang();
  const d = t.demos.mobile;
  const [platform, setPlatform] = useState("ios");

  return (
    <div className="mobile-demo-wrap">
      <div className="platform-tabs">
        <button className={`platform-tab ${platform === "ios" ? "active" : ""}`} onClick={() => setPlatform("ios")}>
          {d.tabs[0]}
        </button>
        <button className={`platform-tab ${platform === "android" ? "active" : ""}`} onClick={() => setPlatform("android")}>
          {d.tabs[1]}
        </button>
      </div>

      <div className="phone-demo">
        {platform === "ios" ? (
          <div className="phone-frame phone-ios17">
            <div className="ios17-bar">
              <span className="ios-time">9:41</span>
              <div className="ios17-island" />
              <div className="ios-status"></div>
            </div>
            <div className="ios17-screen">
              <div className="ios-app-inner">
                <div className="ios-app-title">{d.financeTitle}</div>
                <div className="ios-balance-card">
                  <div className="ios-balance-label">{d.balanceLabel}</div>
                  <div className="ios-balance-amount">$12,450.00</div>
                  <div className="ios-balance-change">{d.balanceChange}</div>
                </div>
                <div className="ios-actions">
                  {d.actions.map(a => (
                    <div className="ios-action" key={a}>
                      <span className="ios-action-icon">{a.split(" ")[0]}</span>
                      <span className="ios-action-label">{a.split(" ").slice(1).join(" ")}</span>
                    </div>
                  ))}
                </div>
                <div className="ios-section-title">{d.txTitle}</div>
                {d.txItems.map(tx => (
                  <div className="ios-tx" key={tx.name}>
                    <div className="ios-tx-icon">{tx.icon}</div>
                    <div className="ios-tx-name">{tx.name}</div>
                    <div className={`ios-tx-amt ${tx.neg ? "neg" : "pos"}`}>{tx.amt}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ios-home-bar" />
          </div>
        ) : (
          <div className="phone-frame phone-s26">
            <div className="s26-bar">
              <span className="android-time">09:41</span>
              <div className="s26-camera" />
              <div className="android-status"></div>
            </div>
            <div className="s26-screen">
              <div className="android-app-inner">
                <div className="android-header">
                  <div className="android-greeting">{d.greeting}</div>
                  <div className="android-user">Alex</div>
                  <div className="android-delivery-card">
                    <div className="android-delivery-badge">{d.deliveryBadge}</div>
                    <div className="android-delivery-title">{d.deliveryTitle}</div>
                    <div className="android-delivery-eta">{d.deliveryEta}</div>
                    <div className="android-progress-bar"><div className="android-progress-fill" /></div>
                  </div>
                </div>
                <div className="android-cats">
                  {d.cats.map(c => (
                    <div className="android-cat" key={c}>{c}</div>
                  ))}
                </div>
                <div className="android-section-title">{d.popularTitle}</div>
                <div className="android-restaurants">
                  {[
                    { icon:"🍕", name:"Napoli Pizza", rating:"4.8", time:"20 min" },
                    { icon:"🍣", name:"Tokyo Rolls",  rating:"4.9", time:"30 min" },
                  ].map(r => (
                    <div className="android-rest" key={r.name}>
                      <div className="android-rest-icon">{r.icon}</div>
                      <div className="android-rest-info">
                        <div className="android-rest-name">{r.name}</div>
                        <div className="android-rest-meta">⭐{r.rating} · {r.time}</div>
                      </div>
                      <div className="android-rest-order">{d.orderBtn}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="android-nav-bar">
              <span>🏠</span><span>🔍</span><span>📦</span><span>👤</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 3. Automation ── */
const N8N_NODES = [
  { icon: "🔗", label: "Webhook",      desc: "Trigger",    color: "#ff6b35" },
  { icon: "🔀", label: "IF Condition", desc: "Filter",     color: "#6366f1" },
  { icon: "🌐", label: "HTTP Request", desc: "Fetch API",  color: "#0ea5e9" },
  { icon: "⚙️", label: "Set Data",    desc: "Transform",  color: "#8b5cf6" },
  { icon: "📧", label: "Gmail",        desc: "Send Email", color: "#ef4444" },
  { icon: "💬", label: "Slack",        desc: "Notify",     color: "#22c55e" },
];

function AutomationExample() {
  const { t } = useLang();
  const [litIdx, setLitIdx] = useState(-1);

  useEffect(() => {
    const timers = N8N_NODES.map((_, i) =>
      setTimeout(() => setLitIdx(i), 600 + i * 900)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="auto-demo">
      <div className="auto-stats">
        {t.services.autoStats.map(s => (
          <div className="auto-stat" key={s.label}>
            <div className="auto-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="auto-stat-label">{s.label}</div>
            <div className="auto-stat-delta">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="n8n-section-title">
        <span className="n8n-logo">n8n</span> Automation Workflow
        {litIdx < N8N_NODES.length - 1
          ? <span className="n8n-status running">{t.services.n8nRunning}</span>
          : <span className="n8n-status done">{t.services.n8nCompleted}</span>
        }
      </div>
      <div className="n8n-flow">
        {N8N_NODES.map((node, i) => (
          <Fragment key={i}>
            <div
              className={`n8n-node ${litIdx === i ? "lit" : ""} ${litIdx > i ? "done" : ""}`}
              style={litIdx >= i ? { borderColor: node.color, background: node.color + "18" } : {}}
            >
              <div className="n8n-node-icon" style={litIdx >= i ? { color: node.color } : {}}>{node.icon}</div>
              <div className="n8n-node-label">{node.label}</div>
              <div className="n8n-node-desc">{node.desc}</div>
              {litIdx > i && <div className="n8n-node-check" style={{ color: node.color }}>✓</div>}
            </div>
            {i < N8N_NODES.length - 1 && (
              <div className={`n8n-connector ${litIdx > i ? "active" : ""}`}>
                <div className="n8n-line" />
                <div className="n8n-arrow-head" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/* ── 4. AI Bot ── */
function BotExample() {
  const { t } = useLang();
  const st = t.services;
  const [shown, setShown]   = useState([]);
  const [typing, setTyping] = useState(false);
  const msgRef              = useRef(null);

  useEffect(() => {
    const timers = [];
    let cum = 0;
    st.botScript.forEach((msg, i) => {
      cum += msg.delay;
      if (msg.sender === "bot" && i > 0) {
        timers.push(setTimeout(() => setTyping(true), cum - 700));
      }
      timers.push(setTimeout(() => {
        setTyping(false);
        setShown(prev => [...prev, msg]);
      }, cum));
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [shown, typing]);

  return (
    <div className="chat-demo-light">
      <div className="chat-header-light">
        <div className="chat-avatar-light">🤖</div>
        <div className="chat-header-info-light">
          <div className="chat-name-light">{st.botName}</div>
          <div className="chat-online-light">{st.botOnline}</div>
        </div>
        <div className="chat-header-badge">{st.botBadge}</div>
      </div>
      <div className="chat-msgs-light" ref={msgRef}>
        {shown.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.sender}`}>{m.text}</div>
        ))}
        {typing && (
          <div className="chat-bubble bot typing">
            <span /><span /><span />
          </div>
        )}
      </div>
      <div className="chat-input-light">
        <div className="chat-input-field">{st.chatPlaceholder}</div>
        <div className="chat-send-light">➤</div>
      </div>
    </div>
  );
}

/* ── Services Section ── */
const CARD_ICONS = ["🌐", "📱", "⚙️", "🤖"];
const CARD_EXAMPLES = [WebDevExample, MobileExample, AutomationExample, BotExample];

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
        {t.services.cards.map((card, i) => (
          <div
            key={CARD_IDS[i]}
            className="card"
            onClick={() => setActiveCard(CARD_IDS[i])}
          >
            {/* Cube-anchor: visual echo of where the metallic cube landed */}
            <div className="card-cube-anchor">
              <div className="card-cube-dot" />
            </div>
            <span className="card-icon">{CARD_ICONS[i]}</span>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <p className="card-hint">{card.hint}</p>
          </div>
        ))}
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
