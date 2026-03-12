import { useLang } from "../LangContext";
import "./Footer.css";

function Footer() {
  const { t } = useLang();
  const f = t.footer;

  function scrollTo(selector) {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="footer-inner">

        {/* Brand col */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-dot" />
            Kato Devv
          </div>
          <p className="footer-tagline">{f.tagline}</p>
          <div className="footer-social">
            <a href="https://t.me/katodevv" target="_blank" rel="noreferrer" className="fsocial-btn tg" aria-label="Telegram">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.086l-2.95-.924c-.64-.203-.654-.64.136-.949l11.52-4.443c.535-.194 1.004.131.686.478z"/>
              </svg>
            </a>
            <a href="mailto:katodevv@proton.me" className="fsocial-btn email" aria-label="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Nav col */}
        <div className="footer-col">
          <div className="footer-col-title">Navigation</div>
          <button onClick={() => scrollTo(".services")}>{f.nav.services}</button>
          <button onClick={() => scrollTo(".portfolio")}>{f.nav.portfolio}</button>
          <button onClick={() => scrollTo(".about")}>{f.nav.about}</button>
          <button onClick={() => scrollTo(".contact")}>{f.nav.contact}</button>
        </div>

        {/* Contact col */}
        <div className="footer-col">
          <div className="footer-col-title">Contact</div>
          <a href="https://t.me/katodevv" target="_blank" rel="noreferrer">@katodevv</a>
          <a href="mailto:katodevv@proton.me">katodevv@proton.me</a>
          <span>Bishkek, Kyrgyzstan</span>
          <span>Mon–Fri · 9:00–18:00</span>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span>Kato Devv © {new Date().getFullYear()}. {f.rights}</span>
        <span className="footer-made">Made with ❤️ in Kyrgyzstan</span>
      </div>
    </footer>
  );
}

export default Footer;
