import { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import "./Navbar.css";

function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(selector) {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  const nav = t.navbar;

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="navbar-logo-dot" />
          Kato Devv
        </div>

        {/* Desktop links */}
        <nav className="navbar-links">
          <button onClick={() => scrollTo(".services")}>{nav.services}</button>
          <button onClick={() => scrollTo(".portfolio")}>{nav.portfolio}</button>
          <button onClick={() => scrollTo(".about")}>{nav.about}</button>
          <button onClick={() => scrollTo(".contact")}>{nav.contact}</button>
        </nav>

        {/* Right side: lang switcher + CTA */}
        <div className="navbar-right">
          <div className="navbar-lang">
            <button
              className={`nlang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => setLang("en")}
            >ENG</button>
            <span className="nlang-sep" />
            <button
              className={`nlang-btn ${lang === "ru" ? "active" : ""}`}
              onClick={() => setLang("ru")}
            >RU</button>
          </div>

          <button className="navbar-cta" onClick={() => scrollTo(".contact")}>
            {nav.cta}
          </button>

          {/* Burger */}
          <button
            className={`navbar-burger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <button onClick={() => scrollTo(".services")}>{nav.services}</button>
          <button onClick={() => scrollTo(".portfolio")}>{nav.portfolio}</button>
          <button onClick={() => scrollTo(".about")}>{nav.about}</button>
          <button onClick={() => scrollTo(".contact")}>{nav.contact}</button>
          <button className="mobile-cta" onClick={() => scrollTo(".contact")}>{nav.cta}</button>
        </div>
      )}
    </header>
  );
}

export default Navbar;
