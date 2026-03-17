import { useState, useRef } from "react";
import { useLang } from "../LangContext";
import "./Contact.css";

function Contact() {
  const { t } = useLang();
  const c = t.contact;
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const formRef               = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.target);
    try {
      const res = await fetch("/.netlify/functions/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:    fd.get("name"),
          email:   fd.get("email"),
          message: fd.get("message"),
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      formRef.current?.reset();
      setTimeout(() => setSent(false), 5000);
    } catch {
      setError(c.errorMsg || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="contact">
      {/* Background accents */}
      <div className="contact-blob contact-blob-1" />
      <div className="contact-blob contact-blob-2" />

      <div className="contact-container">

        {/* Header */}
        <div className="contact-header">
          <div className="contact-tag-pill">{t.demos.contact.tagPill}</div>
          <h2>{c.sectionTitle}</h2>
          <p className="contact-subtitle">{c.subtitle}</p>
        </div>

        <div className="contact-body">

          {/* Left — contact info */}
          <div className="contact-info">

            {/* Telegram */}
            <a
              href="https://t.me/katodevv"
              target="_blank"
              rel="noreferrer"
              className="contact-info-card telegram"
            >
              <div className="cic-icon tg-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.086l-2.95-.924c-.64-.203-.654-.64.136-.949l11.52-4.443c.535-.194 1.004.131.686.478z"/>
                </svg>
              </div>
              <div className="cic-body">
                <div className="cic-label">{c.telegramLabel}</div>
                <div className="cic-value">@katodevv</div>
              </div>
              <div className="cic-arrow">→</div>
            </a>

            {/* Email */}
            <a
              href="mailto:katodevv@proton.me"
              className="contact-info-card email"
            >
              <div className="cic-icon email-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div className="cic-body">
                <div className="cic-label">{c.emailLabel}</div>
                <div className="cic-value">katodevv@proton.me</div>
              </div>
              <div className="cic-arrow">→</div>
            </a>

            {/* Hours */}
            <div className="contact-info-card hours">
              <div className="cic-icon hours-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div className="cic-body">
                <div className="cic-label">{c.hoursLabel}</div>
                <div className="cic-value">{c.hoursValue}</div>
              </div>
            </div>

            {/* Location */}
            <div className="contact-info-card location">
              <div className="cic-icon loc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="cic-body">
                <div className="cic-label">{c.locationLabel}</div>
                <div className="cic-value">{c.locationValue}</div>
              </div>
            </div>

            {/* Decorative response-time badge */}
            <div className="contact-response-badge">
              <span className="contact-response-dot" />
              {t.demos.contact.responseTime}
            </div>
          </div>

          {/* Right — form */}
          <div className="contact-form-wrap">
            <div className="contact-form-title">{c.formTitle}</div>
            <form className="contact-form" onSubmit={handleSubmit} ref={formRef}>
              <div className="cform-row">
                <div className="cform-group">
                  <label>{c.name}</label>
                  <input type="text" name="name" placeholder={c.name} required />
                </div>
                <div className="cform-group">
                  <label>{c.email}</label>
                  <input type="email" name="email" placeholder={c.email} required />
                </div>
              </div>
              <div className="cform-group">
                <label>{c.message}</label>
                <textarea name="message" placeholder={c.message} rows={5} required />
              </div>
              {error && <div className="cform-error">{error}</div>}
              <button type="submit" className={`cform-btn ${sent ? "sent" : ""}`} disabled={loading}>
                {sent ? "✓ " + (c.sent || "Sent!") : loading ? "..." : c.send}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Contact;
