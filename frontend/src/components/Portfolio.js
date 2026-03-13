import { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import "./Portfolio.css";

/* ══════════════════════════════════════════════════
   1. LANDING PAGE — FitPeak fitness app
══════════════════════════════════════════════════ */
function LandingExample() {
  return (
    <div className="lp-site">
      {/* Navbar */}
      <nav className="lp-nav">
        <div className="lp-logo">⚡ FitPeak</div>
        <div className="lp-nav-links">
          <span>Features</span>
          <span>Pricing</span>
          <span>Blog</span>
          <span>About</span>
        </div>
        <button className="lp-nav-cta">Start Free Trial</button>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-badge">🏆 #1 Fitness App in 2025</div>
        <h1>Train Smarter,<br />Get Stronger</h1>
        <p>
          Personalised workout plans, real-time coaching and progress tracking —
          all in one sleek app. Reach your goals 3× faster.
        </p>
        <div className="lp-btn-row">
          <button className="lp-btn-primary">Get Started Free →</button>
          <button className="lp-btn-secondary">▶ Watch Demo</button>
        </div>
      </section>

      {/* Stats */}
      <div className="lp-stats">
        <div>
          <div className="lp-stat-num">500K+</div>
          <div className="lp-stat-label">Active Users</div>
        </div>
        <div>
          <div className="lp-stat-num">4.9★</div>
          <div className="lp-stat-label">App Store Rating</div>
        </div>
        <div>
          <div className="lp-stat-num">1.2M</div>
          <div className="lp-stat-label">Workouts Logged</div>
        </div>
        <div>
          <div className="lp-stat-num">98%</div>
          <div className="lp-stat-label">Satisfaction Rate</div>
        </div>
      </div>

      {/* Features */}
      <section className="lp-features">
        <h2 className="lp-section-title">Everything You Need</h2>
        <p className="lp-section-sub">Powerful tools to keep you on track and motivated every day.</p>
        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <div className="lp-feature-icon">🎯</div>
            <h4>Personalised Plans</h4>
            <p>AI-generated training plans adapted to your goals, fitness level, and schedule.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">📺</div>
            <h4>Live Classes</h4>
            <p>Join 200+ weekly live classes led by certified coaches — HIIT, yoga, strength and more.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">📊</div>
            <h4>Progress Tracking</h4>
            <p>Visual charts, body stats and milestone badges to keep you motivated every step.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">🍎</div>
            <h4>Nutrition Log</h4>
            <p>Track macros and calories with our smart food database of 2M+ items.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">👥</div>
            <h4>Community</h4>
            <p>Connect with friends, share progress and compete in weekly challenges together.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">⌚</div>
            <h4>Wearable Sync</h4>
            <p>Connects with Apple Watch, Garmin and Fitbit to auto-sync your activity data.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="lp-testimonials">
        <h2 className="lp-section-title">What Our Users Say</h2>
        <p className="lp-section-sub">Thousands of people have already transformed their lives with FitPeak.</p>
        <div className="lp-testi-grid">
          <div className="lp-testi">
            <div className="lp-testi-stars">★★★★★</div>
            <p className="lp-testi-text">
              "I lost 12 kg in 3 months. The personalised plan made all the difference —
              it actually fits into my busy life!"
            </p>
            <div className="lp-testi-author">Sarah K.</div>
            <div className="lp-testi-role">Marketing Manager</div>
          </div>
          <div className="lp-testi">
            <div className="lp-testi-stars">★★★★★</div>
            <p className="lp-testi-text">
              "Best fitness app I've ever used. The live classes feel like having
              a personal trainer at a fraction of the cost."
            </p>
            <div className="lp-testi-author">James R.</div>
            <div className="lp-testi-role">Software Engineer</div>
          </div>
          <div className="lp-testi">
            <div className="lp-testi-stars">★★★★★</div>
            <p className="lp-testi-text">
              "The progress tracking keeps me so motivated. I can see exactly how far
              I've come and it pushes me to keep going."
            </p>
            <div className="lp-testi-author">Mia T.</div>
            <div className="lp-testi-role">Graphic Designer</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Ready to Transform Your Body?</h2>
        <p>Join 500,000+ people already reaching their goals with FitPeak.</p>
        <div className="lp-btn-row">
          <button className="lp-btn-primary">Start Free — No Credit Card</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <span>© 2025 FitPeak. All rights reserved.</span>
        <div style={{ display: "flex", gap: 20, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          <span>Privacy</span><span>Terms</span><span>Support</span>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   2. BUSINESS WEBSITE — Nexus Consulting
══════════════════════════════════════════════════ */
function BusinessExample() {
  const [tab, setTab] = useState("home");

  return (
    <div className="biz-site">
      {/* Navbar */}
      <nav className="biz-nav">
        <div className="biz-logo">◈ Nexus Consulting</div>
        <div className="biz-tabs">
          {["home", "services", "about", "contact"].map((t) => (
            <button
              key={t}
              className={`biz-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button className="biz-nav-cta">Free Consultation</button>
      </nav>

      <div className="biz-content">
        {/* ── HOME ── */}
        {tab === "home" && (
          <>
            <div className="biz-home-hero">
              <h1>We Help Businesses<br />Scale Smarter</h1>
              <p>Strategy, technology and growth consulting for forward-thinking companies ready to reach the next level.</p>
              <button className="biz-hero-btn" onClick={() => setTab("contact")}>Get Started →</button>
            </div>

            <div className="biz-home-stats">
              <div className="biz-stat-item">
                <div className="biz-stat-num">350+</div>
                <div className="biz-stat-lbl">Projects Delivered</div>
              </div>
              <div className="biz-stat-item">
                <div className="biz-stat-num">98%</div>
                <div className="biz-stat-lbl">Client Satisfaction</div>
              </div>
              <div className="biz-stat-item">
                <div className="biz-stat-num">12+</div>
                <div className="biz-stat-lbl">Years Experience</div>
              </div>
              <div className="biz-stat-item">
                <div className="biz-stat-num">40+</div>
                <div className="biz-stat-lbl">Expert Consultants</div>
              </div>
            </div>

            <div className="biz-home-services">
              <h2>What We Do</h2>
              <p>End-to-end solutions across strategy, technology and operations.</p>
              <div className="biz-srv-grid">
                <div className="biz-srv-card">
                  <div className="biz-srv-icon">🚀</div>
                  <h4>Growth Strategy</h4>
                  <p>Data-driven roadmaps to accelerate your revenue and market share.</p>
                </div>
                <div className="biz-srv-card">
                  <div className="biz-srv-icon">💻</div>
                  <h4>Digital Transformation</h4>
                  <p>Modernise your tech stack and automate core processes end-to-end.</p>
                </div>
                <div className="biz-srv-card">
                  <div className="biz-srv-icon">📊</div>
                  <h4>Business Analytics</h4>
                  <p>Unlock hidden insights in your data to make smarter decisions faster.</p>
                </div>
                <div className="biz-srv-card">
                  <div className="biz-srv-icon">🤝</div>
                  <h4>M&A Advisory</h4>
                  <p>Expert guidance on mergers, acquisitions and strategic partnerships.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SERVICES ── */}
        {tab === "services" && (
          <div className="biz-services-page">
            <h2>Our Services</h2>
            <p>Tailored consulting packages to match your business stage and goals.</p>
            <div className="biz-srv-list">
              {[
                { icon: "🚀", title: "Growth Strategy", desc: "Market analysis, competitive positioning and revenue roadmap for scaling your business in competitive markets.", price: "from $4,500/mo" },
                { icon: "💻", title: "Digital Transformation", desc: "Full audit of your existing processes and technology, followed by an actionable modernisation plan.", price: "from $8,000/mo" },
                { icon: "📊", title: "Business Analytics & BI", desc: "Custom dashboards, KPI frameworks and data pipelines to give leadership real-time visibility.", price: "from $3,200/mo" },
                { icon: "🤝", title: "M&A Advisory", desc: "Due diligence support, valuation modelling and integration planning for mergers and acquisitions.", price: "from $12,000" },
                { icon: "🎯", title: "Marketing Optimisation", desc: "Conversion rate optimisation, funnel analysis and campaign performance reviews.", price: "from $2,800/mo" },
              ].map((s) => (
                <div className="biz-srv-row" key={s.title}>
                  <div className="biz-srv-row-icon">{s.icon}</div>
                  <div className="biz-srv-row-info">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                  <div className="biz-srv-row-price">{s.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ABOUT ── */}
        {tab === "about" && (
          <div className="biz-about-page">
            <div className="biz-about-hero">
              <h2>Built on Trust & Results</h2>
              <p>
                Founded in 2013, Nexus Consulting has grown from a two-person boutique into a
                full-service firm trusted by over 200 companies across 18 countries.
              </p>
            </div>
            <div className="biz-team-title">Meet the Leadership Team</div>
            <div className="biz-team-grid">
              {[
                { emoji: "👨‍💼", name: "Alex Morgan", role: "CEO & Founder" },
                { emoji: "👩‍💻", name: "Priya Sharma", role: "CTO" },
                { emoji: "👨‍🔬", name: "Daniel Park", role: "Head of Strategy" },
                { emoji: "👩‍🎨", name: "Laura Chen", role: "Design Director" },
                { emoji: "👨‍📈", name: "Sam Wilson", role: "Lead Analyst" },
                { emoji: "👩‍⚖️", name: "Nina Brooks", role: "M&A Advisor" },
              ].map((m) => (
                <div className="biz-team-card" key={m.name}>
                  <div className="biz-team-avatar" style={{ background: "#eff6ff" }}>{m.emoji}</div>
                  <h4>{m.name}</h4>
                  <span>{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTACT ── */}
        {tab === "contact" && (
          <div className="biz-contact-page">
            <div className="biz-contact-info">
              <h2>Get in Touch</h2>
              <p>
                Whether you're looking for a strategic partner or just want to explore what's possible —
                we'd love to hear from you.
              </p>
              {[
                { icon: "📍", text: "123 Business Ave, New York, NY 10001" },
                { icon: "📞", text: "+1 (555) 234-5678" },
                { icon: "📧", text: "hello@nexus-consulting.com" },
                { icon: "🕐", text: "Mon–Fri: 9:00 AM – 6:00 PM EST" },
              ].map((c) => (
                <div className="biz-contact-item" key={c.icon}>
                  <div className="biz-contact-item-icon">{c.icon}</div>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
            <form className="biz-form" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Your Name" />
              <input type="email" placeholder="Email Address" />
              <input type="text" placeholder="Company Name" />
              <textarea placeholder="Tell us about your project..." />
              <button className="biz-form-btn" type="submit">Send Message →</button>
            </form>
          </div>
        )}
      </div>

      <footer className="biz-footer">
        <div className="biz-logo" style={{ fontSize: 16 }}>◈ Nexus Consulting</div>
        <div className="biz-footer-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Careers</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>© 2025 Nexus Consulting</span>
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
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("All");

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
      {/* Navbar */}
      <nav className="shop-nav">
        <div className="shop-logo">◆ TechZone</div>
        <div className="shop-nav-links">
          <span>Mac</span>
          <span>iPhone</span>
          <span>iPad</span>
          <span>Accessories</span>
        </div>
        <div className="shop-nav-right">
          <input className="shop-search" placeholder="🔍  Search products..." readOnly />
          <button className="shop-cart-btn">
            🛒 Cart
            {cartCount > 0 && <span className="shop-cart-count">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* Banner */}
      <div className="shop-banner">
        <div>
          <div className="shop-banner-badge">🔥 Spring Sale — up to 15% off</div>
          <h1>Next-Level Tech<br />Delivered Fast</h1>
          <p>Shop the latest Apple products with free shipping on orders over $99 and 30-day returns.</p>
          <button className="shop-banner-btn">Shop Now →</button>
        </div>
        <div className="shop-banner-emoji">💻</div>
      </div>

      {/* Main */}
      <div className="shop-main">
        {/* Sidebar */}
        <div className="shop-sidebar">
          <h4>Category</h4>
          {["All", "Mac", "iPhone", "iPad", "Audio", "Watch"].map((f) => (
            <div
              key={f}
              className={`shop-filter-item ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              <div className="shop-filter-dot" />
              {f}
            </div>
          ))}

          <h4 style={{ marginTop: 24 }}>Price Range</h4>
          {["Under $500", "$500–$1,000", "Over $1,000"].map((r) => (
            <div key={r} className="shop-filter-item">
              <div className="shop-filter-dot" />
              {r}
            </div>
          ))}
        </div>

        {/* Products */}
        <div className="shop-products-area">
          <div className="shop-products-header">
            <h3>All Products</h3>
            <span>{PRODUCTS.length} items</span>
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
                        borderRadius: 20, background: p.badge === "New" ? "#2563eb" :
                          p.badge === "Sale" ? "#ef4444" : "#f59e0b",
                        color: "white"
                      }}>{p.badge}</span>
                    )}
                    {p.emoji}
                  </div>
                  <div className="shop-product-info">
                    <div className="shop-product-name">{p.name}</div>
                    <div className="shop-product-specs">{p.specs}</div>
                    <div className="shop-product-bottom">
                      <div className="shop-product-price">${p.price.toLocaleString()}</div>
                      <button
                        className={`shop-add-btn ${inCart ? "added" : ""}`}
                        onClick={() => addToCart(p)}
                      >
                        {inCart ? "✓ Added" : "+ Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Drawer */}
        <div className="shop-cart-drawer">
          <div className="shop-cart-header">
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </div>
          <div className="shop-cart-items">
            {cart.length === 0 ? (
              <div className="shop-cart-empty">
                <div style={{ fontSize: 36, marginBottom: 10 }}>🛒</div>
                Your cart is empty.<br />Add some products!
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
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <button className="shop-checkout-btn">Checkout →</button>
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
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Follow up with Bob Martinez",  done: false, priority: "high" },
    { id: 2, text: "Prepare Q2 report",            done: true,  priority: "mid"  },
    { id: 3, text: "Send proposal to TechCorp",    done: false, priority: "high" },
    { id: 4, text: "Update pipeline forecasts",    done: false, priority: "mid"  },
    { id: 5, text: "Review new lead — David Lee",  done: true,  priority: "low"  },
  ]);

  const toggleTask = (id) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));

  const navItems = [
    { key: "dashboard", icon: "📊", label: "Dashboard"  },
    { key: "contacts",  icon: "👥", label: "Contacts"   },
    { key: "pipeline",  icon: "📋", label: "Pipeline"   },
  ];

  return (
    <div className="crm-site">
      {/* Top bar */}
      <div className="crm-topbar">
        <div className="crm-logo">⚡ KatoFlow CRM</div>
        <div className="crm-topbar-right">
          <span>🔔</span>
          <span>⚙️</span>
          <div className="crm-user-badge">A</div>
          <span>Admin</span>
        </div>
      </div>

      <div className="crm-layout">
        {/* Sidebar */}
        <div className="crm-sidebar">
          {navItems.map((n) => (
            <div
              key={n.key}
              className={`crm-nav-item ${page === n.key ? "active" : ""}`}
              onClick={() => setPage(n.key)}
            >
              <span className="crm-nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="crm-main">

          {/* ── DASHBOARD ── */}
          {page === "dashboard" && (
            <>
              <div className="crm-page-title">Dashboard</div>

              <div className="crm-stats-grid">
                <div className="crm-stat-card">
                  <div className="crm-stat-icon">👥</div>
                  <div className="crm-stat-value">142</div>
                  <div className="crm-stat-label">Total Contacts</div>
                  <div className="crm-stat-delta">↑ 8 this month</div>
                </div>
                <div className="crm-stat-card">
                  <div className="crm-stat-icon">📋</div>
                  <div className="crm-stat-value">37</div>
                  <div className="crm-stat-label">Active Deals</div>
                  <div className="crm-stat-delta">↑ 5 this week</div>
                </div>
                <div className="crm-stat-card">
                  <div className="crm-stat-icon">💰</div>
                  <div className="crm-stat-value">$284K</div>
                  <div className="crm-stat-label">Pipeline Value</div>
                  <div className="crm-stat-delta">↑ 12% vs last mo</div>
                </div>
                <div className="crm-stat-card">
                  <div className="crm-stat-icon">✅</div>
                  <div className="crm-stat-value">68%</div>
                  <div className="crm-stat-label">Win Rate</div>
                  <div className="crm-stat-delta">↑ 3% vs last mo</div>
                </div>
              </div>

              <div className="crm-two-col">
                {/* Recent activity */}
                <div className="crm-widget">
                  <div className="crm-widget-title">Recent Activity</div>
                  {[
                    { text: "Bob Martinez moved to In Progress",       time: "2 min ago"  },
                    { text: "New contact added — David Lee",           time: "1 hour ago" },
                    { text: "Carol Smith deal closed — $22,000",       time: "3 hours ago"},
                    { text: "Proposal sent to Alice Johnson",          time: "Yesterday"  },
                    { text: "Follow-up scheduled with Emma Davis",     time: "Yesterday"  },
                  ].map((a, i) => (
                    <div className="crm-activity-item" key={i}>
                      <div className="crm-act-dot" />
                      <div>
                        <div className="crm-act-text">{a.text}</div>
                        <div className="crm-act-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tasks */}
                <div className="crm-widget">
                  <div className="crm-widget-title">My Tasks</div>
                  {tasks.map((t) => (
                    <div className="crm-task-item" key={t.id}>
                      <div
                        className={`crm-task-check ${t.done ? "done" : ""}`}
                        onClick={() => toggleTask(t.id)}
                      >
                        {t.done ? "✓" : ""}
                      </div>
                      <span className={`crm-task-text ${t.done ? "done" : ""}`}>{t.text}</span>
                      <span className={`crm-task-badge ${t.priority === "high" ? "high" : t.priority === "mid" ? "mid" : "low"}`}>
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── CONTACTS ── */}
          {page === "contacts" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div className="crm-page-title" style={{ margin: 0 }}>Contacts</div>
                <button style={{ padding: "9px 20px", background: "linear-gradient(90deg,#f59e0b,#f97316)", border: "none", borderRadius: 8, color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  + Add Contact
                </button>
              </div>
              <div className="crm-table-wrapper">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Deal Value</th>
                      <th>Last Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONTACTS.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="crm-contact-name">{c.name}</div>
                          <div className="crm-contact-company">{c.company}</div>
                        </td>
                        <td>
                          <span className={`crm-status-badge ${c.status}`}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{c.value}</td>
                        <td style={{ color: "#94a3b8" }}>{c.last}</td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="crm-action-btn">View</button>
                          <button className="crm-action-btn">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── PIPELINE ── */}
          {page === "pipeline" && (
            <>
              <div className="crm-page-title">Sales Pipeline</div>
              <div className="crm-pipeline-grid">
                {Object.entries(PIPELINE).map(([stage, deals]) => (
                  <div className="crm-pipeline-col" key={stage}>
                    <div className="crm-pipeline-header">
                      <span>{stage}</span>
                      <span className="crm-pipeline-count">{deals.length}</span>
                    </div>
                    <div className="crm-pipeline-cards">
                      {deals.map((d, i) => (
                        <div className="crm-deal-card" key={i}>
                          <div className="crm-deal-name">{d.name}</div>
                          <div className="crm-deal-company">{d.company}</div>
                          <div className="crm-deal-footer">
                            <div className="crm-deal-value">{d.value}</div>
                            <span className={`crm-deal-tag ${d.tag}`}>{d.tag}</span>
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
              <div className="port-modal-inner" data-lenis-prevent>
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
