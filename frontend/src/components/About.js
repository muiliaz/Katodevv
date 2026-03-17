import { useEffect, useRef } from "react";
import { useLang, TEAM } from "../LangContext";
import "./About.css";


function About() {
  const { t } = useLang();
  const a       = t.about;
  const sectionRef = useRef(null);

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


  return (
    <section className="about" ref={sectionRef}>
      <div className="about-blob about-blob-1" />
      <div className="about-blob about-blob-2" />

      <div className="about-container">

        {/* Header */}
        <div className="abt-header abt-fade">
          <div className="abt-tag-pill">{t.demos.about.tagPill}</div>
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

        {/* Team overview card */}
        <div className="abt-team-overview abt-fade">
          <div className="abt-team-overview-top">
            <div className="abt-team-avatars">
              {TEAM.map((m) => (
                <div className="abt-team-avatar-circle" key={m.name}>{m.emoji}</div>
              ))}
            </div>
            <div className="abt-team-overview-count">{t.demos.about.teamCount}</div>
            <div className="abt-team-overview-sub">{t.demos.about.teamSub}</div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default About;
