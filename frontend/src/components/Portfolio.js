import { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import "./Portfolio.css";

/* ══════════════════════════════════════════════════
   1. LANDING PAGE — FitPeak fitness app
══════════════════════════════════════════════════ */
function LandingExample() {
  const { t } = useLang();
  const d = t.demos.landing;
  return (
    <div className="lp-site">
      <nav className="lp-nav">
        <div className="lp-logo">⚡ FitPeak</div>
        <div className="lp-nav-links">
          {d.navLinks.map(l => <span key={l}>{l}</span>)}
        </div>
        <button className="lp-nav-cta">{d.navCta}</button>
      </nav>

      <section className="lp-hero">
        <div className="lp-badge">{d.badge}</div>
        <h1>{d.h1a}<br />{d.h1b}</h1>
        <p>{d.subtitle}</p>
        <div className="lp-btn-row">
          <button className="lp-btn-primary">{d.ctaPrimary}</button>
          <button className="lp-btn-secondary">{d.ctaSecondary}</button>
        </div>
      </section>

      <div className="lp-stats">
        {d.stats.map(s => (
          <div key={s.l}>
            <div className="lp-stat-num">{s.n}</div>
            <div className="lp-stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      <section className="lp-features">
        <h2 className="lp-section-title">{d.featuresTitle}</h2>
        <p className="lp-section-sub">{d.featuresSub}</p>
        <div className="lp-features-grid">
          {d.features.map(f => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-testimonials">
        <h2 className="lp-section-title">{d.testiTitle}</h2>
        <p className="lp-section-sub">{d.testiSub}</p>
        <div className="lp-testi-grid">
          <div className="lp-testi">
            <div className="lp-testi-stars">★★★★★</div>
            <p className="lp-testi-text">"I lost 12 kg in 3 months. The personalised plan made all the difference — it actually fits into my busy life!"</p>
            <div className="lp-testi-author">Sarah K.</div>
            <div className="lp-testi-role">Marketing Manager</div>
          </div>
          <div className="lp-testi">
            <div className="lp-testi-stars">★★★★★</div>
            <p className="lp-testi-text">"Best fitness app I've ever used. The live classes feel like having a personal trainer at a fraction of the cost."</p>
            <div className="lp-testi-author">James R.</div>
            <div className="lp-testi-role">Software Engineer</div>
          </div>
          <div className="lp-testi">
            <div className="lp-testi-stars">★★★★★</div>
            <p className="lp-testi-text">"The progress tracking keeps me so motivated. I can see exactly how far I've come and it pushes me to keep going."</p>
            <div className="lp-testi-author">Mia T.</div>
            <div className="lp-testi-role">Graphic Designer</div>
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <h2>{d.ctaTitle}</h2>
        <p>{d.ctaText}</p>
        <div className="lp-btn-row">
          <button className="lp-btn-primary">{d.ctaBtn}</button>
        </div>
      </section>

      <footer className="lp-footer">
        <span>{d.footerRights}</span>
        <div style={{ display: "flex", gap: 20, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          {d.footerLinks.map(l => <span key={l}>{l}</span>)}
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   2. BUSINESS WEBSITE — Nexus Consulting
══════════════════════════════════════════════════ */
function BusinessExample() {
  const { t } = useLang();
  const d = t.demos.business;
  const TAB_KEYS = ["home", "services", "about", "contact"];
  const [tab, setTab] = useState("home");

  return (
    <div className="biz-site">
      <nav className="biz-nav">
        <div className="biz-logo">◈ Nexus Consulting</div>
        <div className="biz-tabs">
          {TAB_KEYS.map((key, i) => (
            <button key={key} className={`biz-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              {d.tabs[i]}
            </button>
          ))}
        </div>
        <button className="biz-nav-cta">{d.navCta}</button>
      </nav>

      <div className="biz-content">
        {tab === "home" && (
          <>
            <div className="biz-home-hero">
              <h1>{d.homeH1a}<br />{d.homeH1b}</h1>
              <p>{d.homeSubtitle}</p>
              <button className="biz-hero-btn" onClick={() => setTab("contact")}>{d.homeCta}</button>
            </div>
            <div className="biz-home-stats">
              {d.stats.map(s => (
                <div className="biz-stat-item" key={s.l}>
                  <div className="biz-stat-num">{s.n}</div>
                  <div className="biz-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="biz-home-services">
              <h2>{d.whatWeDoTitle}</h2>
              <p>{d.whatWeDosub}</p>
              <div className="biz-srv-grid">
                {d.homeServices.map(s => (
                  <div className="biz-srv-card" key={s.title}>
                    <div className="biz-srv-icon">{s.icon}</div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "services" && (
          <div className="biz-services-page">
            <h2>{d.srvPageTitle}</h2>
            <p>{d.srvPageSub}</p>
            <div className="biz-srv-list">
              {d.srvList.map(s => (
                <div className="biz-srv-row" key={s.title}>
                  <div className="biz-srv-row-icon">{s.icon}</div>
                  <div className="biz-srv-row-info"><h4>{s.title}</h4><p>{s.desc}</p></div>
                  <div className="biz-srv-row-price">{s.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "about" && (
          <div className="biz-about-page">
            <div className="biz-about-hero">
              <h2>{d.abtTitle}</h2>
              <p>{d.abtText}</p>
            </div>
            <div className="biz-team-title">{d.teamTitle}</div>
            <div className="biz-team-grid">
              {[
                { emoji: "👨‍💼", name: "Alex Morgan", role: "CEO & Founder" },
                { emoji: "👩‍💻", name: "Priya Sharma", role: "CTO" },
                { emoji: "👨‍🔬", name: "Daniel Park", role: "Head of Strategy" },
                { emoji: "👩‍🎨", name: "Laura Chen", role: "Design Director" },
                { emoji: "👨‍📈", name: "Sam Wilson", role: "Lead Analyst" },
                { emoji: "👩‍⚖️", name: "Nina Brooks", role: "M&A Advisor" },
              ].map(m => (
                <div className="biz-team-card" key={m.name}>
                  <div className="biz-team-avatar" style={{ background: "#eff6ff" }}>{m.emoji}</div>
                  <h4>{m.name}</h4>
                  <span>{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "contact" && (
          <div className="biz-contact-page">
            <div className="biz-contact-info">
              <h2>{d.ctcTitle}</h2>
              <p>{d.ctcText}</p>
              {d.ctcItems.map(c => (
                <div className="biz-contact-item" key={c.icon}>
                  <div className="biz-contact-item-icon">{c.icon}</div>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
            <form className="biz-form" onSubmit={e => e.preventDefault()}>
              <input type="text"  placeholder={d.ctcForm.name} />
              <input type="email" placeholder={d.ctcForm.email} />
              <input type="text"  placeholder={d.ctcForm.company} />
              <textarea placeholder={d.ctcForm.message} />
              <button className="biz-form-btn" type="submit">{d.ctcForm.send}</button>
            </form>
          </div>
        )}
      </div>

      <footer className="biz-footer">
        <div className="biz-logo" style={{ fontSize: 16 }}>◈ Nexus Consulting</div>
        <div className="biz-footer-links">
          {d.footerLinks.map(l => <span key={l}>{l}</span>)}
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>{d.footerRights}</span>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   3. E-COMMERCE — TechZone Store
══════════════════════════════════════════════════ */
const PRODUCTS = [
  { id: 1, name: "MacBook Pro 14\"", specs: "M3 Pro · 18GB RAM · 512GB SSD", price: 1999, emoji: "💻", badge: "Bestseller" },
  { id: 2, name: "iPhone 15 Pro Max", specs: "256GB · Titanium · A17 Pro chip", price: 1199, emoji: "📱", badge: "New" },
  { id: 3, name: "AirPods Pro 2nd Gen", specs: "Active Noise Cancellation · USB-C", price: 249, emoji: "🎧", badge: "" },
  { id: 4, name: "iPad Pro 12.9\"", specs: "M2 chip · 256GB · Wi-Fi + 5G", price: 1099, emoji: "📲", badge: "Sale" },
  { id: 5, name: "Apple Watch Ultra 2", specs: "49mm · Titanium · GPS + Cellular", price: 799, emoji: "⌚", badge: "" },
];

function EcommerceExample() {
  const { t } = useLang();
  const d = t.demos.ecom;
  const [cart, setCart] = useState([]);
  const [filterIdx, setFilterIdx] = useState(0);
  const [showCart, setShowCart] = useState(false);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="shop-site">
      <nav className="shop-nav">
        <div className="shop-logo">◆ TechZone</div>
        <div className="shop-nav-links">
          {d.navLinks.map(l => <span key={l}>{l}</span>)}
        </div>
        <div className="shop-nav-right">
          <input className="shop-search" placeholder="🔍  Search..." readOnly />
          <button className="shop-cart-btn" onClick={() => setShowCart(v => !v)}>
            🛒 {d.cartHeader}
            {cartCount > 0 && <span className="shop-cart-count">{cartCount}</span>}
          </button>
        </div>
      </nav>

      <div className="shop-banner">
        <div className="shop-banner-left">
          <div className="shop-banner-badge">{d.bannerBadge}</div>
          <h1>{d.bannerH1a}<br />{d.bannerH1b}</h1>
          <p>{d.bannerSub}</p>
          <button className="shop-banner-btn">{d.bannerCta}</button>
        </div>
        <div className="shop-banner-emoji">💻</div>
      </div>

      <div className="shop-main">
        <div className="shop-sidebar">
          <h4>{d.catTitle}</h4>
          {d.cats.map((f, i) => (
            <div key={f} className={`shop-filter-item ${filterIdx === i ? "active" : ""}`} onClick={() => setFilterIdx(i)}>
              <div className="shop-filter-dot" />{f}
            </div>
          ))}
          <h4 style={{ marginTop: 24 }}>{d.priceTitle}</h4>
          {d.priceRanges.map(r => (
            <div key={r} className="shop-filter-item">
              <div className="shop-filter-dot" />{r}
            </div>
          ))}
        </div>

        <div className="shop-products-area">
          <div className="shop-products-header">
            <h3>{d.allProducts}</h3>
            <span>{PRODUCTS.length} {d.items}</span>
          </div>
          <div className="shop-products-grid">
            {PRODUCTS.map((p) => {
              const inCart = cart.find((i) => i.id === p.id);
              return (
                <div className="shop-product-card" key={p.id}>
                  <div className="shop-product-img">
                    {p.badge && (
                      <span style={{
                        position: "absolute", top: 10, left: 10,
                        fontSize: 10, fontWeight: 700, padding: "3px 8px",
                        borderRadius: 20, color: "white",
                        background: p.badge === "New" ? "#2563eb" : p.badge === "Sale" ? "#ef4444" : "#f59e0b",
                      }}>{d.badges[p.badge] || p.badge}</span>
                    )}
                    {p.emoji}
                  </div>
                  <div className="shop-product-info">
                    <div className="shop-product-name">{p.name}</div>
                    <div className="shop-product-specs">{p.specs}</div>
                    <div className="shop-product-bottom">
                      <div className="shop-product-price">${p.price.toLocaleString()}</div>
                      <button className={`shop-add-btn ${inCart ? "added" : ""}`} onClick={() => addToCart(p)}>
                        {inCart ? d.added : d.addCart}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`shop-cart-drawer ${showCart ? "open" : ""}`}>
          <div className="shop-cart-header">🛒 {d.cartHeader} {cartCount > 0 && `(${cartCount})`}</div>
          <div className="shop-cart-items">
            {cart.length === 0 ? (
              <div className="shop-cart-empty">
                <div style={{ fontSize: 36, marginBottom: 10 }}>🛒</div>
                {d.cartEmpty.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
              </div>
            ) : (
              cart.map((item) => (
                <div className="shop-cart-item" key={item.id}>
                  <div className="shop-cart-item-icon">{item.emoji}</div>
                  <div className="shop-cart-item-info">
                    <div className="shop-cart-item-name">{item.name}</div>
                    <div className="shop-cart-item-price">${item.price.toLocaleString()}</div>
                  </div>
                  <div className="shop-cart-item-qty">
                    <button className="shop-qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                    {item.qty}
                    <button className="shop-qty-btn" onClick={() => changeQty(item.id, 1)}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="shop-cart-footer">
              <div className="shop-cart-total">
                <span>{d.cartTotal}</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <button className="shop-checkout-btn">{d.checkout}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   4. CRM SYSTEM — KatoFlow CRM
══════════════════════════════════════════════════ */
const CONTACTS = [
  { id: 1, name: "Alice Johnson",  company: "TechCorp Inc.",     status: "active", value: "$15,000", last: "Today"      },
  { id: 2, name: "Bob Martinez",   company: "Startup XYZ",       status: "lead",   value: "$8,500",  last: "Yesterday"  },
  { id: 3, name: "Carol Smith",    company: "RetailCo Ltd.",      status: "closed", value: "$22,000", last: "3 days ago" },
  { id: 4, name: "David Lee",      company: "FinanceHub",         status: "new",    value: "$5,000",  last: "1 week ago" },
  { id: 5, name: "Emma Davis",     company: "MediaGroup LLC",     status: "lead",   value: "$12,000", last: "2 days ago" },
];

const PIPELINE = {
  "New Lead": [
    { name: "Emma Davis",    company: "MediaGroup LLC",   value: "$12,000", tag: "warm" },
    { name: "David Lee",     company: "FinanceHub",       value: "$5,000",  tag: "cold" },
  ],
  "In Progress": [
    { name: "Bob Martinez",  company: "Startup XYZ",      value: "$8,500",  tag: "hot"  },
    { name: "Alice Johnson", company: "TechCorp Inc.",     value: "$15,000", tag: "warm" },
  ],
  "Closed Won": [
    { name: "Carol Smith",   company: "RetailCo Ltd.",     value: "$22,000", tag: "hot"  },
  ],
};

function CRMExample() {
  const { t } = useLang();
  const d = t.demos.crm;
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState(d.tasks);
  const toggleTask = (id) => setTasks(prev => prev.map(tk => tk.id === id ? { ...tk, done: !tk.done } : tk));

  return (
    <div className="crm-site">
      <div className="crm-topbar">
        <div className="crm-logo">⚡ KatoFlow CRM</div>
        <div className="crm-topbar-right">
          <span>🔔</span><span>⚙️</span>
          <div className="crm-user-badge">A</div>
          <span>{d.admin}</span>
        </div>
      </div>

      <div className="crm-layout">
        <div className="crm-sidebar">
          {d.nav.map(n => (
            <div key={n.key} className={`crm-nav-item ${page === n.key ? "active" : ""}`} onClick={() => setPage(n.key)}>
              <span className="crm-nav-icon">{n.icon}</span>{n.label}
            </div>
          ))}
        </div>

        <div className="crm-main">
          {page === "dashboard" && (
            <>
              <div className="crm-page-title">{d.dashTitle}</div>
              <div className="crm-stats-grid">
                {d.stats.map(s => (
                  <div className="crm-stat-card" key={s.label}>
                    <div className="crm-stat-icon">{s.icon}</div>
                    <div className="crm-stat-value">{s.value}</div>
                    <div className="crm-stat-label">{s.label}</div>
                    <div className="crm-stat-delta">{s.delta}</div>
                  </div>
                ))}
              </div>
              <div className="crm-two-col">
                <div className="crm-widget">
                  <div className="crm-widget-title">{d.actTitle}</div>
                  {d.activities.map((a, i) => (
                    <div className="crm-activity-item" key={i}>
                      <div className="crm-act-dot" />
                      <div>
                        <div className="crm-act-text">{a.text}</div>
                        <div className="crm-act-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="crm-widget">
                  <div className="crm-widget-title">{d.tasksTitle}</div>
                  {tasks.map(tk => (
                    <div className="crm-task-item" key={tk.id}>
                      <div className={`crm-task-check ${tk.done ? "done" : ""}`} onClick={() => toggleTask(tk.id)}>
                        {tk.done ? "✓" : ""}
                      </div>
                      <span className={`crm-task-text ${tk.done ? "done" : ""}`}>{tk.text}</span>
                      <span className={`crm-task-badge ${tk.priority}`}>{tk.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {page === "contacts" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div className="crm-page-title" style={{ margin: 0 }}>{d.contTitle}</div>
                <button style={{ padding: "9px 20px", background: "linear-gradient(90deg,#f59e0b,#f97316)", border: "none", borderRadius: 8, color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  {d.addContact}
                </button>
              </div>
              <div className="crm-table-wrapper">
                <table className="crm-table">
                  <thead>
                    <tr>{d.tableHeaders.map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {CONTACTS.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div className="crm-contact-name">{c.name}</div>
                          <div className="crm-contact-company">{c.company}</div>
                        </td>
                        <td><span className={`crm-status-badge ${c.status}`}>{d.statuses[c.status]}</span></td>
                        <td style={{ fontWeight: 700 }}>{c.value}</td>
                        <td style={{ color: "#94a3b8" }}>{c.last}</td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="crm-action-btn">{d.viewBtn}</button>
                          <button className="crm-action-btn">{d.editBtn}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {page === "pipeline" && (
            <>
              <div className="crm-page-title">{d.pipeTitle}</div>
              <div className="crm-pipeline-grid">
                {Object.entries(PIPELINE).map(([stage, deals]) => (
                  <div className="crm-pipeline-col" key={stage}>
                    <div className="crm-pipeline-header">
                      <span>{d.pipeStages[stage]}</span>
                      <span className="crm-pipeline-count">{deals.length}</span>
                    </div>
                    <div className="crm-pipeline-cards">
                      {deals.map((deal, i) => (
                        <div className="crm-deal-card" key={i}>
                          <div className="crm-deal-name">{deal.name}</div>
                          <div className="crm-deal-company">{deal.company}</div>
                          <div className="crm-deal-footer">
                            <div className="crm-deal-value">{deal.value}</div>
                            <span className={`crm-deal-tag ${deal.tag}`}>{d.tags[deal.tag]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Portfolio Cards Static Data (ids, styles, components)
══════════════════════════════════════════════════ */
const CARDS_STATIC = [
  { id: "landing",  thumbClass: "thumb-landing",  icon: "🚀", Example: LandingExample  },
  { id: "business", thumbClass: "thumb-business", icon: "🏢", Example: BusinessExample },
  { id: "ecom",     thumbClass: "thumb-ecom",     icon: "🛒", Example: EcommerceExample },
  { id: "crm",      thumbClass: "thumb-crm",      icon: "📊", Example: CRMExample      },
];

/* ══════════════════════════════════════════════════
   Portfolio Section
══════════════════════════════════════════════════ */
function Portfolio() {
  const { t } = useLang();
  const [active, setActive] = useState(null);

  const activeStatic = CARDS_STATIC.find((c) => c.id === active);
  const activeIdx    = CARDS_STATIC.findIndex((c) => c.id === active);
  const activeTrans  = activeIdx >= 0 ? t.portfolio.cards[activeIdx] : null;

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    if (window.__lenis) {
      active ? window.__lenis.stop() : window.__lenis.start();
    }
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  return (
    <section className="portfolio">
      <h2>{t.portfolio.sectionTitle}</h2>

      <div className="portfolio-grid">
        {CARDS_STATIC.map((card, i) => {
          const tr = t.portfolio.cards[i];
          return (
            <div
              key={card.id}
              className="portfolio-card"
              onClick={() => setActive(card.id)}
            >
              <div className={`card-thumb ${card.thumbClass}`}>
                <div className="card-thumb-icon">{card.icon}</div>
                <div className="thumb-browser">
                  <span /><span /><span />
                </div>
              </div>
              <div className="card-body">
                <div className="card-tag">{tr.tag}</div>
                <h3>{tr.title}</h3>
                <p>{tr.desc}</p>
                <div className="card-open-btn">{t.portfolio.viewProject}</div>
              </div>
            </div>
          );
        })}
      </div>

      {activeStatic && activeTrans && (
        <div className="port-overlay" onClick={() => setActive(null)}>
          <div className="port-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="port-close" onClick={() => setActive(null)}>✕</button>
            <div className="port-modal">
              <div className="port-modal-inner" data-lenis-prevent onWheel={(e) => e.stopPropagation()}>
                <activeStatic.Example />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Portfolio;
