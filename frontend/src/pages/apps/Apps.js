import { Link } from "react-router-dom";
import { useLang } from "../../shared/LangContext";
import ChatWidget from "../../shared/ChatWidget/ChatWidget";
import AppBuilderGame from "./AppBuilderGame";
import "./Apps.css";

function Apps() {
  const { lang, setLang, t } = useLang();
  const a = t.apps;

  return (
    <div className="apps-page">
      <div className="apps-aurora" />
      <div className="apps-grid" />
      <div className="apps-vignette" />

      <header className="apps-header">
        <Link to="/" className="apps-back">
          <span className="apps-back-arrow">←</span> KATO DEVV
        </Link>
        <div className="apps-eyebrow">{a.eyebrow}</div>
        <div className="apps-lang">
          <button className={`apps-lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>ENG</button>
          <span className="apps-lang-sep" />
          <button className={`apps-lang-btn ${lang === "ru" ? "active" : ""}`} onClick={() => setLang("ru")}>RU</button>
        </div>
      </header>

      <main className="apps-hero">
        <h1 className="apps-headline">{a.headline}</h1>
        <p className="apps-subtitle">{a.subtitle}</p>
      </main>

      <AppBuilderGame />

      <footer className="apps-footer">© {new Date().getFullYear()} Kato Devv</footer>
      <ChatWidget />
    </div>
  );
}

export default Apps;
