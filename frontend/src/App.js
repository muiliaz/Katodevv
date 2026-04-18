import { useState, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LangProvider } from "./LangContext";
import Cursor       from "./components/Cursor";
import Loader       from "./components/Loader";
import Navbar       from "./components/Navbar";
import Hero         from "./components/Hero";
import StarField     from "./components/StarField";
import BlackHole    from "./components/BlackHole/BlackHole";
import ScrollJourney from "./components/ScrollJourney/ScrollJourney";
import Services     from "./components/Services";
import Portfolio    from "./components/Portfolio";
import About        from "./components/About";
import Contact      from "./components/Contact";
import Footer       from "./components/Footer";
import "./App.css";

gsap.registerPlugin(ScrollTrigger);

function AppInner() {
  const [loaded, setLoaded] = useState(false);

  /* ── Safari detection — adds class for CSS fallbacks ── */
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) document.documentElement.classList.add('is-safari');
  }, []);

  /* ── Lenis smooth scroll, driven by GSAP ticker for ScrollTrigger sync ── */
  useEffect(() => {
    const lenis = new Lenis({
      duration:    1.25,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;

    // GSAP ticker drives lenis — keeps ScrollTrigger scroll position in sync
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <>
      {!loaded && <Loader onDone={() => setLoaded(true)} />}
      <StarField />
      <BlackHole />
      <Cursor />
      <Navbar />

      {/* Scroll journey triggers (pure side-effect, renders nothing) */}
      <ScrollJourney />

      {/* ── JOURNEY: 300vh sticky Hero while BlackHole zooms ── */}
      <div id="journey-scroll" style={{ height: "300vh", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh" }}>
          <Hero />
        </div>
      </div>

      {/* ── CONTENT: sections revealed after journey ── */}
      <div
        id="content-sections"
        style={{ position: "relative" }}
      >
        <Services />
        <Portfolio />
        <About />
        <Contact />
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}

export default App;
