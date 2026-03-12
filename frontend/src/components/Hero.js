import { useEffect, useState, useRef } from "react";
import { useLang } from "../LangContext";
import "./Hero.css";

const STATS_TARGETS = [50, 30, 3];
const STATS_SUFFIXES = ["+", "+", "+"];

/* ── 4 icon columns — real devicon logos ── */
const COL_LEFT_1 = [
  { icon: "devicon-react-original colored",           name: "React"      },
  { icon: "devicon-nodejs-plain colored",             name: "Node.js"    },
  { icon: "devicon-python-plain colored",             name: "Python"     },
  { icon: "devicon-typescript-plain colored",         name: "TypeScript" },
  { icon: "devicon-mongodb-plain colored",            name: "MongoDB"    },
  { icon: "devicon-postgresql-plain colored",         name: "PostgreSQL" },
  { icon: "devicon-firebase-plain colored",           name: "Firebase"   },
  { icon: "devicon-amazonwebservices-plain-wordmark colored", name: "AWS" },
];

const COL_LEFT_2 = [
  { icon: "devicon-nextjs-plain",                     name: "Next.js"    },
  { icon: "devicon-django-plain colored",             name: "Django"     },
  { icon: "devicon-fastapi-plain colored",            name: "FastAPI"    },
  { icon: "devicon-docker-plain colored",             name: "Docker"     },
  { icon: "devicon-redis-plain colored",              name: "Redis"      },
  { icon: "devicon-graphql-plain colored",            name: "GraphQL"    },
  { icon: "devicon-nginx-plain colored",              name: "Nginx"      },
  { icon: "devicon-kubernetes-plain colored",         name: "Kubernetes" },
];

const COL_RIGHT_1 = [
  { icon: "devicon-react-original colored",           name: "React Native" },
  { icon: "devicon-flutter-plain colored",            name: "Flutter"      },
  { icon: "devicon-swift-plain colored",              name: "Swift"        },
  { icon: "devicon-kotlin-plain colored",             name: "Kotlin"       },
  { icon: "devicon-figma-plain colored",              name: "Figma"        },
  { icon: "devicon-xd-plain colored",                 name: "Adobe XD"     },
  { icon: "devicon-photoshop-plain colored",          name: "Photoshop"    },
  { icon: "devicon-illustrator-plain colored",        name: "Illustrator"  },
];

const COL_RIGHT_2 = [
  { icon: "devicon-github-original colored",          name: "GitHub"   },
  { icon: "devicon-git-plain colored",                name: "Git"      },
  { icon: "devicon-jira-plain colored",               name: "Jira"     },
  { icon: "devicon-trello-plain colored",             name: "Trello"   },
  { icon: "devicon-vscode-plain colored",             name: "VS Code"  },
  { icon: "devicon-jenkins-plain colored",            name: "Jenkins"  },
  { icon: "devicon-mysql-plain colored",              name: "MySQL"    },
  { icon: "devicon-linux-plain colored",              name: "Linux"    },
];

function doubleList(arr) {
  return [...arr, ...arr];
}

function IconColumn({ items, direction }) {
  const doubled = doubleList(items);
  return (
    <div className={`icon-col ${direction}`}>
      <div className="icon-col-inner">
        {doubled.map((item, i) => (
          <div className="tech-icon-card" key={i}>
            <i className={`${item.icon} tech-icon-img`} />
            <span className="tech-icon-name">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useLang();
  const h = t.hero;

  const [wordIdx, setWordIdx] = useState(0);
  const [wordKey, setWordKey] = useState(0);
  const [counts, setCounts]   = useState(STATS_TARGETS.map(() => 0));
  const started               = useRef(false);

  useEffect(() => {
    setWordIdx(0);
    setWordKey((k) => k + 1);
  }, [h.cycleWords]);

  useEffect(() => {
    const t = setInterval(() => {
      setWordIdx((i) => (i + 1) % h.cycleWords.length);
      setWordKey((k) => k + 1);
    }, 2600);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h.cycleWords]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    STATS_TARGETS.forEach((target, i) => {
      let cur = 0;
      const step = target / 55;
      const timer = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(timer); }
        setCounts((prev) => { const n = [...prev]; n[i] = Math.round(cur); return n; });
      }, 22);
    });
  }, []);

  return (
    <section className="hero">
      <div className="hero-blob hero-blob-1" />
      <div className="hero-blob hero-blob-2" />

      <div className="hero-row">
        {/* LEFT columns */}
        <div className="hero-icons-side">
          <IconColumn items={COL_LEFT_1} direction="up"   />
          <IconColumn items={COL_LEFT_2} direction="down" />
        </div>

        {/* CENTER */}
        <div className="hero-center">
          <div className="hero-orb-wrap">
            <div className="hero-orb" />
            <div className="hero-orb-text">
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                {h.available}
              </div>
              <h1>Kato Devv</h1>
            </div>
          </div>

          <p className="hero-subtitle">
            {h.subtitlePre}{" "}
            <span key={wordKey} className="hero-cycle-word">
              {h.cycleWords[wordIdx]}
            </span>{" "}
            {h.subtitlePost}
          </p>

          <div className="hero-stats">
            {STATS_TARGETS.map((_, i) => (
              <div className="hero-stat-item" key={i}>
                <div className="hero-stat-num">{counts[i]}{STATS_SUFFIXES[i]}</div>
                <div className="hero-stat-label">{h.stats[i]}</div>
              </div>
            ))}
          </div>

          <div className="hero-buttons">
            <button className="primary" onClick={() => document.querySelector('.contact')?.scrollIntoView({ behavior: 'smooth' })}>
              {h.startProject}
            </button>
            <button className="secondary" onClick={() => document.querySelector('.services')?.scrollIntoView({ behavior: 'smooth' })}>
              {h.ourServices}
            </button>
          </div>
        </div>

        {/* RIGHT columns */}
        <div className="hero-icons-side">
          <IconColumn items={COL_RIGHT_1} direction="down2" />
          <IconColumn items={COL_RIGHT_2} direction="up2"   />
        </div>
      </div>

      <div className="hero-scroll">
        <div className="hero-scroll-line" />
        {h.scroll}
      </div>
    </section>
  );
}

export default Hero;
