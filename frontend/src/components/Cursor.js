import { useEffect, useRef } from "react";
import "./Cursor.css";

function Cursor() {
  const ringRef  = useRef(null);
  const pos      = useRef({ x: -100, y: -100 });
  const ring     = useRef({ x: -100, y: -100 });
  const frameRef = useRef(null);
  const visible  = useRef(false);

  useEffect(() => {
    /* Don't render cursor on touch devices */
    if (window.matchMedia("(hover: none)").matches) return;

    function onMove(e) {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        ringRef.current?.classList.add("visible");
      }
    }

    function onLeave() {
      visible.current = false;
      ringRef.current?.classList.remove("visible");
    }

    function onDown() { ringRef.current?.classList.add("pressed"); }
    function onUp()   { ringRef.current?.classList.remove("pressed"); }

    /* Interactive elements enlarge ring */
    function onEnterEl() { ringRef.current?.classList.add("grow"); }
    function onLeaveEl() { ringRef.current?.classList.remove("grow"); }

    const interactives = document.querySelectorAll("button, a, [class*='card'], [class*='tab']");
    interactives.forEach(el => {
      el.addEventListener("mouseenter", onEnterEl);
      el.addEventListener("mouseleave", onLeaveEl);
    });

    window.addEventListener("mousemove",  onMove);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown",  onDown);
    window.addEventListener("mouseup",    onUp);

    /* Smooth ring follow */
    function animate() {
      ring.current.x += (pos.current.x - ring.current.x) * 0.1;
      ring.current.y += (pos.current.y - ring.current.y) * 0.1;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }
      frameRef.current = requestAnimationFrame(animate);
    }
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove",   onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown",   onDown);
      window.removeEventListener("mouseup",     onUp);
      interactives.forEach(el => {
        el.removeEventListener("mouseenter", onEnterEl);
        el.removeEventListener("mouseleave", onLeaveEl);
      });
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <div ref={ringRef} className="cursor-ring" />;
}

export default Cursor;
