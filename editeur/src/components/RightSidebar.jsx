// RightSidebar.jsx
// Panneau droit : Données capteurs | API REST | Infos composant sélectionné

import { useState } from "react";
import { componentsData } from "../data/componentsData";

// Barre de progression colorée selon seuils
function DataBar({ value, max, warnAt, dangerAt }) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    value >= dangerAt ? "#b52020" :
    value >= warnAt   ? "#c9a227" :
                        "#1e7a34";
  return (
    <div className="d-bar">
      <div className="d-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// Carte individuelle d'un capteur
function DataCard({ label, value, unit, max, warnAt, dangerAt }) {
  const color =
    value >= dangerAt ? "#b52020" :
    value >= warnAt   ? "#b8920a" :
                        "#1e7a34";
  return (
    <div className="data-card">
      <span className="d-label">{label}</span>
      <span className="d-value" style={{ color }}>
        {value}
        <span className="d-unit">{unit}</span>
      </span>
      <DataBar value={value} max={max} warnAt={warnAt} dangerAt={dangerAt} />
    </div>
  );
}

// ── Onglet Données ────────────────────────────────────────────────────────────
function TabDonnees({ sensorData, running }) {
  const d = sensorData;
  const alerts = [];
  if (d.co2   > 900)  alerts.push({ type: "danger", msg: `⚠️ CO₂ élevé : ${d.co2} ppm (seuil 900)` });
  if (d.smoke > 200)  alerts.push({ type: "danger", msg: `🔥 Fumée détectée : ${d.smoke} ppm` });
  if (d.temperature > 34) alerts.push({ type: "warn", msg: `🌡️ Température haute : ${d.temperature}°C` });
  if (d.humidity > 80)    alerts.push({ type: "warn", msg: `💧 Humidité élevée : ${d.humidity}%` });

  return (
    <>
      {/* Alertes */}
      {running && alerts.length > 0 ? (
        alerts.map((a, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 10px", borderRadius: 8, marginBottom: 6,
            fontSize: 11, fontWeight: 700,
            background: a.type === "danger" ? "#fdecec" : "#fff8dc",
            border: `1px solid ${a.type === "danger" ? "#ef9a9a" : "#e9ca62"}`,
            color: a.type === "danger" ? "#b52020" : "#8a6000",
          }}>
            {a.msg}
          </div>
        ))
      ) : running ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 8, marginBottom: 6,
          fontSize: 11, fontWeight: 700,
          background: "#e8f8ec", border: "1px solid #8bd69b", color: "#1e7a34",
        }}>
          ✅ Tous les paramètres sont normaux
        </div>
      ) : (
        <div style={{ color: "#aaa", fontSize: 11, marginBottom: 8, textAlign: "center" }}>
          Lancez la simulation pour voir les données en direct.
        </div>
      )}

      {/* Grille des mesures */}
      <div className="data-grid">
        <DataCard label="Température" value={d.temperature} unit=" °C"  max={60}   warnAt={30}  dangerAt={40} />
        <DataCard label="Humidité"    value={d.humidity}    unit=" %"   max={100}  warnAt={70}  dangerAt={85} />
        <DataCard label="CO₂"        value={d.co2}         unit=" ppm" max={2000} warnAt={600} dangerAt={900} />
        <DataCard label="Fumée"      value={d.smoke}       unit=" ppm" max={500}  warnAt={150} dangerAt={250} />
      </div>

      {/* Source + timestamp */}
      <div className="panel-section" style={{ marginTop: 8 }}>
        <h2>Source</h2>
        <div style={{ fontSize: 11, color: "#555" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#888" }}>Appareil</span>
            <strong>Raspberry Pi 5</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#888" }}>Statut</span>
            <strong style={{ color: d.status === "danger" ? "#b52020" : "#1e7a34" }}>
              {d.status === "danger" ? "🔴 Alerte" : "🟢 Normal"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>Horodatage</span>
            <span style={{ fontFamily: "monospace", fontSize: 10 }}>
              {new Date(d.timestamp).toLocaleTimeString("fr-FR")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Onglet API ────────────────────────────────────────────────────────────────
function TabApi({
  apiEnabled, setApiEnabled,
  apiBaseUrl, setApiBaseUrl,
  apiLogs, sendNow, running, sensorData,
}) {
  return (
    <>
      <div className="panel-section">
        <h2>Transmission API REST</h2>

        <label className="switch-line">
          <span>Activer l'envoi automatique</span>
          <input
            type="checkbox"
            checked={apiEnabled}
            onChange={(e) => setApiEnabled(e.target.checked)}
          />
        </label>

        <label className="form-label">
          URL de l'API externe
          <input
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder="http://localhost:3001/api/sensors"
          />
        </label>

        <button className="send-btn" onClick={sendNow}>
          📤 Envoyer une mesure test
        </button>

        <small>
          Si désactivé, le Raspberry Pi 5 simule les données mais ne les transmet pas.
          Les requêtes échouées sont aussi journalisées.
        </small>
      </div>

      {/* Payload JSON courant */}
      <div className="panel-section">
        <h2>Payload courant</h2>
        <div style={{
          background: "#1a1208", borderRadius: 8, padding: "8px 10px",
          fontFamily: "monospace", fontSize: 9.5, color: "#c0c0a0", lineHeight: 1.7,
          overflowX: "auto",
        }}>
          <span style={{ color: "#888" }}>{"// POST " + apiBaseUrl}</span>
          {"\n"}{JSON.stringify({
            source:      "Raspberry Pi 5",
            temperature: sensorData.temperature,
            humidity:    sensorData.humidity,
            co2:         sensorData.co2,
            smoke:       sensorData.smoke,
            status:      sensorData.status,
            timestamp:   sensorData.timestamp,
          }, null, 2)
            .split("\n")
            .map((line, i) => {
              const isKey = line.includes(":");
              const [key, ...rest] = line.split(":");
              return (
                <div key={i}>
                  {isKey ? (
                    <>
                      <span style={{ color: "#80c8ff" }}>{key}</span>
                      <span style={{ color: "#c8c8a0" }}>:{rest.join(":")}</span>
                    </>
                  ) : (
                    <span style={{ color: "#c8c8a0" }}>{line}</span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Journal */}
      <div className="panel-section">
        <h2>Journal API ({apiLogs.length})</h2>
        {apiLogs.length === 0 ? (
          <p className="muted">Aucune transmission pour le moment.</p>
        ) : (
          <div className="api-log-list">
            {apiLogs.slice(0, 10).map((log) => (
              <div key={log.id} className={`api-log ${log.status}`}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{log.method}</strong>
                  <span className="log-time">{log.time}</span>
                </div>
                <small>{log.message}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Onglet Info composant ─────────────────────────────────────────────────────
function TabInfo({ selectedId, items }) {
  const selectedItem = items.find((i) => i.id === selectedId);
  const comp = selectedItem ? componentsData[selectedItem.type] : null;

  if (!comp) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
        <div style={{ fontSize: 12 }}>Cliquez sur un composant pour voir ses informations et son brochage.</div>
      </div>
    );
  }

  return (
    <>
      {/* Titre + description */}
      <div className="panel-section">
        <h2>{comp.emoji} {comp.name}</h2>
        <p style={{ marginBottom: 10 }}>{comp.description}</p>

        {/* Spécifications */}
        {comp.specs && (
          <>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#c9a227", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Spécifications
            </div>
            {Object.entries(comp.specs).map(([k, v]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, padding: "3px 0",
                borderBottom: "1px solid #f5edcc",
              }}>
                <span style={{ color: "#888", fontWeight: 500 }}>{k}</span>
                <span style={{ fontWeight: 700, color: "#241805", textAlign: "right", maxWidth: 150 }}>{v}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Brochage (pins) */}
      {comp.pins.length > 0 && (
        <div className="panel-section">
          <h2>Brochage</h2>
          <div className="pin-list">
            {comp.pins.map((pin) => (
              <span key={pin.name + pin.x + pin.y}>
                <i style={{ background: pin.color }} />
                {pin.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Conseil d'utilisation */}
      <div className="panel-section" style={{ background: "#fff9e0" }}>
        <h2>💡 Conseil</h2>
        <p>
          {comp.type === "rpi5"  && "Connectez les capteurs aux broches GPIO via la breadboard. Utilisez toujours des résistances pull-up pour les signaux 1-Wire."}
          {comp.type === "dht22" && "Ajoutez une résistance pull-up 10 kΩ entre VCC et DATA. Attendez ≥ 2 s entre chaque lecture."}
          {(comp.type === "mq135" || comp.type === "mq2") && "Laissez chauffer 20 s avant la première lecture. Relier AOUT au GPIO via un ADC (MCP3008) pour une valeur précise."}
          {comp.type === "bmp280" && "Relier SDA/SCL aux broches GPIO2/GPIO3 du RPi. Adresse I2C par défaut : 0x76."}
          {comp.type === "oled"  && "Même bus I2C que le BMP280 possible (adresse 0x3C). Bibliothèque : Adafruit_SSD1306."}
          {comp.type === "relay" && "Piloter via un transistor NPN BC547 et une résistance 1 kΩ pour protéger le GPIO."}
          {comp.type === "buzzer"&& "Relier directement à un GPIO ou via transistor NPN si le courant dépasse 16 mA."}
          {(comp.type === "res220" || comp.type === "res10k") && "Toujours insérer en série pour protéger les broches GPIO et les LEDs."}
          {(comp.type === "led_r" || comp.type === "led_g") && "Toujours mettre une résistance 220 Ω en série. Anode (+) vers GPIO, Cathode (−) vers GND."}
          {comp.type === "wifi"  && "Alimenter en 3.3 V uniquement ! Connecter TX→RX GPIO15, RX→TX GPIO14."}
          {comp.type === "bluetooth" && "Configurer en mode esclave via commandes AT : AT+ROLE=0. Baudrate par défaut : 9600."}
          {comp.type === "cap100" && "Placer en parallèle sur l'alimentation pour filtrer les parasites. Respecter la polarité (+/−) !"}
          {comp.type === "transistor" && "Base (B) ← GPIO via résistance 1 kΩ. Collecteur (C) → charge. Émetteur (E) → GND."}
          {comp.type === "power" && "Utiliser l'adaptateur officiel RPi 5 (27W USB-C) pour éviter les sous-tensions."}
        </p>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Composant principal RightSidebar
// ══════════════════════════════════════════════════════════════════════════════
function RightSidebar({
  selectedId,
  items,
  sensorData,
  apiEnabled,
  setApiEnabled,
  apiBaseUrl,
  setApiBaseUrl,
  apiLogs,
  sendNow,
  running,
}) {
  const [tab, setTab] = useState(0);
  const tabs = ["📊 Données", "🌐 API", "ℹ️ Info"];

  return (
    <aside className="right-sidebar">
      {/* Onglets */}
      <div className="rs-tabs">
        {tabs.map((label, i) => (
          <div
            key={i}
            className={`rs-tab${tab === i ? " active" : ""}`}
            onClick={() => setTab(i)}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Contenu */}
      <div className="rs-body">
        {tab === 0 && (
          <TabDonnees sensorData={sensorData} running={running} />
        )}
        {tab === 1 && (
          <TabApi
            apiEnabled={apiEnabled}
            setApiEnabled={setApiEnabled}
            apiBaseUrl={apiBaseUrl}
            setApiBaseUrl={setApiBaseUrl}
            apiLogs={apiLogs}
            sendNow={sendNow}
            running={running}
            sensorData={sensorData}
          />
        )}
        {tab === 2 && (
          <TabInfo selectedId={selectedId} items={items} />
        )}
      </div>
    </aside>
  );
}

export default RightSidebar;