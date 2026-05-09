// ComponentVisual.jsx
// Rendu visuel fidèle de chaque composant IoT (aspect réel : couleurs, forme, broches)

function Pin({ pin, onPinClick }) {
  return (
    <button
      key={pin.name + pin.x + pin.y}
      className="pin"
      title={`${pin.name}`}
      style={{ left: pin.x, top: pin.y, background: pin.color }}
      onClick={(e) => { e.stopPropagation(); onPinClick(pin); }}
    />
  );
}

// ── Raspberry Pi 5 ────────────────────────────────────────────────────────────
function RpiVisual({ component, onPinClick, running }) {
  return (
    <div className="rpi5-board">
      {/* Bandeau supérieur */}
      <div className="rpi-header">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="rpi-logo">RASPBERRY PI 5</span>
          <span className="rpi-model">BCM2712 · 2.4 GHz</span>
        </div>
        <div className="rpi-led" style={{ background: running ? "#22c55e" : "#555", boxShadow: running ? "0 0 8px #22c55e" : "none" }} />
      </div>

      {/* Puce principale */}
      <div className="rpi-chip-main" />

      {/* RAM + WiFi */}
      <div className="rpi-chip-small ram" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#555", fontSize: 6, fontWeight: 800, letterSpacing: 0.3 }}>LPDDR4X</span>
      </div>
      <div className="rpi-chip-small wifi" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#555", fontSize: 6, fontWeight: 800, letterSpacing: 0.3 }}>WiFi/BT</span>
      </div>

      {/* Ports USB */}
      <div className="rpi-port rpi-usb u1" />
      <div className="rpi-port rpi-usb u2" />

      {/* Ethernet */}
      <div className="rpi-port rpi-ethernet" />

      {/* USB-C power */}
      <div className="rpi-port rpi-usbc" />

      {/* micro-HDMI */}
      <div className="rpi-port rpi-hdmi h1" />
      <div className="rpi-port rpi-hdmi h2" />

      {/* Bande GPIO gauche (pads visuels) */}
      <div className="gpio-strip">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="gpio-pad" />
        ))}
      </div>
      <div className="gpio-strip-right">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="gpio-pad" />
        ))}
      </div>

      <div className="gpio-label">GPIO 40 broches</div>

      {/* Pins cliquables */}
      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x + pin.y} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Breadboard ────────────────────────────────────────────────────────────────
function BreadboardVisual() {
  return (
    <div className="breadboard">
      <div className="rail red" />
      <div className="rail blue" />
      <div className="holes">
        {Array.from({ length: 125 }).map((_, i) => <span key={i} />)}
      </div>
      <div className="rail blue" />
      <div className="rail red" />
      <div className="bb-label">BREADBOARD 830 pts · Pas 2.54 mm</div>
    </div>
  );
}

