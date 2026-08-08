// The "Mobile Apps" example: two phone mockups behind a platform switch —
// an iOS finance app and an Android delivery app.
import { useState } from "react";
import { useLang } from "../../../shared/LangContext";
import "../Services.css";

function MobileExample() {
  const { t } = useLang();
  const d = t.demos.mobile;
  const [platform, setPlatform] = useState("ios");

  return (
    <div className="mobile-demo-wrap">
      <div className="platform-tabs">
        <button className={`platform-tab ${platform === "ios" ? "active" : ""}`} onClick={() => setPlatform("ios")}>
          {d.tabs[0]}
        </button>
        <button className={`platform-tab ${platform === "android" ? "active" : ""}`} onClick={() => setPlatform("android")}>
          {d.tabs[1]}
        </button>
      </div>

      <div className="phone-demo">
        {platform === "ios" ? (
          <div className="phone-frame phone-ios17">
            <div className="ios17-bar">
              <span className="ios-time">9:41</span>
              <div className="ios17-island" />
              <div className="ios-status"></div>
            </div>
            <div className="ios17-screen">
              <div className="ios-app-inner">
                <div className="ios-app-title">{d.financeTitle}</div>
                <div className="ios-balance-card">
                  <div className="ios-balance-label">{d.balanceLabel}</div>
                  <div className="ios-balance-amount">$12,450.00</div>
                  <div className="ios-balance-change">{d.balanceChange}</div>
                </div>
                <div className="ios-actions">
                  {d.actions.map(a => (
                    <div className="ios-action" key={a}>
                      <span className="ios-action-icon">{a.split(" ")[0]}</span>
                      <span className="ios-action-label">{a.split(" ").slice(1).join(" ")}</span>
                    </div>
                  ))}
                </div>
                <div className="ios-section-title">{d.txTitle}</div>
                {d.txItems.map(tx => (
                  <div className="ios-tx" key={tx.name}>
                    <div className="ios-tx-icon">{tx.icon}</div>
                    <div className="ios-tx-name">{tx.name}</div>
                    <div className={`ios-tx-amt ${tx.neg ? "neg" : "pos"}`}>{tx.amt}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ios-home-bar" />
          </div>
        ) : (
          <div className="phone-frame phone-s26">
            <div className="s26-bar">
              <span className="android-time">09:41</span>
              <div className="s26-camera" />
              <div className="android-status"></div>
            </div>
            <div className="s26-screen">
              <div className="android-app-inner">
                <div className="android-header">
                  <div className="android-greeting">{d.greeting}</div>
                  <div className="android-user">Alex</div>
                  <div className="android-delivery-card">
                    <div className="android-delivery-badge">{d.deliveryBadge}</div>
                    <div className="android-delivery-title">{d.deliveryTitle}</div>
                    <div className="android-delivery-eta">{d.deliveryEta}</div>
                    <div className="android-progress-bar"><div className="android-progress-fill" /></div>
                  </div>
                </div>
                <div className="android-cats">
                  {d.cats.map(c => (
                    <div className="android-cat" key={c}>{c}</div>
                  ))}
                </div>
                <div className="android-section-title">{d.popularTitle}</div>
                <div className="android-restaurants">
                  {[
                    { icon:"🍕", name:"Napoli Pizza", rating:"4.8", time:"20 min" },
                    { icon:"🍣", name:"Tokyo Rolls",  rating:"4.9", time:"30 min" },
                  ].map(r => (
                    <div className="android-rest" key={r.name}>
                      <div className="android-rest-icon">{r.icon}</div>
                      <div className="android-rest-info">
                        <div className="android-rest-name">{r.name}</div>
                        <div className="android-rest-meta">⭐{r.rating} · {r.time}</div>
                      </div>
                      <div className="android-rest-order">{d.orderBtn}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="android-nav-bar">
              <span>🏠</span><span>🔍</span><span>📦</span><span>👤</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default MobileExample;
