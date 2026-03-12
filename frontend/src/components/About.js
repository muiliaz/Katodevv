import { useEffect, useRef } from "react";
import { useLang, TEAM } from "../LangContext";
import "./About.css";

const SKILL_COLORS = {
  "System Design":   "#6366f1",
  "React":           "#61dafb",
  "Node.js":         "#68a063",
  "AWS":             "#f59e0b",
  "Python":          "#3b82f6",
  "Microservices":   "#8b5cf6",
  "React Native":    "#61dafb",
  "Flutter":         "#0ea5e9",
  "TypeScript":      "#3178c6",
  "GraphQL":         "#e535ab",
  "PostgreSQL":      "#336791",
  "Figma":           "#f24e1e",
  "Adobe XD":        "#ff61f6",
  "Prototyping":     "#a78bfa",
  "Branding":        "#f97316",
  "Testing":         "#22c55e",
  "Docker":          "#0ea5e9",
  "CI/CD":           "#ef4444",
  "Linux":           "#eab308",
  "Scrum":           "#6366f1",
  "Jira":            "#2684ff",
  "Client Relations":"#22c55e",
  "Planning":        "#8b5cf6",
};

function About() {
  const { lang, t } = useLang();
  const a           = t.about;
  const isRu        = lang === "ru";
  const sectionRef  = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("abt-visible");
        });
      },
      { threshold: 0.1 }
    );
    const els = sectionRef.current?.querySelectorAll(".abt-fade");
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const seniors = TEAM.filter((m) => m.level === "lead" || m.level === "senior");
  const staff   = TEAM.filter((m) => m.level === "mid");

  function role(m)  { return isRu ? m.roleRu  : m.roleEn; }
  function tag(m)   { return isRu ? m.tagRu   : m.tagEn; }
  function exp(m)   { return isRu ? m.expRu   : m.expEn; }

  return (
    <section className="about" ref={sectionRef}>
      <div className="about-blob about-blob-1" />
      <div className="about-blob about-blob-2" />

      <div className="about-container">

        {/* Header */}
        <div className="abt-header abt-fade">
          <div className="abt-tag-pill">who we are</div>
          <h2>{a.sectionTitle}</h2>
          <p className="abt-subtitle">{a.subtitle}</p>
        </div>

        {/* Stats row */}
        <div className="abt-stats abt-fade">
          {a.statsRow.map((s, i) => (
            <div className="abt-stat" key={i}>
              <div className="abt-stat-value">{s.value}</div>
              <div className="abt-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="abt-mission abt-fade">
          <div className="abt-mission-icon">🎯</div>
          <div>
            <div className="abt-mission-title">{a.missionTitle}</div>
            <p className="abt-mission-text">{a.mission}</p>
          </div>
        </div>

        {/* Team title */}
        <div className="abt-team-title abt-fade">{a.teamTitle}</div>

        {/* Senior engineers — large featured cards */}
        <div className="abt-seniors abt-fade">
          {seniors.map((m) => (
            <div className={`abt-senior-card ${m.level}`} key={m.name}>
              {m.level === "lead" && (
                <div className="abt-crown-badge">⭐ {a.levelLabel.lead}</div>
              )}
              {m.level === "senior" && (
                <div className="abt-level-pill senior">{a.levelLabel.senior}</div>
              )}

              <div className="abt-card-top">
                <div className={`abt-avatar ${m.level}`}>{m.emoji}</div>
                <div className="abt-card-info">
                  <div className="abt-name">{m.name}</div>
                  <div className="abt-role">{role(m)}</div>
                  {tag(m) && (
                    <div className={`abt-special-tag ${m.level}`}>{tag(m)}</div>
                  )}
                  <div className="abt-exp">🕐 {exp(m)} {a.expLabel}</div>
                </div>
              </div>

              <div className="abt-skills">
                {m.skills.map((skill) => (
                  <span
                    key={skill}
                    className="abt-skill"
                    style={{ borderColor: (SKILL_COLORS[skill] || "#6366f1") + "55", color: SKILL_COLORS[skill] || "#a78bfa" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Staff cards — smaller */}
        <div className="abt-staff abt-fade">
          {staff.map((m) => (
            <div className="abt-staff-card" key={m.name}>
              <div className="abt-staff-avatar">{m.emoji}</div>
              <div className="abt-staff-name">{m.name}</div>
              <div className="abt-staff-role">{role(m)}</div>
              <div className="abt-staff-exp">{exp(m)} {a.expLabel}</div>
              <div className="abt-skills abt-skills-sm">
                {m.skills.map((skill) => (
                  <span
                    key={skill}
                    className="abt-skill sm"
                    style={{ borderColor: (SKILL_COLORS[skill] || "#6366f1") + "44", color: (SKILL_COLORS[skill] || "#a78bfa") + "bb" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default About;
