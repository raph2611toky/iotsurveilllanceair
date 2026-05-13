import { useMemo, useState } from "react";
import { componentsData } from "../data/componentsData";

function getPinUniqueKey(pin) {
  return pin?.pinKey || pin?.key || pin?.id || `pin-${pin?.number || pin?.pinName || pin?.name}-${pin?.localX ?? pin?.x}-${pin?.localY ?? pin?.y}`;
}

function makePinKey(pinRef) {
  return `${pinRef.itemId}:${getPinUniqueKey(pinRef)}`;
}

function getPinNodeId(itemId, pin) {
  return `${itemId}:${getPinUniqueKey(pin)}`;
}

function createUnionFind() {
  const parent = new Map();

  function find(x) {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x);
    if (p !== x) parent.set(x, find(p));
    return parent.get(x);
  }

  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  }

  function connected(a, b) {
    return find(a) === find(b);
  }

  return { find, union, connected };
}

function getBreadboardGroupKey(pinName = "") {
  const name = String(pinName).toUpperCase();
  if (/^L\+\d+$/.test(name)) return "LEFT_PLUS_RAIL";
  if (/^L-\d+$/.test(name)) return "LEFT_MINUS_RAIL";
  if (/^R\+\d+$/.test(name)) return "RIGHT_PLUS_RAIL";
  if (/^R-\d+$/.test(name)) return "RIGHT_MINUS_RAIL";
  const columnMatch = name.match(/^([A-J])(\d+)$/);
  if (columnMatch) return `COLUMN_${columnMatch[1]}`;
  return null;
}

