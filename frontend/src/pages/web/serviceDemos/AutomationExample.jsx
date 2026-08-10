// The "Automation" example: an n8n-style workflow that lights up node by node.
import { Fragment, useEffect, useState } from "react";
import { useLang } from "../../../shared/LangContext";
import "../Services.css";

const N8N_NODES = [
  { icon: "🔗", label: "Webhook", desc: "Trigger", color: "#ff6b35" },
  { icon: "🔀", label: "IF Condition", desc: "Filter", color: "#6366f1" },
  { icon: "🌐", label: "HTTP Request", desc: "Fetch API", color: "#0ea5e9" },
  { icon: "⚙️", label: "Set Data", desc: "Transform", color: "#8b5cf6" },
  { icon: "📧", label: "Gmail", desc: "Send Email", color: "#ef4444" },
  { icon: "💬", label: "Slack", desc: "Notify", color: "#22c55e" },
];

function AutomationExample() {
  const { t } = useLang();
  const [litIdx, setLitIdx] = useState(-1);

  useEffect(() => {
    const timers = N8N_NODES.map((_, i) => setTimeout(() => setLitIdx(i), 600 + i * 900));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="auto-demo">
      <div className="auto-stats">
        {t.services.autoStats.map((s) => (
          <div className="auto-stat" key={s.label}>
            <div className="auto-stat-value" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="auto-stat-label">{s.label}</div>
            <div className="auto-stat-delta">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="n8n-section-title">
        <span className="n8n-logo">n8n</span> Automation Workflow
        {litIdx < N8N_NODES.length - 1 ? (
          <span className="n8n-status running">{t.services.n8nRunning}</span>
        ) : (
          <span className="n8n-status done">{t.services.n8nCompleted}</span>
        )}
      </div>
      <div className="n8n-flow">
        {N8N_NODES.map((node, i) => (
          <Fragment key={i}>
            <div
              className={`n8n-node ${litIdx === i ? "lit" : ""} ${litIdx > i ? "done" : ""}`}
              style={litIdx >= i ? { borderColor: node.color, background: node.color + "18" } : {}}
            >
              <div className="n8n-node-icon" style={litIdx >= i ? { color: node.color } : {}}>
                {node.icon}
              </div>
              <div className="n8n-node-label">{node.label}</div>
              <div className="n8n-node-desc">{node.desc}</div>
              {litIdx > i && (
                <div className="n8n-node-check" style={{ color: node.color }}>
                  ✓
                </div>
              )}
            </div>
            {i < N8N_NODES.length - 1 && (
              <div className={`n8n-connector ${litIdx > i ? "active" : ""}`}>
                <div className="n8n-line" />
                <div className="n8n-arrow-head" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
export default AutomationExample;
