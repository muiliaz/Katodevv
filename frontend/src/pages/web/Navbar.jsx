import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useLang } from "../../shared/LangContext";
import "./Navbar.css";

function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Entrance: navbar slides down after loader cascade (1.9s from mount)
  useEffect(() => {
    gsap.fromTo('.navbar',
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 1.9, clearProps: 'transform' }
    )
  }, [])

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
        {/* Logo — back to the Hub, not just scroll-to-top */}
        <Link to="/" className="navbar-logo">
          <img src="/logo-kd.png" alt="Kato Devv" className="navbar-logo-img" />
        </Link>

        {/* Desktop links */}
        <nav className="navbar-links">
          <button onClick={() => scrollTo(".services")}>{nav.services}</button>
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
          <button onClick={() => scrollTo(".about")}>{nav.about}</button>
          <button onClick={() => scrollTo(".contact")}>{nav.contact}</button>
          <button className="mobile-cta" onClick={() => scrollTo(".contact")}>{nav.cta}</button>
        </div>
      )}
    </header>
  );
}

export default Navbar;