// ── DHT22 ─────────────────────────────────────────────────────────────────────
function Dht22Visual({ component, onPinClick, liveValue }) {
  return (
    <div className="dht22-body sensor-body" style={{ width: component.width, height: component.height }}>
      {/* Grille de capteur simulée */}
      <div className="sensor-grid-dots">
        {Array.from({ length: 20 }).map((_, i) => <span key={i} />)}
      </div>

      {liveValue && (
        <div className="sensor-live-val" style={{ color: "#1e7a34" }}>{liveValue}</div>
      )}
      <strong style={{ color: "#1e7a34" }}>DHT22</strong>
      <small>Temp / Humidité</small>

      {component.pins.map((pin) => (
        <Pin key={pin.name} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── MQ-135 / MQ-2 ─────────────────────────────────────────────────────────────
function MqVisual({ component, onPinClick, liveValue }) {
  const isMq135 = component.type === "mq135";
  const accentColor = isMq135 ? "#c45a08" : "#b52020";
  const label = isMq135 ? "Air / CO₂" : "Fumée / Gaz";

  return (
    <div
      className="mq-body"
      style={{
        width: component.width,
        height: component.height,
        borderColor: accentColor,
        background: isMq135
          ? "linear-gradient(160deg,#fff5e5,#fde6c0)"
          : "linear-gradient(160deg,#fff0f0,#fdd0c0)",
      }}
    >
      {/* Capteur métallique circulaire */}
      <div className="mq-metal">
        <div className="mq-holes" />
      </div>

      {liveValue && (
        <div className="sensor-live-val" style={{ color: accentColor }}>{liveValue}</div>
      )}
      <strong style={{ color: accentColor }}>{component.name}</strong>
      <small>{label}</small>

      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── BMP280 ────────────────────────────────────────────────────────────────────
function Bmp280Visual({ component, onPinClick, liveValue }) {
  return (
    <div
      style={{
        position: "relative",
        width: component.width,
        height: component.height,
        background: "linear-gradient(160deg,#e8f4ff,#c8e0f8)",
        border: "3px solid #1558a0",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
      }}
    >
      {/* Puce centrale */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        width: 36, height: 36, background: "#1a1a2e", borderRadius: 4,
        border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "#4a8aff", fontSize: 6, fontWeight: 800 }}>BMP</span>
      </div>

      {liveValue && (
        <div className="sensor-live-val" style={{ color: "#1558a0" }}>{liveValue}</div>
      )}
      <strong style={{ color: "#1558a0", fontSize: 12 }}>BMP280</strong>
      <small>Pression / Temp</small>

      {component.pins.map((pin) => (
        <Pin key={pin.name} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── PIR HC-SR501 ──────────────────────────────────────────────────────────────
function PirVisual({ component, onPinClick, liveValue }) {
  return (
    <div style={{
      position: "relative", width: component.width, height: component.height,
      background: "linear-gradient(160deg,#f0e8ff,#ddd0f8)",
      border: "3px solid #6b35b0", borderRadius: 10,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", paddingBottom: 10,
      boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
    }}>
      {/* Dôme blanc caractéristique du PIR */}
      <div style={{
        position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)",
        width: 50, height: 50, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #fff, #d0c0f0)",
        border: "3px solid #6b35b0", boxShadow: "inset 0 0 12px rgba(107,53,176,0.15)",
      }} />

      {liveValue && (
        <div className="sensor-live-val" style={{ color: "#6b35b0" }}>{liveValue}</div>
      )}
      <strong style={{ color: "#6b35b0", fontSize: 11 }}>HC-SR501</strong>
      <small>Détection mouvement</small>

      {component.pins.map((pin) => (
        <Pin key={pin.name} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Module WiFi / Bluetooth ────────────────────────────────────────────────────
function WifiModuleVisual({ component, onPinClick }) {
  const isWifi = component.type === "wifi";
  const color = isWifi ? "#0f7a6b" : "#1558a0";
  const bg = isWifi
    ? "linear-gradient(160deg,#e7fbf7,#c0f0e8)"
    : "linear-gradient(160deg,#ddeeff,#b8d8f8)";

  return (
    <div className="wifi-module" style={{
      width: component.width, height: component.height,
      borderColor: color, background: bg,
    }}>
      {isWifi ? (
        <div className="antenna" style={{ borderColor: color }} />
      ) : (
        /* Icône BT stylisée */
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          fontSize: 22, color,
        }}>🔵</div>
      )}

      <strong style={{ color }}>{isWifi ? "ESP8266" : "HC-05 BT"}</strong>
      <small>{isWifi ? "Wi-Fi UART" : "Bluetooth UART"}</small>

      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Relais ────────────────────────────────────────────────────────────────────
function RelayVisual({ component, onPinClick }) {
  return (
    <div style={{
      position: "relative", width: component.width, height: component.height,
      background: "linear-gradient(160deg,#f3ecfb,#e0d0f8)",
      border: "3px solid #6b35b0", borderRadius: 10,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", paddingBottom: 10,
      boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
    }}>
      {/* Corps rectangulaire bleu du relais */}
      <div style={{
        position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
        width: 60, height: 34, background: "#1e4080",
        borderRadius: 5, border: "2px solid #0a2060",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "#80aaff", fontSize: 7, fontWeight: 800, letterSpacing: 0.5 }}>RELAY 5V</span>
      </div>
      <strong style={{ color: "#6b35b0", fontSize: 12 }}>Relais 5 V</strong>
      <small>250VAC / 10A</small>

      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Buzzer ────────────────────────────────────────────────────────────────────
function BuzzerVisual({ component, onPinClick, running }) {
  return (
    <div style={{
      position: "relative", width: component.width, height: component.height,
      background: "linear-gradient(160deg,#fdecea,#f8c8c8)",
      border: "3px solid #b52020", borderRadius: 10,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", paddingBottom: 10,
      boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
    }}>
      {/* Corps circulaire noir du buzzer */}
      <div style={{
        position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)",
        width: 40, height: 40, borderRadius: "50%",
        background: "radial-gradient(circle at 40% 35%, #444, #111)",
        border: "3px solid #222",
        boxShadow: running ? "0 0 10px rgba(181,32,32,0.5)" : "none",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 16, height: 16, borderRadius: "50%",
          background: "#555", border: "2px solid #666",
        }} />
      </div>

      <strong style={{ color: "#b52020", fontSize: 11 }}>Buzzer</strong>
      <small>~2.3 kHz actif</small>

      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Écran OLED ────────────────────────────────────────────────────────────────
function OledVisual({ component, onPinClick, sensorData }) {
  return (
    <div style={{
      position: "relative", width: component.width, height: component.height,
      background: "#1a1a2e", border: "3px solid #1558a0", borderRadius: 10,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", paddingBottom: 8,
      boxShadow: "0 4px 14px rgba(0,0,0,0.20)",
    }}>
      {/* Écran OLED simulé */}
      <div style={{
        position: "absolute", top: 6, left: 6, right: 6, height: 44,
        background: "#000814", borderRadius: 5,
        display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "center",
        padding: "4px 6px", gap: 2,
        border: "1px solid #0a3060",
      }}>
        {sensorData ? (
          <>
            <span style={{ color: "#00c8ff", fontSize: 7, fontFamily: "monospace", fontWeight: 700 }}>
              T: {sensorData.temperature}°C  H: {sensorData.humidity}%
            </span>
            <span style={{ color: "#ffc840", fontSize: 7, fontFamily: "monospace", fontWeight: 700 }}>
              CO2: {sensorData.co2} ppm
            </span>
            <span style={{ color: sensorData.smoke > 200 ? "#ff4444" : "#44ff88", fontSize: 7, fontFamily: "monospace", fontWeight: 700 }}>
              Fumee: {sensorData.smoke} ppm
            </span>
          </>
        ) : (
          <span style={{ color: "#2a4a6a", fontSize: 8, fontFamily: "monospace" }}>-- Eteint --</span>
        )}
      </div>

      <strong style={{ color: "#7ab0e0", fontSize: 10 }}>OLED 0.96"</strong>
      <small style={{ color: "#4a6a8a" }}>128×64 I2C</small>

      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Résistances ───────────────────────────────────────────────────────────────
function ResistorVisual({ component }) {
  const is220 = component.type === "res220";
  // Bandes de couleur selon code IEC
  const bands = is220
    ? ["#cc0000", "#cc0000", "#8B4513", "#c8a840"] // R-R-Brun-Or
    : ["#8B4513", "#000000", "#ff8800", "#c8a840"]; // Brun-Noir-Or-Or

  return (
    <div style={{
      position: "relative", width: component.width, height: component.height,
      display: "flex", alignItems: "center", gap: 2, padding: "0 2px",
    }}>
      {/* Fil gauche */}
      <div style={{ width: 8, height: 2, background: "#aaa", flexShrink: 0 }} />
      {/* Corps */}
      <div style={{
        flex: 1, height: 18, background: "#f5e6c0", borderRadius: 4,
        border: "1.5px solid #c8a040",
        display: "flex", alignItems: "center", justifyContent: "space-evenly",
        padding: "0 5px",
      }}>
        {bands.map((c, i) => (
          <div key={i} style={{ width: 5, height: "90%", background: c, borderRadius: 1 }} />
        ))}
      </div>
      {/* Fil droit */}
      <div style={{ width: 8, height: 2, background: "#aaa", flexShrink: 0 }} />

      {/* Valeur */}
      <div style={{
        position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
        fontSize: 7, fontWeight: 800, color: "#8a6820", whiteSpace: "nowrap",
      }}>
        {is220 ? "220 Ω" : "10 kΩ"}
      </div>
    </div>
  );
}

// ── LED ───────────────────────────────────────────────────────────────────────
function LedVisual({ component, onPinClick, running }) {
  const isRed = component.type === "led_r";
  const color = isRed ? "#ff2020" : "#20cc40";
  const glow  = isRed ? "rgba(255,32,32,0.6)" : "rgba(32,204,64,0.6)";

  return (
    <div style={{
      position: "relative", width: component.width, height: component.height,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", paddingBottom: 8,
    }}>
      {/* Corps LED */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 28, height: 28, borderRadius: "50% 50% 0 0",
        background: running
          ? `radial-gradient(circle at 40% 35%, #fff, ${color})`
          : `radial-gradient(circle at 40% 35%, #fff, ${color}88)`,
        border: `3px solid ${color}`,
        boxShadow: running ? `0 0 12px 4px ${glow}` : "none",
        transition: "box-shadow 0.4s",
      }} />
      {/* Pied LED */}
      <div style={{ display: "flex", gap: 6, marginTop: 28, alignItems: "flex-end" }}>
        <div style={{ width: 2, height: 18, background: "#aaa" }} />
        <div style={{ width: 2, height: 14, background: "#aaa" }} />
      </div>

      {/* Pins */}
      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Fil Jumper ────────────────────────────────────────────────────────────────
function JumperVisual() {
  return (
    <div className="jumper-body">
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        width: "100%", padding: "0 8px",
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c0392b", border: "2px solid white", flexShrink: 0 }} />
        <div style={{
          flex: 1, height: 5, borderRadius: 3,
          background: "linear-gradient(90deg, #c9a227, #f5e6b5, #c9a227)",
          border: "1px solid #a07020",
        }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1558a0", border: "2px solid white", flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ── Condensateur ──────────────────────────────────────────────────────────────
function CapacitorVisual({ component, onPinClick }) {
  return (
    <div style={{
      position: "relative", width: component.width, height: component.height,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", paddingBottom: 8,
    }}>
      {/* Corps cylindrique */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 30, height: 42,
        background: "linear-gradient(90deg, #4a6aa0, #8ab0e0, #4a6aa0)",
        borderRadius: "50% 50% 4px 4px / 14px 14px 4px 4px",
        border: "2px solid #2a4a80",
      }}>
        {/* Ligne de polarité */}
        <div style={{
          position: "absolute", left: 2, top: 4, bottom: 4, width: 8,
          background: "rgba(0,0,0,0.15)", borderRadius: "50% 0 0 50% / 50% 0 0 50%",
        }} />
        <div style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", fontSize: 8, color: "white", fontWeight: 900 }}>+</div>
      </div>

      {/* Pattes */}
      <div style={{ display: "flex", gap: 8, marginTop: 42 }}>
        <div style={{ width: 2, height: 14, background: "#aaa" }} />
        <div style={{ width: 2, height: 14, background: "#aaa" }} />
      </div>

      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Transistor NPN ────────────────────────────────────────────────────────────
function TransistorVisual({ component, onPinClick }) {
  return (
    <div style={{
      position: "relative", width: component.width, height: component.height,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", paddingBottom: 8,
    }}>
      {/* Corps TO-92 */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 34, height: 40,
        background: "linear-gradient(90deg, #1a1a1a, #3a3a3a, #1a1a1a)",
        borderRadius: "50% 50% 4px 4px / 18px 18px 4px 4px",
        border: "2px solid #555",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "#888", fontSize: 7, fontWeight: 800 }}>BC547</span>
      </div>

      {/* 3 pattes : B C E */}
      <div style={{ display: "flex", gap: 4, marginTop: 40 }}>
        {["B","C","E"].map((l, i) => (
          <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 2, height: 12, background: "#aaa" }} />
            <span style={{ fontSize: 7, fontWeight: 800, color: "#666" }}>{l}</span>
          </div>
        ))}
      </div>

      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── Alimentation 5V ───────────────────────────────────────────────────────────
function PowerVisual({ component, onPinClick }) {
  return (
    <div className="power-module" style={{ width: component.width, height: component.height }}>
      <div className="battery-body">
        <div className="battery-fill" />
      </div>
      <strong style={{ color: "#b8920a" }}>5V / 3A</strong>
      <small>Alimentation</small>
      {component.pins.map((pin) => (
        <Pin key={pin.name + pin.x} pin={pin} onPinClick={onPinClick} />
      ))}
    </div>
  );
}

// ── GND ───────────────────────────────────────────────────────────────────────
function GndVisual() {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 2,
    }}>
      <div style={{ width: 36, height: 3, background: "#222", borderRadius: 2 }} />
      <div style={{ width: 24, height: 3, background: "#222", borderRadius: 2 }} />
      <div style={{ width: 12, height: 3, background: "#222", borderRadius: 2 }} />
      <span style={{ fontSize: 9, fontWeight: 800, color: "#555", marginTop: 2 }}>GND</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Composant principal — dispatch selon le type
// ═══════════════════════════════════════════════════════════════════════════════
function ComponentVisual({ component, onPinClick, running = false, sensorData = null }) {
  const liveTemp = running && sensorData ? `${sensorData.temperature}°C / ${sensorData.humidity}%` : null;
  const liveCo2  = running && sensorData ? `CO₂ ${sensorData.co2} ppm` : null;
  const liveSmk  = running && sensorData ? `Fumée ${sensorData.smoke} ppm` : null;
  const livePress= running && sensorData ? `${(1013 + (Math.random() - 0.5) * 10).toFixed(1)} hPa` : null;
  const livePir  = running ? (Math.random() > 0.85 ? "DÉTECTÉ !" : "Calme") : null;

  switch (component.type) {
    case "rpi5":        return <RpiVisual       component={component} onPinClick={onPinClick} running={running} />;
    case "breadboard":  return <BreadboardVisual />;
    case "dht22":       return <Dht22Visual     component={component} onPinClick={onPinClick} liveValue={liveTemp} />;
    case "mq135":       return <MqVisual        component={component} onPinClick={onPinClick} liveValue={liveCo2} />;
    case "mq2":         return <MqVisual        component={component} onPinClick={onPinClick} liveValue={liveSmk} />;
    case "bmp280":      return <Bmp280Visual    component={component} onPinClick={onPinClick} liveValue={livePress} />;
    case "pir":         return <PirVisual       component={component} onPinClick={onPinClick} liveValue={livePir} />;
    case "wifi":
    case "bluetooth":   return <WifiModuleVisual component={component} onPinClick={onPinClick} />;
    case "relay":       return <RelayVisual     component={component} onPinClick={onPinClick} />;
    case "buzzer":      return <BuzzerVisual    component={component} onPinClick={onPinClick} running={running} />;
    case "oled":        return <OledVisual      component={component} onPinClick={onPinClick} sensorData={running ? sensorData : null} />;
    case "res220":
    case "res10k":      return <ResistorVisual  component={component} />;
    case "led_r":
    case "led_g":       return <LedVisual       component={component} onPinClick={onPinClick} running={running} />;
    case "jumper":      return <JumperVisual />;
    case "cap100":      return <CapacitorVisual component={component} onPinClick={onPinClick} />;
    case "transistor":  return <TransistorVisual component={component} onPinClick={onPinClick} />;
    case "power":       return <PowerVisual     component={component} onPinClick={onPinClick} />;
    case "gnd":         return <GndVisual />;
    default:
      return (
        <div className="generic-component">
          <span style={{ fontSize: 20, marginBottom: 4 }}>{component.emoji || "❓"}</span>
          <strong style={{ fontSize: 11 }}>{component.name}</strong>
        </div>
      );
  }
}

export default ComponentVisual;