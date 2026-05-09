// LeftSidebar.jsx
// Panneau de composants à glisser-déposer — icône visuelle + nom + catégorie
import { useState } from "react";
import { componentsData, componentGroups } from "../data/componentsData";

// Petites icônes visuelles fidèles dans la sidebar (36×36 px)
function ChipIcon({ comp }) {
  const s = {
    width: 36, height: 36, borderRadius: 7, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden",
    background: comp.chipBg || "#f5f0e0",
    border: `1.5px solid ${comp.chipColor || "#c9a227"}55`,
  };

  // Raspberry Pi 5
  if (comp.type === "rpi5") return (
    <div style={{ ...s, background: "#0e2a5c", border: "1.5px solid #2060cc" }}>
      <div style={{ position: "absolute", top: 2, right: 2, width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
      <div style={{ fontSize: 17 }}>🍓</div>
    </div>
  );

  // Breadboard
  if (comp.type === "breadboard") return (
    <div style={{ ...s, background: "#f5eeb8", border: "1.5px solid #c9b45a", padding: 2 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
        <div style={{ height: 3, background: "#dd0000", borderRadius: 1 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 1 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: 1, background: "#b79b40", borderRadius: "50%" }} />
          ))}
        </div>
        <div style={{ height: 3, background: "#0000cc", borderRadius: 1 }} />
      </div>
    </div>
  );

  // DHT22 — petit boitier bleu-vert avec grille
  if (comp.type === "dht22") return (
    <div style={{ ...s, background: "#e8f7ea", border: "1.5px solid #1e7a34", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ width: 5, height: 5, background: "#1e7a34", borderRadius: "50%", opacity: 0.7 }} />
        ))}
      </div>
      <span style={{ fontSize: 8, fontWeight: 800, color: "#1e7a34" }}>DHT22</span>
    </div>
  );

  // MQ135 / MQ2 — capteur métallique circulaire
  if (comp.type === "mq135" || comp.type === "mq2") {
    const color = comp.type === "mq135" ? "#c45a08" : "#b52020";
    const bg    = comp.type === "mq135" ? "#fdf0e0" : "#fdecea";
    return (
      <div style={{ ...s, background: bg, border: `1.5px solid ${color}55` }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, #e8e8e8, #aaa)",
          border: `2px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: "50%",
            backgroundImage: `radial-gradient(${color}88 1.5px, transparent 2px)`,
            backgroundSize: "5px 5px",
          }} />
        </div>
      </div>
    );
  }

  // BMP280 — puce carrée bleue
  if (comp.type === "bmp280") return (
    <div style={{ ...s, background: "#e3f0fb", border: "1.5px solid #1558a055" }}>
      <div style={{
        width: 20, height: 20, background: "#0a1a3a", borderRadius: 3,
        border: "1.5px solid #2a4a8a",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "#4a8aff", fontSize: 5, fontWeight: 800 }}>BMP</span>
      </div>
    </div>
  );

  // PIR — dôme blanc
  if (comp.type === "pir") return (
    <div style={{ ...s, background: "#f0e8ff", border: "1.5px solid #6b35b055" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #fff, #d0c0f0)",
        border: "2px solid #6b35b0",
      }} />
    </div>
  );

  // WiFi / Bluetooth
  if (comp.type === "wifi" || comp.type === "bluetooth") {
    const color = comp.type === "wifi" ? "#0f7a6b" : "#1558a0";
    return (
      <div style={{ ...s, background: comp.chipBg, border: `1.5px solid ${color}55`, flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: 18 }}>{comp.type === "wifi" ? "📡" : "🔵"}</span>
        <span style={{ fontSize: 7, fontWeight: 800, color }}>{comp.type === "wifi" ? "WiFi" : "BT"}</span>
      </div>
    );
  }

  // Relay
  if (comp.type === "relay") return (
    <div style={{ ...s, background: "#f3ecfb", border: "1.5px solid #6b35b055", flexDirection: "column", gap: 2 }}>
      <div style={{ width: 26, height: 14, background: "#1e4080", borderRadius: 3, border: "1.5px solid #0a2060" }}>
        <div style={{ margin: "2px auto", width: 18, height: 8, background: "#2a5ab0", borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 7, fontWeight: 800, color: "#6b35b0" }}>RELAY</span>
    </div>
  );

  // Buzzer
  if (comp.type === "buzzer") return (
    <div style={{ ...s, background: "#fdecea", border: "1.5px solid #b5202055" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        background: "radial-gradient(circle at 40% 35%, #444, #111)",
        border: "2.5px solid #222",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#555", border: "1.5px solid #666" }} />
      </div>
    </div>
  );

  // OLED
  if (comp.type === "oled") return (
    <div style={{ ...s, background: "#1a1a2e", border: "1.5px solid #1558a0" }}>
      <div style={{
        width: 28, height: 20, background: "#000814",
        borderRadius: 3, border: "1px solid #0a3060",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {["#00c8ff","#ffc840","#44ff88"].map((c, i) => (
            <div key={i} style={{ width: 18, height: 2, background: c, borderRadius: 1, opacity: 0.8 }} />
          ))}
        </div>
      </div>
    </div>
  );

  // Résistances
  if (comp.type === "res220" || comp.type === "res10k") {
    const bands = comp.type === "res220"
      ? ["#cc0000","#cc0000","#8B4513","#c8a840"]
      : ["#8B4513","#000","#ff8800","#c8a840"];
    return (
      <div style={{ ...s, padding: "0 3px" }}>
        <div style={{ width: 5, height: 2, background: "#aaa" }} />
        <div style={{
          flex: 1, height: 12, background: "#f5e6c0",
          borderRadius: 3, border: "1.5px solid #c8a040",
          display: "flex", alignItems: "center", justifyContent: "space-evenly",
          padding: "0 3px",
        }}>
          {bands.map((c, i) => (
            <div key={i} style={{ width: 4, height: "90%", background: c, borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ width: 5, height: 2, background: "#aaa" }} />
      </div>
    );
  }

  // LEDs
  if (comp.type === "led_r" || comp.type === "led_g") {
    const color = comp.type === "led_r" ? "#ff2020" : "#20cc40";
    return (
      <div style={{ ...s, flexDirection: "column", gap: 1 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: `radial-gradient(circle at 38% 35%, #fff, ${color})`,
          border: `3px solid ${color}`,
        }} />
        <div style={{ fontSize: 7, fontWeight: 800, color }}>
          {comp.type === "led_r" ? "LED R" : "LED G"}
        </div>
      </div>
    );
  }

  // Jumper
  if (comp.type === "jumper") return (
    <div style={{ ...s, padding: "0 3px" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0392b", border: "1.5px solid white", flexShrink: 0 }} />
      <div style={{ flex: 1, height: 4, background: "linear-gradient(90deg,#c9a227,#f5e6b5,#c9a227)", borderRadius: 2 }} />
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1558a0", border: "1.5px solid white", flexShrink: 0 }} />
    </div>
  );

  // Condensateur
  if (comp.type === "cap100") return (
    <div style={{ ...s, flexDirection: "column", gap: 2 }}>
      <div style={{
        width: 18, height: 24,
        background: "linear-gradient(90deg,#4a6aa0,#8ab0e0,#4a6aa0)",
        borderRadius: "50% 50% 3px 3px / 10px 10px 3px 3px",
        border: "2px solid #2a4a80",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "white", fontSize: 8, fontWeight: 900 }}>+</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <div style={{ width: 1.5, height: 6, background: "#aaa" }} />
        <div style={{ width: 1.5, height: 6, background: "#aaa" }} />
      </div>
    </div>
  );

  // Transistor
  if (comp.type === "transistor") return (
    <div style={{ ...s, flexDirection: "column", gap: 2 }}>
      <div style={{
        width: 22, height: 26,
        background: "linear-gradient(90deg,#1a1a1a,#3a3a3a,#1a1a1a)",
        borderRadius: "50% 50% 3px 3px / 12px 12px 3px 3px",
        border: "2px solid #555",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "#888", fontSize: 5, fontWeight: 800 }}>NPN</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {["B","C","E"].map(l => (
          <div key={l} style={{ width: 1.5, height: 5, background: "#aaa" }} />
        ))}
      </div>
    </div>
  );

  // Power 5V
  if (comp.type === "power") return (
    <div style={{ ...s, background: "#fffbe8", border: "1.5px solid #c9a22755" }}>
      <div style={{
        width: 26, height: 16, border: "2.5px solid #c9a227",
        borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 14, height: 8, background: "#c9a227", borderRadius: 2, opacity: 0.5 }} />
      </div>
    </div>
  );

  // GND
  if (comp.type === "gnd") return (
    <div style={{ ...s, flexDirection: "column", gap: 2, background: "#f5f1e8", border: "1.5px solid #8a784055" }}>
      {[20, 14, 8].map((w, i) => (
        <div key={i} style={{ width: w, height: 2.5, background: "#444", borderRadius: 1 }} />
      ))}
    </div>
  );

  // Fallback emoji
  return (
    <div style={{ ...s }}>
      <span style={{ fontSize: 20 }}>{comp.emoji || "❓"}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function LeftSidebar() {
  const [search, setSearch] = useState("");

  function handleDragStart(event, type) {
    event.dataTransfer.setData("componentType", type);
  }

  const q = search.toLowerCase().trim();

  return (
    <aside className="left-sidebar">
      {/* Recherche */}
      <div className="search-box">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Rechercher un composant…"
        />
      </div>

      {/* Liste scrollable */}
      <div className="component-list">
        {componentGroups.map((group) => {
          const items = Object.values(componentsData).filter(
            (c) =>
              c.category === group.id &&
              (!q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
          );

          if (!items.length) return null;

          return (
            <div key={group.id}>
              {/* Titre de catégorie */}
              <div className="category-title">
                <span>{group.icon}</span>
                {group.label}
              </div>

              {/* Composants */}
              {items.map((comp) => (
                <div
                  key={comp.type}
                  className="component-chip"
                  draggable
                  title={comp.description}
                  onDragStart={(e) => handleDragStart(e, comp.type)}
                >
                  <ChipIcon comp={comp} />
                  <div>
                    <strong>{comp.name}</strong>
                    <span>{comp.category}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Résultat vide */}
        {q &&
          componentGroups.every(
            (g) =>
              !Object.values(componentsData).some(
                (c) =>
                  c.category === g.id &&
                  (c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
              )
          ) && (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, padding: "20px 0" }}>
              Aucun composant trouvé
            </div>
          )}
      </div>
    </aside>
  );
}

export default LeftSidebar;