function normalizeConstantPart(value = "") {
  return String(value)
    .toUpperCase()
    .replace(/GPIO/g, "GPIO")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getComponentPrefix(type, name) {
  const map = {
    dht22: "DHT",
    mq135: "MQ135",
    mq2: "MQ2",
    bmp280: "BMP280",
    oled: "OLED",
    pir: "PIR",
    pressure: "PRESSURE",
    soil: "SOIL",
    relay: "RELAY",
    buzzer: "BUZZER",
    wifi: "WIFI",
    bluetooth: "BT",
  };

  return map[type] || normalizeConstantPart(name || type);
}

function normalizeRpiPinValue(pinName = "") {
  const text = String(pinName).toUpperCase();
  const gpio = text.match(/GPIO\s*(\d+)/);
  if (gpio) return `GPIO${gpio[1]}`;
  if (text.includes("3V3") || text.includes("3.3V")) return "3V3";
  if (text.includes("5V")) return "5V";
  if (text.includes("GND")) return "GND";
  if (text.includes("SDA")) return "GPIO2";
  if (text.includes("SCL")) return "GPIO3";
  return normalizeConstantPart(text) || "PIN";
}

function buildElectricalNetwork(items, wires) {
  const uf = createUnionFind();

  items.forEach((item) => {
    const component = componentsData[item.type];
    component?.pins?.forEach((pin) => uf.find(getPinNodeId(item.id, pin)));
  });

  items.forEach((item) => {
    if (item.type !== "breadboard") return;
    const component = componentsData[item.type];
    const groups = new Map();

    component?.pins?.forEach((pin) => {
      const groupKey = getBreadboardGroupKey(pin.name);
      if (!groupKey) return;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(getPinNodeId(item.id, pin));
    });

    groups.forEach((nodes) => {
      const [first, ...rest] = nodes;
      rest.forEach((node) => uf.union(first, node));
    });
  });

  wires.forEach((wire) => {
    if (!wire?.from || !wire?.to) return;
    uf.union(makePinKey(wire.from), makePinKey(wire.to));
  });

  return uf;
}

function generatePinMappings(item, items, wires) {
  const uf = buildElectricalNetwork(items, wires);
  const rpiComponent = componentsData[item.type];
  const rpiPins = (rpiComponent?.pins || []).map((pin) => ({
    item,
    pin,
    node: getPinNodeId(item.id, pin),
    value: normalizeRpiPinValue(pin.name),
  }));

  const mappings = [];
  const usedConstants = new Set();

  items.forEach((otherItem) => {
    if (otherItem.id === item.id || otherItem.type === "breadboard") return;

    const component = componentsData[otherItem.type];
    if (!component?.pins) return;

    component.pins.forEach((pin) => {
      const node = getPinNodeId(otherItem.id, pin);
      const rpiPin = rpiPins.find((candidate) => uf.connected(node, candidate.node));
      if (!rpiPin) return;

      const prefix = getComponentPrefix(otherItem.type, component.name);
      const pinPart = normalizeConstantPart(pin.name)
        .replace(/^DOUT$/, "DATA")
        .replace(/^OUT$/, "DATA")
        .replace(/^SIG$/, "SIGNAL");

      let constant = `${prefix}_${pinPart}`;
      if (usedConstants.has(constant)) constant = `${constant}_${otherItem.id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      usedConstants.add(constant);

      mappings.push({
        constant,
        value: rpiPin.value,
        componentName: component.name,
        componentType: otherItem.type,
        itemId: otherItem.id,
        sensorPin: pin.name,
        rpiPinName: rpiPin.pin.name,
        rpiPinLabel: rpiPin.pin.label,
      });
    });
  });

  return mappings.sort((a, b) => a.constant.localeCompare(b.constant));
}

function generatePythonCode(item, items, wires) {
  const mappings = generatePinMappings(item, items, wires);
  const lines = [];

  lines.push("# Code généré automatiquement pour Raspberry Pi 5");
  lines.push("# Projet : Surveillance de la qualité de l'air avec alerte intelligente");
  lines.push("# Les constantes ci-dessous viennent des liaisons réelles de l'éditeur.");
  lines.push("");
  lines.push("import time");
  lines.push("import requests");
  lines.push("");
  lines.push('API_URL = "http://127.0.0.1:5000/api/projects/<id>/simulation-data"');
  lines.push("");
  lines.push("# Constantes GPIO générées depuis le câblage");

  if (mappings.length === 0) {
    lines.push("# Aucune liaison entre un composant et le Raspberry Pi n'a encore été détectée.");
  } else {
    mappings.forEach((mapping) => {
      lines.push(`${mapping.constant} = "${mapping.value}"  # ${mapping.componentName} ${mapping.sensorPin} -> ${mapping.rpiPinName}`);
    });
  }

  lines.push("");
  lines.push("PIN_MAP = {");
  mappings.forEach((mapping) => {
    lines.push(`    "${mapping.constant}": ${mapping.constant},`);
  });
  lines.push("}");
  lines.push("");
  lines.push("def read_virtual_sensors():");
  lines.push("    # Dans la vraie réalisation, remplacer par les lectures GPIO/I2C/SPI/ADC.");
  lines.push("    return {");
  lines.push('        "source": "Raspberry Pi 5",');
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

export default function PiConfigModal({ item, items, wires, onClose, onApply }) {
  const mappings = useMemo(() => generatePinMappings(item, items, wires), [item, items, wires]);
  const [code, setCode] = useState(() => generatePythonCode(item, items, wires));

  return (
    <div className="pi-page">
      <header className="pi-page-header">
        <button className="pi-back-btn" onClick={onClose}>← Retourner vers l’éditeur</button>
        <div>
          <h1>Configuration Raspberry Pi 5</h1>
          <p>Constantes GPIO générées automatiquement depuis les liaisons de l’éditeur.</p>
        </div>
        <button className="pi-apply-top-btn" onClick={onApply}>Appliquer / Téléverser</button>
      </header>

      <main className="pi-page-main">
        <section className="pi-page-left">
          <div className="pi-config-card">
            <h3>Mapping automatique</h3>
            {mappings.length === 0 && <p>Aucune liaison vers le Raspberry Pi n’est encore détectée.</p>}
            {mappings.map((mapping) => (
              <div key={`${mapping.constant}-${mapping.itemId}`} className="pi-pin-line">
                <span style={{ background: mapping.value === "GND" ? "#222" : mapping.value === "5V" ? "#ff0000" : "#22c55e" }} />
                <div>
                  <strong>{mapping.constant}</strong>
                  <small>{mapping.componentName} · {mapping.sensorPin}</small>
                </div>
                <em>→</em>
                <div>
                  <strong>{mapping.value}</strong>
                  <small>{mapping.rpiPinLabel || mapping.rpiPinName}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="pi-config-card">
            <h3>Liaisons recommandées</h3>
            <ul className="pi-guide-list">
              <li>DHT22 DATA → GPIO4</li>
              <li>MQ-135 DOUT → GPIO17</li>
              <li>MQ-2 DOUT → GPIO27</li>
              <li>BMP280 SDA → GPIO2 SDA, SCL → GPIO3 SCL</li>
              <li>OLED SDA → GPIO2 SDA, SCL → GPIO3 SCL</li>
              <li>AOUT analogique → ADC externe comme MCP3008</li>
            </ul>
          </div>
        </section>

        <section className="pi-page-code">
          <div className="pi-code-toolbar">
            <strong>Code de configuration</strong>
            <button onClick={() => setCode(generatePythonCode(item, items, wires))}>Régénérer</button>
          </div>

          <textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} />

          <div className="pi-modal-actions">
            <button className="pi-secondary-btn" onClick={onClose}>Retourner vers l’éditeur</button>
            <button className="pi-apply-btn" onClick={onApply}>Appliquer / Téléverser</button>
          </div>
        </section>
      </main>
    </div>
  );
}
