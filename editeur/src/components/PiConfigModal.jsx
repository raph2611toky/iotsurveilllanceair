import { useMemo, useState } from "react";
import { componentsData } from "../data/componentsData";

function isRpiConnection(wire, rpiId) {
  return wire.from.itemId === rpiId || wire.to.itemId === rpiId;
}

function getOtherSide(wire, rpiId) {
  return wire.from.itemId === rpiId ? wire.to : wire.from;
}

function getRpiSide(wire, rpiId) {
  return wire.from.itemId === rpiId ? wire.from : wire.to;
}

function generatePythonCode(item, items, wires) {
  const rpiWires = wires.filter((wire) => isRpiConnection(wire, item.id));

  const lines = [];
  lines.push("# Code généré virtuellement pour Raspberry Pi 5");
  lines.push("# Projet : Surveillance de la qualité de l'air avec alerte intelligente");
  lines.push("");
  lines.push("import time");
  lines.push("import requests");
  lines.push("");
  lines.push('API_URL = "http://localhost:3001/api/iot/data"');
  lines.push("");
  lines.push("# Mapping des pins détectées dans l'éditeur");
  lines.push("PIN_MAP = {");

  rpiWires.forEach((wire) => {
    const rpiPin = getRpiSide(wire, item.id);
    const otherPin = getOtherSide(wire, item.id);
    const otherItem = items.find((current) => current.id === otherPin.itemId);
    const otherName = componentsData[otherItem?.type]?.name || otherPin.itemType;

    lines.push(
      `    "${otherName}_${otherPin.pinName}": "${rpiPin.pinName}",`
    );
  });

  lines.push("}");
  lines.push("");
  lines.push("def read_virtual_sensors():");
  lines.push("    # Dans la vraie réalisation, remplacer cette partie par la lecture GPIO/I2C/ADC.");
  lines.push("    return {");
  lines.push('        "source": "Raspberry Pi 5",');
  lines.push('        "status": "simulation",');
  lines.push('        "pins": PIN_MAP,');
  lines.push('        "timestamp": time.time(),');
  lines.push("    }");
  lines.push("");
  lines.push("while True:");
  lines.push("    payload = read_virtual_sensors()");
  lines.push("    try:");
  lines.push("        response = requests.post(API_URL, json=payload, timeout=3)");
  lines.push('        print("Envoi API:", response.status_code)');
  lines.push("    except Exception as error:");
  lines.push('        print("Erreur API:", error)');
  lines.push("    time.sleep(2)");

  return lines.join("\n");
}

function connectionTypeLabel(pinName) {
  const text = pinName.toUpperCase();

  if (text.includes("GND")) return "Masse";
  if (text.includes("5V")) return "Alimentation 5V";
  if (text.includes("3.3V") || text.includes("3V3")) return "Alimentation 3.3V";
  if (text.includes("SDA")) return "I2C SDA";
  if (text.includes("SCL")) return "I2C SCL";
  if (text.includes("TX")) return "UART TX";
  if (text.includes("RX")) return "UART RX";
  if (text.includes("MOSI") || text.includes("MISO") || text.includes("SCLK")) return "SPI";
  if (text.includes("GPIO")) return "GPIO numérique";

  return "Signal";
}

export default function PiConfigModal({
  item,
  items,
  wires,
  sensorConfigs,
  sensorDataByItem,
  onClose,
  onApply,
}) {
  const [code, setCode] = useState(() => generatePythonCode(item, items, wires));

  const rpiConnections = useMemo(() => {
    return wires
      .filter((wire) => isRpiConnection(wire, item.id))
      .map((wire) => {
        const rpiPin = getRpiSide(wire, item.id);
        const otherPin = getOtherSide(wire, item.id);
        const otherItem = items.find((current) => current.id === otherPin.itemId);
        const otherComponent = componentsData[otherItem?.type];

        return {
          wire,
          rpiPin,
          otherPin,
          otherItem,
          otherComponent,
        };
      });
  }, [wires, item.id, items]);

  return (
    <div className="pi-page">
      <header className="pi-page-header">
        <button className="pi-back-btn" onClick={onClose}>
          ← Retourner vers l’éditeur
        </button>

        <div>
          <h1>Configuration Raspberry Pi 5</h1>
          <p>Éditeur de code, pins connectées, mapping GPIO et téléversement virtuel.</p>
        </div>

        <button className="pi-apply-top-btn" onClick={onApply}>
          Appliquer / Téléverser
        </button>
      </header>

      <main className="pi-page-main">
        <section className="pi-page-left">
          <div className="pi-config-card">
            <h3>État du Raspberry Pi</h3>

            <div className={item.powered ? "pi-power-state on" : "pi-power-state"}>
              {item.powered ? "Raspberry Pi allumé" : "Raspberry Pi éteint"}
            </div>

            <p>
              Cette page représente la configuration logicielle du Raspberry Pi. Les pins
              connectées sont détectées automatiquement depuis l’éditeur de circuit.
            </p>
          </div>

          <div className="pi-config-card">
            <h3>Pins connectées</h3>

            {rpiConnections.length === 0 && (
              <p>Aucune pin du Raspberry Pi n’est encore connectée.</p>
            )}

            {rpiConnections.map((entry) => (
              <div key={entry.wire.id} className="pi-pin-line">
                <span style={{ background: entry.wire.color }} />

                <div>
                  <strong>{entry.rpiPin.pinName}</strong>
                  <small>{connectionTypeLabel(entry.rpiPin.pinName)}</small>
                </div>

                <em>→</em>

                <div>
                  <strong>
                    {entry.otherComponent?.name || entry.otherPin.itemType}
                  </strong>
                  <small>{entry.otherPin.pinName}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="pi-config-card">
            <h3>Liaisons recommandées</h3>

            <ul className="pi-guide-list">
              <li>DHT22 : VCC → 3.3V/5V, DATA → GPIO4, GND → GND</li>
              <li>MQ-135 : VCC → 5V, GND → GND, DOUT → GPIO17</li>
              <li>MQ-2 : VCC → 5V, GND → GND, DOUT → GPIO27</li>
              <li>BMP280 : VCC → 3.3V, SDA → GPIO2 SDA, SCL → GPIO3 SCL, GND → GND</li>
              <li>OLED : SDA → GPIO2 SDA, SCL → GPIO3 SCL</li>
              <li>AOUT des capteurs analogiques : utiliser un ADC externe comme MCP3008.</li>
            </ul>
          </div>
        </section>

        <section className="pi-page-code">
          <div className="pi-code-toolbar">
            <strong>Code de configuration</strong>

            <button
              onClick={() => setCode(generatePythonCode(item, items, wires))}
            >
              Régénérer
            </button>
          </div>

          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
          />

          <div className="pi-modal-actions">
            <button className="pi-secondary-btn" onClick={onClose}>
              Retourner vers l’éditeur
            </button>

            <button className="pi-apply-btn" onClick={onApply}>
              Appliquer / Téléverser
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}