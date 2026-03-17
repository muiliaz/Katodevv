import { useState, useEffect } from "react";
import Lenis from "lenis";
import { LangProvider } from "./LangContext";
import Cursor    from "./components/Cursor";
import Loader    from "./components/Loader";
import Navbar    from "./components/Navbar";
import Hero      from "./components/Hero";
import Services  from "./components/Services";
import Portfolio from "./components/Portfolio";
import About     from "./components/About";
import Contact   from "./components/Contact";
import Footer    from "./components/Footer";
import "./App.css";

function AppInner() {
  const [loaded, setLoaded] = useState(false);

  /* Lenis smooth scroll */
  useEffect(() => {
    const lenis = new Lenis({
      duration:    1.25,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => { lenis.destroy(); window.__lenis = null; };
  }, []);

  return (
    <>
      {!loaded && <Loader onDone={() => setLoaded(true)} />}
      <Cursor />
      <Navbar />
      <Hero />
      <Services />
      <Portfolio />
      <About />
      <Contact />
      <Footer />
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
