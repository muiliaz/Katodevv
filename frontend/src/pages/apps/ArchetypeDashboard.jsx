/**
 * The finale — instead of leaving the phone showing the same build screen,
 * it swaps to a small mock dashboard matching the winning archetype, as if
 * the app you just spec'd out actually launched. Purely illustrative UI
 * (no real screenshots, same principle as the /bots case-visual motifs) —
 * kept in English since it's decorative chrome, not primary copy.
 */
function ArchetypeDashboard({ archetypeKey }) {
  switch (archetypeKey) {
    case "fintech":
      return (
        <div className="abg-dash abg-dash--fintech">
          <div className="dash-balance">
            <span className="dash-balance-label">BALANCE</span>
            <span className="dash-balance-value">$12,480</span>
          </div>
          <div className="dash-row"><span className="dash-row-icon">💳</span><span className="dash-row-label">Groceries</span><span className="dash-row-amt is-neg">-$42</span></div>
          <div className="dash-row"><span className="dash-row-icon">💼</span><span className="dash-row-label">Salary</span><span className="dash-row-amt is-pos">+$3,200</span></div>
          <div className="dash-row"><span className="dash-row-icon">☕</span><span className="dash-row-label">Coffee</span><span className="dash-row-amt is-neg">-$5</span></div>
        </div>
      );

    case "community":
      return (
        <div className="abg-dash abg-dash--community">
          <div className="dash-chat dash-chat--in">Hey, did you see this? 👀</div>
          <div className="dash-chat dash-chat--out">Yes! Looks great 🔥</div>
          <div className="dash-chat dash-chat--in">Let's ship it</div>
        </div>
      );

    case "ondemand":
      return (
        <div className="abg-dash abg-dash--ondemand">
          <div className="dash-map"><span className="dash-map-pin">📍</span></div>
          <div className="dash-eta-card">
            <span className="dash-eta-title">Arriving in</span>
            <span className="dash-eta-value">12 min</span>
          </div>
        </div>
      );

    case "marketplace":
      return (
        <div className="abg-dash abg-dash--marketplace">
          <div className="dash-products">
            <div className="dash-product"><span className="dash-product-tag">$29</span></div>
            <div className="dash-product"><span className="dash-product-tag">$54</span></div>
            <div className="dash-product"><span className="dash-product-tag">$18</span></div>
            <div className="dash-product"><span className="dash-product-tag">$76</span></div>
          </div>
        </div>
      );

    case "productivity":
      return (
        <div className="abg-dash abg-dash--productivity">
          <div className="dash-task"><span className="dash-check is-done" /><span>Ship the release</span></div>
          <div className="dash-task"><span className="dash-check" /><span>Review PRs</span></div>
          <div className="dash-task"><span className="dash-check is-done" /><span>Sync with team</span></div>
          <div className="dash-bars">
            <span style={{ height: "40%" }} /><span style={{ height: "72%" }} /><span style={{ height: "55%" }} /><span style={{ height: "88%" }} />
          </div>
        </div>
      );

    case "creator":
      return (
        <div className="abg-dash abg-dash--creator">
          <div className="dash-video-grid">
            <div className="dash-video">▶</div>
            <div className="dash-video">▶</div>
            <div className="dash-video">▶</div>
            <div className="dash-video">▶</div>
          </div>
        </div>
      );

    case "wellness":
      return (
        <div className="abg-dash abg-dash--wellness">
          <div className="dash-rings">
            <span className="dash-ring dash-ring--1" />
            <span className="dash-ring dash-ring--2" />
            <span className="dash-ring dash-ring--3" />
          </div>
          <div className="dash-stat">7,842 steps today</div>
        </div>
      );

    case "enterprise":
      return (
        <div className="abg-dash abg-dash--enterprise">
          <div className="dash-table-header"><span>Project</span><span>Status</span></div>
          <div className="dash-table-row"><span>Alpha</span><span className="dash-badge">Active</span></div>
          <div className="dash-table-row"><span>Beta</span><span className="dash-badge is-done">Done</span></div>
          <div className="dash-table-row"><span>Gamma</span><span className="dash-badge">Active</span></div>
        </div>
      );

    default:
      return null;
  }
}

export default ArchetypeDashboard;
