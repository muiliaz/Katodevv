import { useState, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Cursor       from "./Cursor";
import Loader       from "./Loader";
import Navbar       from "./Navbar";
import Hero         from "./Hero";
import StarField     from "./StarField";
import BlackHole    from "./BlackHole/BlackHole";
import ScrollJourney from "./ScrollJourney/ScrollJourney";
import Services     from "./Services";
import About        from "./About";
import Contact      from "./Contact";
import Footer       from "./Footer";
import ChatWidget   from "../../shared/ChatWidget/ChatWidget";

gsap.registerPlugin(ScrollTrigger);

/**
 * WebDev — the original kato-devv site (BlackHole hero + scroll journey),
 * now scoped to the /web vertical. Unchanged from the previous single-page App.
 */
function WebDev() {
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
        <About />
        <Contact />
        <Footer />
      </div>

      <ChatWidget />
    </>
  );
}

export default WebDev;
