// The "Web Development" example: a browser chrome around a fake landing page.
//
// Every string on the mockup comes from the dictionary, so the demo reads in
// the language the visitor picked. `t.demos.web.navLinks` includes the word
// "Portfolio" — that is layout copy inside this mockup, not a route. Grepping
// for "Portfolio" and deleting what turns up removes a line from this page.
import { useLang } from "../../../shared/LangContext";
import "../Services.css";

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
export default WebDevExample;
