// EditorCanvas.jsx
// Canvas principal : drag-and-drop, déplacement, câblage, zoom

import { useRef } from "react";
import { componentsData } from "../data/componentsData";
import ComponentVisual from "./ComponentVisual";

// Choisit la couleur du fil selon les noms de pins
function chooseWireColor(fromPin, toPin, fallbackColor) {
  const text = `${fromPin} ${toPin}`.toUpperCase();
  if (text.includes("GND"))           return "#222222";
  if (text.includes("5V") || text.includes("VCC") || text.includes("+5V")) return "#ff0000";
  if (text.includes("3.3V"))          return "#ff7a30";
  if (text.includes("SDA") || text.includes("DATA")) return "#0055ff";
  if (text.includes("SCL"))           return "#00aa00";
  if (text.includes("TX"))            return "#aa00ff";
  if (text.includes("RX"))            return "#ff00aa";
  if (text.includes("AOUT"))          return "#00aaff";
  if (text.includes("DOUT"))          return "#ffaa00";
  if (text.includes("IN"))            return "#ff8800";
  return fallbackColor || "#c9a227";
}

function EditorCanvas({
  items,
  setItems,
  wires,
  setWires,
  selectedId,
  setSelectedId,
  wireMode,
  pendingPin,
  setPendingPin,
  running,
  sensorData,
  zoom,
}) {
  const canvasRef = useRef(null);
  const scale = zoom / 100;

  // ── Drop depuis la sidebar ────────────────────────────────────────────────
  function handleDrop(event) {
    event.preventDefault();
    const componentType = event.dataTransfer.getData("componentType");
    if (!componentType || !componentsData[componentType]) return;

    const component = componentsData[componentType];
    const rect = canvasRef.current.getBoundingClientRect();

    const newItem = {
      id:   `${componentType}-${Date.now()}`,
      type: componentType,
      x:    (event.clientX - rect.left) / scale - component.width  / 2,
      y:    (event.clientY - rect.top)  / scale - component.height / 2,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  }

  // ── Déplacement d'un composant ────────────────────────────────────────────
  function startMove(event, itemId) {
    if (wireMode) return;
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const current = items.find((i) => i.id === itemId);
    if (!current) return;

    function onMove(e) {
      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, x: current.x + dx, y: current.y + dy } : i
        )
      );
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }

  // ── Clic sur une pin pour câbler ──────────────────────────────────────────
  function handlePinClick(item, pin) {
    if (!wireMode) return;

    const clicked = {
      itemId:   item.id,
      itemType: item.type,
      pinName:  pin.name,
      x: item.x + pin.x,
      y: item.y + pin.y,
      color: pin.color,
    };

    if (!pendingPin) {
      setPendingPin(clicked);
      return;
    }

    // Même composant → annuler
    if (pendingPin.itemId === clicked.itemId) {
      setPendingPin(null);
      return;
    }

    const color = chooseWireColor(pendingPin.pinName, clicked.pinName, clicked.color);

    setWires((prev) => [
      ...prev,
      {
        id:    `wire-${Date.now()}`,
        from:  pendingPin,
        to:    clicked,
        color,
      },
    ]);
    setPendingPin(null);
  }

  // ── Résoudre la position actuelle d'une pin (après déplacement) ───────────
  function resolvePin(pinRef) {
    const item = items.find((i) => i.id === pinRef.itemId);
    if (!item) return pinRef;
    const comp = componentsData[item.type];
    const pin  = comp?.pins.find((p) => p.name === pinRef.pinName);
    if (!pin) return pinRef;
    return { ...pinRef, x: item.x + pin.x, y: item.y + pin.y };
  }

  // ── Supprimer composant sélectionné ──────────────────────────────────────
  function deleteSelected(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setWires((prev) =>
      prev.filter((w) => w.from.itemId !== id && w.to.itemId !== id)
    );
    setSelectedId(null);
    setPendingPin(null);
  }

  // ── Clic canvas vide → désélectionner ────────────────────────────────────
  function handleCanvasClick(e) {
    if (e.target === canvasRef.current || e.target.classList.contains("canvas-grid")) {
      setSelectedId(null);
      if (!wireMode) setPendingPin(null);
    }
  }

  return (
    <main
      ref={canvasRef}
      className={`canvas${wireMode ? " wire-mode" : ""}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={handleCanvasClick}
    >
      {/* Grille de fond */}
      <div className="canvas-grid" />

      {/* Écran vide */}
      {items.length === 0 && (
        <div className="empty-canvas">
          <div className="empty-icon">⚡</div>
          <strong>Glisse les composants ici</strong>
          <span>Raspberry Pi 5, capteurs, breadboard, alimentation…</span>
        </div>
      )}

      {/* ── Couche SVG : fils ── */}
      <svg
        className="wire-svg"
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {wires.map((wire) => {
          const from = resolvePin(wire.from);
          const to   = resolvePin(wire.to);
          const midY = (from.y + to.y) / 2;

          return (
            <g key={wire.id}>
              {/* Fil en courbe de Bézier */}
              <path
                d={`M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`}
                stroke={wire.color}
                strokeWidth={3.5}
                fill="none"
                strokeLinecap="round"
                opacity={0.88}
              />
              {/* Pastilles aux extrémités */}
              <circle cx={from.x} cy={from.y} r={5} fill={wire.color} />
              <circle cx={to.x}   cy={to.y}   r={5} fill={wire.color} />
              {/* Étiquette pin */}
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 6}
                textAnchor="middle"
                fontSize={8}
                fontWeight={700}
                fontFamily="monospace"
                fill={wire.color}
                opacity={0.8}
              >
                {wire.from.pinName}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Composants placés ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {items.map((item) => {
          const comp = componentsData[item.type];
          if (!comp) return null;
          const isSelected = selectedId === item.id;

          return (
            <div
              key={item.id}
              className={`placed${isSelected ? " selected" : ""}`}
              style={{
                left:   item.x,
                top:    item.y,
                width:  comp.width,
                height: comp.height,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedId(item.id);
                startMove(e, item.id);
              }}
            >
              {/* Bouton supprimer */}
              {isSelected && (
                <button
                  className="delete-btn"
                  title="Supprimer ce composant"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSelected(item.id);
                  }}
                >
                  ×
                </button>
              )}

              {/* Visuel du composant */}
              <ComponentVisual
                component={comp}
                onPinClick={(pin) => handlePinClick(item, pin)}
                running={running}
                sensorData={sensorData}
              />
            </div>
          );
        })}
      </div>

      {/* ── Info pin en attente de câblage ── */}
      {pendingPin && (
        <div className="pending-pin-info">
          🔌 Pin sélectionnée :{" "}
          <strong style={{ color: pendingPin.color }}>{pendingPin.pinName}</strong>
          {" "}— Cliquez sur une autre pin pour tracer le fil
        </div>
      )}

      {/* ── Barre de zoom (affichée en bas au centre) ── */}
      <div className="zoom-bar">
        <button onClick={() => {}} title="Zoom −" onMouseDown={(e) => { e.stopPropagation(); }}>
          −
        </button>
        <span>{zoom}%</span>
        <button onClick={() => {}} title="Zoom +" onMouseDown={(e) => { e.stopPropagation(); }}>
          +
        </button>
      </div>
    </main>
  );
}

export default EditorCanvas;