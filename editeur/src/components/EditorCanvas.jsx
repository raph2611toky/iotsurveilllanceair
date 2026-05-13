import { useMemo, useRef, useState } from "react";
import { componentsData } from "../data/componentsData";
import ComponentVisual from "./ComponentVisual";

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2200;

function getPinUniqueKey(pin) {
  return (
    pin?.pinKey ||
    pin?.key ||
    pin?.id ||
    `pin-${pin?.number || pin?.pinName || pin?.name}-${pin?.localX ?? pin?.x}-${pin?.localY ?? pin?.y}`
  );
}

function makePinKey(pinRef) {
  return `${pinRef.itemId}:${getPinUniqueKey(pinRef)}`;
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function normalizeRotation(value) {
  return ((value % 360) + 360) % 360;
}

function getRotatedPoint(item, component, localX, localY) {
  const rotation = normalizeRotation(item.rotation || 0);

  if (rotation === 0) {
    return {
      x: item.x + localX,
      y: item.y + localY,
    };
  }

  const cx = component.width / 2;
  const cy = component.height / 2;

  const dx = localX - cx;
  const dy = localY - cy;

  const angle = degToRad(rotation);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;

  return {
    x: item.x + cx + rx,
    y: item.y + cy + ry,
  };
}

function chooseWireColor(fromPin, toPin, fallbackColor) {
  const text = `${fromPin} ${toPin}`.toUpperCase();

  if (text.includes("GND") || text.includes("−")) return "#222222";
  if (text.includes("5V") || text.includes("VCC") || text.includes("+")) return "#ff0000";
  if (text.includes("3.3V") || text.includes("3V3")) return "#ff7a30";
  if (text.includes("SDA") || text.includes("DATA") || text.includes("SIG")) return "#0055ff";
  if (text.includes("SCL")) return "#00aa00";
  if (text.includes("TX")) return "#aa00ff";
  if (text.includes("RX")) return "#ff00aa";
  if (text.includes("AOUT") || text.includes("A0")) return "#00aaff";
  if (text.includes("DOUT") || text.includes("D0")) return "#ffaa00";
  if (text.includes("IN")) return "#ff8800";
  if (text.includes("OUT")) return "#00ccaa";

  return fallbackColor || "#c9a227";
}

function makeWirePath(points) {
  if (points.length < 2) return "";

  if (points.length === 2) {
    const [from, to] = points;
    const dx = Math.abs(to.x - from.x);
    const c1 = { x: from.x + dx * 0.35, y: from.y };
    const c2 = { x: to.x - dx * 0.35, y: to.y };

    return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];

    const mid = {
      x: (current.x + next.x) / 2,
      y: (current.y + next.y) / 2,
    };

    path += ` Q ${current.x} ${current.y}, ${mid.x} ${mid.y}`;
  }

  const beforeLast = points[points.length - 2];
  const last = points[points.length - 1];

  path += ` Q ${beforeLast.x} ${beforeLast.y}, ${last.x} ${last.y}`;

  return path;
}

function createFlexiblePoints(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curve = Math.min(90, Math.max(35, distance * 0.14));

  return [
    {
      x: from.x + dx * 0.33,
      y: from.y + dy * 0.33 - curve,
    },
    {
      x: from.x + dx * 0.66,
      y: from.y + dy * 0.66 + curve,
    },
  ];
}

function isLeftButton(event) {
  return event.button === 0;
}

function isRightButton(event) {
  return event.button === 2;
}


function isVoltageName(value = "") {
  const text = String(value).toUpperCase();
  return (
    text.includes("VCC") ||
    text.includes("5V") ||
    text.includes("3V3") ||
    text.includes("3.3V") ||
    text === "+"
  );
}

function isGroundName(value = "") {
  const text = String(value).toUpperCase();
  return text.includes("GND") || text === "-" || text.includes("GROUND");
}

function getPinNodeId(itemId, pin) {
  return `${itemId}:${getPinUniqueKey(pin)}`;
}

