// The "Bots / AI Bots" example: a chat that replays a scripted conversation.
import { useEffect, useRef, useState } from "react";
import { useLang } from "../../../shared/LangContext";
import "../Services.css";

function BotExample() {
  const { t } = useLang();
  const st = t.services;
  const [shown, setShown]   = useState([]);
  const [typing, setTyping] = useState(false);
  const msgRef              = useRef(null);

  useEffect(() => {
    const timers = [];
    let cum = 0;
    st.botScript.forEach((msg, i) => {
      cum += msg.delay;
      if (msg.sender === "bot" && i > 0) {
        timers.push(setTimeout(() => setTyping(true), cum - 700));
      }
      timers.push(setTimeout(() => {
        setTyping(false);
        setShown(prev => [...prev, msg]);
      }, cum));
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [shown, typing]);

  return (
    <div className="chat-demo-light">
      <div className="chat-header-light">
        <div className="chat-avatar-light">🤖</div>
        <div className="chat-header-info-light">
          <div className="chat-name-light">{st.botName}</div>
          <div className="chat-online-light">{st.botOnline}</div>
        </div>
        <div className="chat-header-badge">{st.botBadge}</div>
      </div>
      <div className="chat-msgs-light" ref={msgRef}>
        {shown.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.sender}`}>{m.text}</div>
        ))}
        {typing && (
          <div className="chat-bubble bot typing">
            <span /><span /><span />
          </div>
        )}
      </div>
      <div className="chat-input-light">
        <div className="chat-input-field">{st.chatPlaceholder}</div>
        <div className="chat-send-light">➤</div>
      </div>
    </div>
  );
}
export default BotExample;
