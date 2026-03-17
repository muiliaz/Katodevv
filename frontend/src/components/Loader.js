import { useEffect, useState } from "react";
import "./Loader.css";

function Loader({ onDone }) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setHiding(true), 1600);
    const doneTimer = setTimeout(() => onDone(),       2100);
    return () => { clearTimeout(hideTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`loader-overlay ${hiding ? "hide" : ""}`}>
      <div className="loader-content">
        <div className="loader-orb" />
        <div className="loader-logo">
          <img src="/logo-kd.png" alt="Kato Devv" className="loader-logo-img" />
        </div>
        <div className="loader-bar-wrap">
          <div className="loader-bar-fill" />
        </div>
      </div>
    </div>
  );
}

export default Loader;