function createUnionFind() {
  const parent = new Map();

  function find(x) {
    if (!parent.has(x)) parent.set(x, x);
    const px = parent.get(x);
    if (px !== x) parent.set(x, find(px));
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

  // Choix volontaire pour ton simulateur : A4, A7, A11 et A19 sont considérés
  // comme une même ligne électrique parce qu'ils appartiennent à la colonne A.
  const columnMatch = name.match(/^([A-J])(\d+)$/);
  if (columnMatch) return `COLUMN_${columnMatch[1]}`;

  return null;
}

function computePoweredItems(items, wires) {
  const uf = createUnionFind();
  const pinLookup = new Map();

  items.forEach((item) => {
    const component = componentsData[item.type];
    component?.pins?.forEach((pin) => {
      const nodeId = getPinNodeId(item.id, pin);
      uf.find(nodeId);
      pinLookup.set(nodeId, { item, pin });
    });
  });

  // Connexions électriques internes de la breadboard.
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

  const poweredRpiItems = items.filter((item) => item.type === "rpi5" && item.powered);
  const voltageSources = [];
  const groundSources = [];

  poweredRpiItems.forEach((rpi) => {
    const component = componentsData[rpi.type];
    component?.pins?.forEach((pin) => {
      const nodeId = getPinNodeId(rpi.id, pin);
      const text = `${pin.name} ${pin.label || ""}`;

      if (isVoltageName(text)) voltageSources.push(nodeId);
      if (isGroundName(text)) groundSources.push(nodeId);
    });
  });

  const poweredItemIds = new Set(poweredRpiItems.map((item) => item.id));

  items.forEach((item) => {
    if (item.type === "rpi5" || item.type === "breadboard") return;

    const component = componentsData[item.type];
    if (!component?.pins?.length) return;

    const itemVoltagePins = component.pins
      .filter((pin) => isVoltageName(`${pin.name} ${pin.label || ""}`))
      .map((pin) => getPinNodeId(item.id, pin));

    const itemGroundPins = component.pins
      .filter((pin) => isGroundName(`${pin.name} ${pin.label || ""}`))
      .map((pin) => getPinNodeId(item.id, pin));

    const hasVoltage = itemVoltagePins.some((itemNode) =>
      voltageSources.some((sourceNode) => uf.connected(itemNode, sourceNode))
    );

    const hasGround = itemGroundPins.some((itemNode) =>
      groundSources.some((sourceNode) => uf.connected(itemNode, sourceNode))
    );

    if (hasVoltage && hasGround) {
      poweredItemIds.add(item.id);
    }
  });

  return poweredItemIds;
}

function SensorSimulationEffect({ item, running, data }) {
  if (!running || !data) return null;

  if (item.type === "dht22") {
    return (
      <div className="sensor-effect humidity-effect">
        <span />
        <span />
        <span />
        <strong>{data.humidity}%</strong>
      </div>
    );
  }

  if (item.type === "mq135") {
    return (
      <div className="sensor-effect air-effect">
        <span />
        <span />
        <span />
        <strong>{data.co2} ppm</strong>
      </div>
    );
  }

  if (item.type === "mq2") {
    return (
      <div className={data.alert ? "sensor-effect smoke-effect alert" : "sensor-effect smoke-effect"}>
        <span />
        <span />
        <span />
        <strong>{data.smoke} ppm</strong>
      </div>
    );
  }

  if (item.type === "bmp280" || item.type === "pressure") {
    return (
      <div className="sensor-effect pressure-effect">
        <span />
        <span />
        <strong>{data.pressure} hPa</strong>
      </div>
    );
  }

  if (item.type === "soil") {
    return (
      <div className="sensor-effect soil-effect">
        <span />
        <span />
        <span />
        <strong>{data.humidity}%</strong>
      </div>
    );
  }

  if (item.type === "pir") {
    return (
      <div className={data.motion ? "sensor-effect pir-effect motion" : "sensor-effect pir-effect"}>
        <span />
        <strong>{data.label}</strong>
      </div>
    );
  }

  return null;
}

export default function EditorCanvas({
  items,
  setItems,
  wires,
  setWires,
  selectedId,
  setSelectedId,
  running,
  sensorDataByItem = {},
  zoom,
  toggleRpiPower,
  openPiConfig,
}) {
  const canvasRef = useRef(null);
  const rightClickMemory = useRef({ wireId: null, time: 0 });
  const scale = zoom / 100;

  const [hoveredPin, setHoveredPin] = useState(null);
  const [draftWire, setDraftWire] = useState(null);
  const [draggingWireId, setDraggingWireId] = useState(null);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [rewiring, setRewiring] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);

  const usedPinKeys = useMemo(() => {
    const keys = new Set();

    wires.forEach((wire) => {
      keys.add(makePinKey(wire.from));
      keys.add(makePinKey(wire.to));
    });

    return keys;
  }, [wires]);

  const poweredItemIds = useMemo(() => {
    return computePoweredItems(items, wires);
  }, [items, wires]);

  function getCanvasPoint(event) {
    const rect = canvasRef.current.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left - pan.x) / scale,
      y: (event.clientY - rect.top - pan.y) / scale,
    };
  }

  function makePinRef(item, pin) {
    const component = componentsData[item.type];
    const pinKey = getPinUniqueKey(pin);
    const position = getRotatedPoint(item, component, pin.x, pin.y);

    return {
      itemId: item.id,
      itemType: item.type,
      pinKey,
      pinNumber: pin.number || null,
      pinName: pin.name,
      name: pin.name,
      label: pin.label || pin.name,
      localX: pin.x,
      localY: pin.y,
      x: position.x,
      y: position.y,
      color: pin.color,
    };
  }

  function resolvePin(pinRef) {
    const item = items.find((current) => current.id === pinRef.itemId);
    if (!item) return pinRef;

    const component = componentsData[item.type];
    if (!component?.pins) return pinRef;

    let pin = null;

    if (pinRef.pinKey) {
      pin = component.pins.find(
        (currentPin) => getPinUniqueKey(currentPin) === pinRef.pinKey
      );
    }

    if (!pin && pinRef.pinNumber) {
      pin = component.pins.find(
        (currentPin) => currentPin.number === pinRef.pinNumber
      );
    }

    if (!pin && pinRef.localX !== undefined && pinRef.localY !== undefined) {
      pin = component.pins.find(
        (currentPin) =>
          Number(currentPin.x) === Number(pinRef.localX) &&
          Number(currentPin.y) === Number(pinRef.localY)
      );
    }

    if (!pin) return pinRef;

    const position = getRotatedPoint(item, component, pin.x, pin.y);

    return {
      ...pinRef,
      pinKey: getPinUniqueKey(pin),
      pinNumber: pin.number || null,
      pinName: pin.name,
      name: pin.name,
      label: pin.label || pin.name,
      localX: pin.x,
      localY: pin.y,
      x: position.x,
      y: position.y,
      color: pin.color,
    };
  }

  function handleDrop(event) {
    event.preventDefault();

    const componentType =
      event.dataTransfer.getData("componentType") ||
      event.dataTransfer.getData("comp");

    if (!componentType || !componentsData[componentType]) return;

    const component = componentsData[componentType];
    const point = getCanvasPoint(event);

    const newItem = {
      id: `${componentType}-${Date.now()}`,
      type: componentType,
      x: point.x - component.width / 2,
      y: point.y - component.height / 2,
      rotation: 0,
      powered: componentType === "rpi5" ? false : undefined,
    };

    setItems((previous) => [...previous, newItem]);
    setSelectedId(newItem.id);
  }

  function startMoveItem(event, itemId) {
    if (!isLeftButton(event)) return;

    if (
      event.target.classList.contains("pin") ||
      event.target.classList.contains("delete-btn") ||
      event.target.classList.contains("rpi-power-toggle") ||
      event.target.classList.contains("rotate-handle")
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const startPoint = getCanvasPoint(event);
    const current = items.find((item) => item.id === itemId);
    if (!current) return;

    function onMove(moveEvent) {
      const movePoint = getCanvasPoint(moveEvent);
      const dx = movePoint.x - startPoint.x;
      const dy = movePoint.y - startPoint.y;

      setItems((previous) =>
        previous.map((item) =>
          item.id === itemId
            ? {
                ...item,
                x: current.x + dx,
                y: current.y + dy,
              }
            : item
        )
      );
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function rotateItem(itemId) {
    setItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              rotation: normalizeRotation((item.rotation || 0) + 45),
            }
          : item
      )
    );
  }

  function startPanCanvas(event) {
    if (!isLeftButton(event)) return;

    const isCanvas =
      event.target === canvasRef.current ||
      event.target.classList.contains("canvas-grid");

    if (!isCanvas) return;

    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const initialPan = { ...pan };

    function onMove(moveEvent) {
      setPan({
        x: initialPan.x + (moveEvent.clientX - startX),
        y: initialPan.y + (moveEvent.clientY - startY),
      });
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startWireFromPin(item, pin, event) {
    if (!isLeftButton(event)) return;

    const from = makePinRef(item, pin);
    const fromKey = makePinKey(from);

    if (usedPinKeys.has(fromKey)) return;

    event.preventDefault();
    event.stopPropagation();

    const point = getCanvasPoint(event);

    setDraftWire({
      from,
      to: point,
    });

    function onMove(moveEvent) {
      const movePoint = getCanvasPoint(moveEvent);

      setDraftWire((previous) => {
        if (!previous) return null;

        return {
          ...previous,
          to: movePoint,
        };
      });
    }

    function onUp() {
      setDraftWire((currentDraft) => {
        if (!currentDraft) return null;

        setHoveredPin((currentHovered) => {
          if (!currentHovered) return currentHovered;

          const toKey = makePinKey(currentHovered);
          const fromDraftKey = makePinKey(currentDraft.from);

          const samePin = toKey === fromDraftKey;
          const targetAlreadyUsed = usedPinKeys.has(toKey);
          const sourceAlreadyUsed = usedPinKeys.has(fromDraftKey);

          if (!samePin && !targetAlreadyUsed && !sourceAlreadyUsed) {
            const to = currentHovered;

            const color = chooseWireColor(
              currentDraft.from.pinName,
              to.pinName,
              to.color
            );

            const newWire = {
              id: `wire-${Date.now()}`,
              from: currentDraft.from,
              to,
              color,
              points: createFlexiblePoints(currentDraft.from, to),
            };

            setWires((previous) => [...previous, newWire]);
          }

          return currentHovered;
        });

        return null;
      });

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startRewireEndpoint(event, wire, endpoint) {
    if (!isLeftButton(event)) return;

    event.preventDefault();
    event.stopPropagation();

    const fixedPin = endpoint === "from" ? resolvePin(wire.to) : resolvePin(wire.from);
    const movingPin = endpoint === "from" ? resolvePin(wire.from) : resolvePin(wire.to);

    setRewiring({
      wireId: wire.id,
      endpoint,
      fixedPin,
      movingPin,
      cursor: movingPin,
      color: wire.color,
    });

    function onMove(moveEvent) {
      const movePoint = getCanvasPoint(moveEvent);

      setRewiring((previous) => {
        if (!previous) return null;

        return {
          ...previous,
          cursor: movePoint,
        };
      });
    }

    function onUp() {
      setRewiring((currentRewire) => {
        if (!currentRewire) return null;

        setHoveredPin((currentHovered) => {
          if (!currentHovered) return currentHovered;

          const targetKey = makePinKey(currentHovered);
          const fixedKey = makePinKey(currentRewire.fixedPin);

          const pinUsedByOtherWire = wires.some((currentWire) => {
            if (currentWire.id === currentRewire.wireId) return false;

            return (
              makePinKey(currentWire.from) === targetKey ||
              makePinKey(currentWire.to) === targetKey
            );
          });

          if (targetKey !== fixedKey && !pinUsedByOtherWire) {
            setWires((previous) =>
              previous.map((currentWire) => {
                if (currentWire.id !== currentRewire.wireId) return currentWire;

                const newFrom =
                  currentRewire.endpoint === "from"
                    ? currentHovered
                    : currentWire.from;

                const newTo =
                  currentRewire.endpoint === "to"
                    ? currentHovered
                    : currentWire.to;

                return {
                  ...currentWire,
                  from: newFrom,
                  to: newTo,
                  color: chooseWireColor(
                    newFrom.pinName,
                    newTo.pinName,
                    currentWire.color
                  ),
                };
              })
            );
          }

          return currentHovered;
        });

        return null;
      });

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handlePinMouseEnter(item, pin) {
    setHoveredPin(makePinRef(item, pin));
  }

  function handlePinMouseLeave(item, pin) {
    const leavingPin = makePinRef(item, pin);

    setHoveredPin((current) => {
      if (!current) return null;

      if (makePinKey(current) === makePinKey(leavingPin)) {
        return null;
      }

      return current;
    });
  }

  function deleteWire(wireId) {
    setWires((previous) => previous.filter((wire) => wire.id !== wireId));
  }

  function handleWireRightDoubleClick(event, wireId) {
    if (!isRightButton(event)) return;

    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    const last = rightClickMemory.current;

    if (last.wireId === wireId && now - last.time <= 450) {
      deleteWire(wireId);
      rightClickMemory.current = { wireId: null, time: 0 };
      return;
    }

    rightClickMemory.current = { wireId, time: now };
  }

  function startMoveWholeWire(event, wire) {
    if (!isLeftButton(event)) return;

    event.preventDefault();
    event.stopPropagation();

    const startPoint = getCanvasPoint(event);
    const initialPoints = wire.points || [];

    setDraggingWireId(wire.id);

    function onMove(moveEvent) {
      const movePoint = getCanvasPoint(moveEvent);
      const dx = movePoint.x - startPoint.x;
      const dy = movePoint.y - startPoint.y;

      setWires((previous) =>
        previous.map((currentWire) =>
          currentWire.id === wire.id
            ? {
                ...currentWire,
                points: initialPoints.map((point) => ({
                  x: point.x + dx,
                  y: point.y + dy,
                })),
              }
            : currentWire
        )
      );
    }

    function onUp() {
      setDraggingWireId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startMoveWirePoint(event, wire, pointIndex) {
    if (!isLeftButton(event)) return;

    event.preventDefault();
    event.stopPropagation();

    const startPoint = getCanvasPoint(event);
    const initialPoint = wire.points[pointIndex];

    setDraggingPoint({
      wireId: wire.id,
      pointIndex,
    });

    function onMove(moveEvent) {
      const movePoint = getCanvasPoint(moveEvent);
      const dx = movePoint.x - startPoint.x;
      const dy = movePoint.y - startPoint.y;

      setWires((previous) =>
        previous.map((currentWire) => {
          if (currentWire.id !== wire.id) return currentWire;

          const points = [...(currentWire.points || [])];

          points[pointIndex] = {
            x: initialPoint.x + dx,
            y: initialPoint.y + dy,
          };

          return {
            ...currentWire,
            points,
          };
        })
      );
    }

    function onUp() {
      setDraggingPoint(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function deleteSelected(id) {
    setItems((previous) => previous.filter((item) => item.id !== id));

    setWires((previous) =>
      previous.filter((wire) => wire.from.itemId !== id && wire.to.itemId !== id)
    );

    setSelectedId(null);
  }

  function handleContextMenu(event, item) {
    event.preventDefault();
    event.stopPropagation();

    if (item.type !== "rpi5") return;

    setContextMenu({
      itemId: item.id,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleCanvasClick(event) {
    setContextMenu(null);

    const isCanvas =
      event.target === canvasRef.current ||
      event.target.classList.contains("canvas-grid");

    if (isCanvas) {
      setSelectedId(null);
    }
  }

  const transformStyle = {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
    transformOrigin: "top left",
  };

  return (
    <main
      ref={canvasRef}
      className="canvas"
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onMouseDown={startPanCanvas}
      onClick={handleCanvasClick}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="canvas-grid"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {items.length === 0 && (
        <div className="empty-canvas">
          <div className="empty-icon">+</div>
          <strong>Glisse les composants ici</strong>
          <span>Raspberry Pi 5, capteurs, breadboard, alimentation...</span>
        </div>
      )}

      <div className="canvas-layer" style={transformStyle}>
        {items.map((item) => {
          const component = componentsData[item.type];
          if (!component) return null;

          const disabledPinKeys = new Set();

          component.pins?.forEach((pin) => {
            const pinKey = `${item.id}:${getPinUniqueKey(pin)}`;

            const usedByThisRewiring =
              rewiring &&
              rewiring.wireId &&
              wires.some((wire) => {
                if (wire.id !== rewiring.wireId) return false;

                if (rewiring.endpoint === "from") {
                  return makePinKey(wire.from) === pinKey;
                }

                if (rewiring.endpoint === "to") {
                  return makePinKey(wire.to) === pinKey;
                }

                return false;
              });

            if (usedPinKeys.has(pinKey) && !usedByThisRewiring) {
              disabledPinKeys.add(getPinUniqueKey(pin));
            }
          });

          const itemSensorData = sensorDataByItem[item.id];

          return (
            <div
              key={item.id}
              className={selectedId === item.id ? "placed selected" : "placed"}
              style={{
                left: item.x,
                top: item.y,
                width: component.width,
                height: component.height,
                transform: `rotate(${item.rotation || 0}deg)`,
                transformOrigin: "center center",
              }}
              onMouseDown={(event) => {
                setSelectedId(item.id);
                startMoveItem(event, item.id);
              }}
              onContextMenu={(event) => handleContextMenu(event, item)}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedId(item.id);
              }}
            >
              {selectedId === item.id && (
                <>
                  <button
                    className="delete-btn"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteSelected(item.id);
                    }}
                  >
                    ×
                  </button>

                  <button
                    className="rotate-handle rotate-once"
                    title="Rotation +45°"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      rotateItem(item.id);
                    }}
                  >
                    ⟳
                  </button>
                </>
              )}

              {item.type === "rpi5" && (
                <button
                  className={item.powered ? "rpi-power-toggle on" : "rpi-power-toggle"}
                  title={item.powered ? "Éteindre le Raspberry Pi" : "Allumer le Raspberry Pi"}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleRpiPower(item.id);
                  }}
                >
                  ⏻
                </button>
              )}

              <SensorSimulationEffect
                item={item}
                running={running}
                data={itemSensorData}
              />

              <ComponentVisual
                component={component}
                disabledPinKeys={disabledPinKeys}
                onPinMouseDown={(pin, event) =>
                  startWireFromPin(item, pin, event)
                }
                onPinMouseEnter={(pin) => handlePinMouseEnter(item, pin)}
                onPinMouseLeave={(pin) => handlePinMouseLeave(item, pin)}
                running={running}
                sensorData={itemSensorData}
                powered={item.type === "rpi5" ? Boolean(item.powered) : poweredItemIds.has(item.id)}
              />
            </div>
          );
        })}
      </div>

      <svg className="wire-svg" style={transformStyle}>
        {wires.map((wire) => {
          const from = resolvePin(wire.from);
          const to = resolvePin(wire.to);
          const points = [from, ...(wire.points || []), to];
          const path = makeWirePath(points);

          return (
            <g
              key={wire.id}
              className={
                draggingWireId === wire.id
                  ? "wire-group moving"
                  : "wire-group"
              }
            >
              <path
                d={path}
                stroke="transparent"
                strokeWidth="34"
                fill="none"
                className="wire-hit-area"
                onMouseDown={(event) => startMoveWholeWire(event, wire)}
                onContextMenu={(event) => handleWireRightDoubleClick(event, wire.id)}
              />

              <path
                d={path}
                stroke={wire.color}
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="wire-path"
                onMouseDown={(event) => startMoveWholeWire(event, wire)}
                onContextMenu={(event) => handleWireRightDoubleClick(event, wire.id)}
              />

              <circle
                cx={from.x}
                cy={from.y}
                r="8"
                fill={wire.color}
                className="wire-endpoint"
                onMouseDown={(event) => startRewireEndpoint(event, wire, "from")}
                onContextMenu={(event) => handleWireRightDoubleClick(event, wire.id)}
              />

              <circle
                cx={to.x}
                cy={to.y}
                r="8"
                fill={wire.color}
                className="wire-endpoint"
                onMouseDown={(event) => startRewireEndpoint(event, wire, "to")}
                onContextMenu={(event) => handleWireRightDoubleClick(event, wire.id)}
              />

              {(wire.points || []).map((point, index) => (
                <circle
                  key={`${wire.id}-point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={
                    draggingPoint?.wireId === wire.id &&
                    draggingPoint?.pointIndex === index
                      ? 9
                      : 7
                  }
                  fill="#fffdf5"
                  stroke={wire.color}
                  strokeWidth="2.5"
                  className="wire-point"
                  onMouseDown={(event) =>
                    startMoveWirePoint(event, wire, index)
                  }
                />
              ))}
            </g>
          );
        })}

        {draftWire && (
          <g className="wire-preview">
            <path
              d={makeWirePath([draftWire.from, draftWire.to])}
              stroke={draftWire.from.color || "#c9a227"}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 6"
            />

            <circle
              cx={draftWire.from.x}
              cy={draftWire.from.y}
              r="5"
              fill={draftWire.from.color || "#c9a227"}
            />

            <circle
              cx={draftWire.to.x}
              cy={draftWire.to.y}
              r="5"
              fill={draftWire.from.color || "#c9a227"}
            />
          </g>
        )}

        {rewiring && (
          <g className="wire-preview">
            <path
              d={makeWirePath([rewiring.fixedPin, rewiring.cursor])}
              stroke={rewiring.color || "#c9a227"}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 6"
            />

            <circle
              cx={rewiring.fixedPin.x}
              cy={rewiring.fixedPin.y}
              r="5"
              fill={rewiring.color || "#c9a227"}
            />

            <circle
              cx={rewiring.cursor.x}
              cy={rewiring.cursor.y}
              r="5"
              fill={rewiring.color || "#c9a227"}
            />
          </g>
        )}
      </svg>

      {contextMenu && (
        <div
          className="rpi-context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => {
              openPiConfig(contextMenu.itemId);
              setContextMenu(null);
            }}
          >
            Configurer
          </button>

          <button
            className="danger"
            onClick={() => {
              deleteSelected(contextMenu.itemId);
              setContextMenu(null);
            }}
          >
            Supprimer
          </button>
        </div>
      )}
    </main>
  );
}