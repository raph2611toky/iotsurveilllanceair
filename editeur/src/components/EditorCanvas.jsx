import { useMemo, useRef, useState } from "react";
import { componentsData } from "../data/componentsData";
import ComponentVisual from "./ComponentVisual";

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2200;

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

function makePinKey(pinRef) {
  return `${pinRef.itemId}:${pinRef.pinName}`;
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

export default function EditorCanvas({
  items,
  setItems,
  wires,
  setWires,
  selectedId,
  setSelectedId,
  running,
  sensorData,
  zoom,
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

  const usedPinKeys = useMemo(() => {
    const keys = new Set();

    wires.forEach((wire) => {
      keys.add(makePinKey(wire.from));
      keys.add(makePinKey(wire.to));
    });

    return keys;
  }, [wires]);

  function getCanvasPoint(event) {
    const rect = canvasRef.current.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left - pan.x) / scale,
      y: (event.clientY - rect.top - pan.y) / scale,
    };
  }

  function makePinRef(item, pin) {
    return {
      itemId: item.id,
      itemType: item.type,
      pinName: pin.name,
      label: pin.label || pin.name,
      x: item.x + pin.x,
      y: item.y + pin.y,
      color: pin.color,
    };
  }

  function resolvePin(pinRef) {
    const item = items.find((current) => current.id === pinRef.itemId);
    if (!item) return pinRef;

    const component = componentsData[item.type];
    const pin = component?.pins?.find(
      (currentPin) => currentPin.name === pinRef.pinName
    );

    if (!pin) return pinRef;

    return {
      ...pinRef,
      x: item.x + pin.x,
      y: item.y + pin.y,
      label: pin.label || pin.name,
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
    };

    setItems((previous) => [...previous, newItem]);
    setSelectedId(newItem.id);
  }

  function startMoveItem(event, itemId) {
    if (!isLeftButton(event)) return;

    if (
      event.target.classList.contains("pin") ||
      event.target.classList.contains("delete-btn")
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
                  points: currentWire.points || createFlexiblePoints(newFrom, newTo),
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
    setHoveredPin((current) => {
      if (!current) return null;

      if (current.itemId === item.id && current.pinName === pin.name) {
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

  function addPointOnWire(event, wire) {
    event.preventDefault();
    event.stopPropagation();

    const point = getCanvasPoint(event);

    setWires((previous) =>
      previous.map((currentWire) => {
        if (currentWire.id !== wire.id) return currentWire;

        return {
          ...currentWire,
          points: [...(currentWire.points || []), point],
        };
      })
    );
  }

  function deleteSelected(id) {
    setItems((previous) => previous.filter((item) => item.id !== id));

    setWires((previous) =>
      previous.filter((wire) => wire.from.itemId !== id && wire.to.itemId !== id)
    );

    setSelectedId(null);
  }

  function handleCanvasClick(event) {
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

          const disabledPinNames = new Set();

          component.pins?.forEach((pin) => {
            const pinKey = `${item.id}:${pin.name}`;

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
              disabledPinNames.add(pin.name);
            }
          });

          return (
            <div
              key={item.id}
              className={selectedId === item.id ? "placed selected" : "placed"}
              style={{
                left: item.x,
                top: item.y,
                width: component.width,
                height: component.height,
              }}
              onMouseDown={(event) => {
                setSelectedId(item.id);
                startMoveItem(event, item.id);
              }}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedId(item.id);
              }}
            >
              {selectedId === item.id && (
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
              )}

              <ComponentVisual
                component={component}
                disabledPinNames={disabledPinNames}
                onPinMouseDown={(pin, event) =>
                  startWireFromPin(item, pin, event)
                }
                onPinMouseEnter={(pin) => handlePinMouseEnter(item, pin)}
                onPinMouseLeave={(pin) => handlePinMouseLeave(item, pin)}
                running={running}
                sensorData={sensorData}
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
                strokeWidth="26"
                fill="none"
                className="wire-hit-area"
                onMouseDown={(event) => startMoveWholeWire(event, wire)}
                onDoubleClick={(event) => addPointOnWire(event, wire)}
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
                onDoubleClick={(event) => addPointOnWire(event, wire)}
                onContextMenu={(event) => handleWireRightDoubleClick(event, wire.id)}
              />

              <circle
                cx={from.x}
                cy={from.y}
                r="7"
                fill={wire.color}
                className="wire-endpoint"
                onMouseDown={(event) => startRewireEndpoint(event, wire, "from")}
                onContextMenu={(event) => handleWireRightDoubleClick(event, wire.id)}
              />

              <circle
                cx={to.x}
                cy={to.y}
                r="7"
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
                      ? 8
                      : 6
                  }
                  fill="#fffdf5"
                  stroke={wire.color}
                  strokeWidth="2.5"
                  className="wire-point"
                  onMouseDown={(event) =>
                    startMoveWirePoint(event, wire, index)
                  }
                  onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    setWires((previous) =>
                      previous.map((currentWire) => {
                        if (currentWire.id !== wire.id) return currentWire;

                        return {
                          ...currentWire,
                          points: currentWire.points.filter(
                            (_, pointIndex) => pointIndex !== index
                          ),
                        };
                      })
                    );
                  }}
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
    </main>
  );
}