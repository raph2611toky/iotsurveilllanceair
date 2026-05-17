import { useMemo, useState } from "react";
import { componentsData, componentGroups } from "../data/componentsData";

function ComponentMiniVisual({ component }) {
  return (
    <div
      className={`component-mini component-mini-${component.type}`}
      style={{
        "--mini-color": component.chipColor || "#c9a227",
        "--mini-bg": component.chipBg || "#fff8df",
      }}
    >
      {component.type === "rpi5" && (
        <div className="mini-rpi">
          <div className="mini-gpio" />
          <div className="mini-chip big" />
          <div className="mini-chip small" />
          <div className="mini-usb u1" />
          <div className="mini-usb u2" />
        </div>
      )}

      {component.type === "breadboard" && (
        <div className="mini-breadboard">
          <div className="mini-rail red" />
          <div className="mini-rail blue" />
          <div className="mini-holes">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        </div>
      )}

      {component.type === "dht22" && (
        <div className="mini-dht">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      )}

      {(component.type === "mq135" || component.type === "mq2") && (
        <div className="mini-mq">
          <div className="mini-mq-metal" />
          <div className="mini-mq-pot" />
          <div className="mini-mq-pins" />
        </div>
      )}

      {component.type === "bmp280" && (
        <div className="mini-board blue">
          <div className="mini-chip center" />
          <div className="mini-pin-row" />
        </div>
      )}

      {component.type === "pir" && (
        <div className="mini-pir">
          <div className="mini-dome" />
        </div>
      )}

      {(component.type === "wifi" || component.type === "bluetooth") && (
        <div className="mini-wireless">
          <div className="mini-antenna" />
          <div className="mini-chip center" />
        </div>
      )}

      {component.type === "relay" && (
        <div className="mini-relay">
          <div className="mini-relay-box" />
          <div className="mini-terminal" />
        </div>
      )}

      {component.type === "buzzer" && (
        <div className="mini-buzzer">
          <div className="mini-buzzer-circle" />
        </div>
      )}

      {component.type === "fan" && (
        <div className="mini-fan">
          <div className="mini-fan-blades">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      {component.type === "cooler" && (
        <div className="mini-cooler">
          <div className="mini-cold-plate" />
          <span />
          <span />
        </div>
      )}

      {component.type === "oled" && (
        <div className="mini-oled">
          <div className="mini-screen" />
        </div>
      )}

      {(component.type === "res220" || component.type === "res10k") && (
        <div className="mini-resistor">
          <div className="mini-leg left" />
          <div className="mini-res-body">
            <span />
            <span />
            <span />
          </div>
          <div className="mini-leg right" />
        </div>
      )}

      {(component.type === "led_r" || component.type === "led_g") && (
        <div className={`mini-led ${component.type === "led_g" ? "green" : "red"}`}>
          <div className="mini-led-head" />
          <div className="mini-led-leg l1" />
          <div className="mini-led-leg l2" />
        </div>
      )}

      {component.type === "jumper" && (
        <div className="mini-jumper">
          <span className="j1" />
          <span className="j2" />
          <span className="j3" />
        </div>
      )}

      {component.type === "cap100" && (
        <div className="mini-cap">
          <div className="mini-cap-body" />
          <div className="mini-cap-leg l1" />
          <div className="mini-cap-leg l2" />
        </div>
      )}

      {component.type === "transistor" && (
        <div className="mini-transistor">
          <div className="mini-trans-head" />
          <span />
          <span />
          <span />
        </div>
      )}

      {component.type === "power" && (
        <div className="mini-power">
          <div className="mini-battery" />
        </div>
      )}

      {component.type === "gnd" && (
        <div className="mini-gnd">
          <span />
          <span />
          <span />
        </div>
      )}

      {(component.type === "pressure" || component.type === "soil") && (
        <div className={`mini-special mini-${component.type}`}>
          <div />
        </div>
      )}

      <strong className="mini-text">{component.emoji || "?"}</strong>
    </div>
  );
}

function LeftSidebar() {
  const [query, setQuery] = useState("");

  const allComponents = useMemo(() => {
    return Object.values(componentsData || {}).filter(Boolean);
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();

    const detectedGroups = Array.from(
      new Set(allComponents.map((component) => component.category).filter(Boolean))
    );

    const orderedGroups = [
      ...(Array.isArray(componentGroups) ? componentGroups : []),
      ...detectedGroups.filter(
        (group) => !(componentGroups || []).includes(group)
      ),
    ];

    return orderedGroups
      .map((group) => {
        const components = allComponents.filter((component) => {
          const matchGroup = component.category === group;

          const matchQuery =
            !q ||
            component.name?.toLowerCase().includes(q) ||
            component.category?.toLowerCase().includes(q) ||
            component.description?.toLowerCase().includes(q) ||
            component.type?.toLowerCase().includes(q);

          return matchGroup && matchQuery;
        });

        return { group, components };
      })
      .filter((entry) => entry.components.length > 0);
  }, [query, allComponents]);

  function handleDragStart(event, type) {
    event.dataTransfer.setData("componentType", type);
    event.dataTransfer.setData("comp", type);
    event.dataTransfer.effectAllowed = "copy";
  }

  return (
    <aside className="left-sidebar">
      <div className="search-box">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un composant..."
        />
      </div>

      <div className="component-list">
        {allComponents.length === 0 && (
          <div className="empty-component-list">
            Aucun composant chargé. Vérifie le fichier{" "}
            <strong>src/data/componentsData.js</strong>.
          </div>
        )}

        {groups.map(({ group, components }) => (
          <div key={group} className="component-category">
            <div className="category-title">{group}</div>

            {components.map((component) => (
              <div
                key={component.type}
                className="component-chip"
                draggable
                title={component.description}
                onDragStart={(event) => handleDragStart(event, component.type)}
              >
                <ComponentMiniVisual component={component} />

                <div className="chip-info">
                  <div className="chip-name">{component.name}</div>
                  <div className="chip-sub">
                    {component.description || component.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default LeftSidebar;