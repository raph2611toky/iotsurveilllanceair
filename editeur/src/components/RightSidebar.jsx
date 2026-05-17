import { useMemo, useState } from "react";
import { componentsData } from "../data/componentsData";

const SENSOR_TYPES = ["dht22", "mq135", "mq2", "bmp280", "pir", "pressure", "soil"];
const ACTUATOR_TYPES = ["led_r", "led_g", "relay", "buzzer", "fan", "cooler"];

function isSensor(type) {
  return SENSOR_TYPES.includes(type);
}

function isActuator(type) {
  return ACTUATOR_TYPES.includes(type);
}

function SensorConfigCard({ item, config, data, updateSensorConfig }) {
  const component = componentsData[item.type];

  function inputNumber(key, label, min, max, step = 1) {
    return (
      <label className="sim-input-line">
        <span>{label}</span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={config?.[key] ?? ""}
          onChange={(event) => updateSensorConfig(item.id, key, Number(event.target.value))}
        />
      </label>
    );
  }

  function criticalScenarioControls() {
    return (
      <div className="critical-scenario-box">
        <strong>Scénarios de simulation</strong>
        <p>Les pics critiques sont maintenant plus fréquents afin de tester rapidement les LEDs, le ventilateur, le refroidissement, le dashboard et les emails.</p>
        {inputNumber("warningChance", "Chance pré-critique (0 à 1)", 0, 1, 0.01)}
        {inputNumber("criticalChance", "Chance critique fréquente (0 à 1)", 0, 1, 0.01)}
      </div>
    );
  }

  return (
    <div className="sensor-config-card">
      <div className="sensor-config-head">
        <strong>{component?.name || item.type}</strong>
        <span>{item.id}</span>
      </div>

      {item.type === "dht22" && (
        <>
          {inputNumber("temperature", "Température simulée (°C)", -40, 80, 0.1)}
          {inputNumber("humidity", "Humidité simulée (%)", 0, 100, 0.1)}
          {inputNumber("variation", "Variation", 0, 30, 0.1)}
        </>
      )}

      {item.type === "mq135" && (
        <>
          {inputNumber("co2", "CO₂ simulé (ppm)", 300, 2500, 1)}
          {inputNumber("variation", "Variation", 0, 500, 1)}
        </>
      )}

      {item.type === "mq2" && (
        <>
          {inputNumber("smoke", "Fumée simulée (ppm)", 0, 1000, 1)}
          {inputNumber("variation", "Variation", 0, 300, 1)}
        </>
      )}

      {item.type === "bmp280" && (
        <>
          {inputNumber("pressure", "Pression simulée (hPa)", 850, 1100, 1)}
          {inputNumber("temperature", "Température simulée (°C)", -20, 80, 0.1)}
          {inputNumber("variation", "Variation pression", 0, 50, 1)}
        </>
      )}

      {item.type === "pressure" && (
        <>
          {inputNumber("pressure", "Pression simulée (hPa)", 500, 2000, 1)}
          {inputNumber("variation", "Variation", 0, 200, 1)}
        </>
      )}

      {item.type === "soil" && (
        <>
          {inputNumber("humidity", "Humidité du sol (%)", 0, 100, 0.1)}
          {inputNumber("variation", "Variation", 0, 30, 0.1)}
        </>
      )}

      {item.type === "pir" && (
        <label className="sim-input-line checkbox-line">
          <span>Mouvement forcé</span>
          <input
            type="checkbox"
            checked={Boolean(config?.motion)}
            onChange={(event) => updateSensorConfig(item.id, "motion", event.target.checked)}
          />
        </label>
      )}

      {!["pir", "pressure", "soil"].includes(item.type) && criticalScenarioControls()}

      <div className="sensor-live-preview">
        <span>Valeur actuelle</span>
        <pre>{JSON.stringify(data || {}, null, 2)}</pre>
      </div>
    </div>
  );
}

function ActuatorStatusCard({ item, data }) {
  const component = componentsData[item.type];
  const active = Boolean(data?.active);

  return (
    <div className={active ? "actuator-status-card on" : "actuator-status-card"}>
      <div className="actuator-status-head">
        <strong>{component?.name || item.type}</strong>
        <span className="actuator-state-pill">{active ? data?.label || "ON" : "OFF"}</span>
      </div>
      <p>{data?.reason || "En attente des conditions de réaction."}</p>
      <small>Intensité : {data?.intensity ?? 0}% · ID : {item.id}</small>
    </div>
  );
}

function ConnectionGuide({ wires }) {
  return (
    <div className="connection-guide">
      <h3>Liaisons actuelles</h3>
      {wires.length === 0 && <p>Aucune liaison pour le moment.</p>}
      {wires.map((wire) => (
        <div key={wire.id} className="connection-line">
          <span style={{ background: wire.color }} />
          <strong>{wire.from.pinName}</strong>
          <em>→</em>
          <strong>{wire.to.pinName}</strong>
        </div>
      ))}
    </div>
  );
}

function ApiTab({
  apiEnabled,
  setApiEnabled,
  projectApiHost,
  projectApiPort,
  projectApiBaseUrl,
  simulationEndpoint,
  currentProjectId,
  logs,
  running,
}) {
  return (
    <>
      <div className="panel-section">
        <h2>API Flask / SQLite</h2>

        <label className="switch-line">
          <span>Envoi automatique pendant la simulation</span>
          <input
            type="checkbox"
            checked={apiEnabled}
            onChange={(event) => setApiEnabled(event.target.checked)}
          />
        </label>

        <div className="api-config-grid">
          <span>Host</span>
          <strong>{projectApiHost}</strong>
          <span>Port</span>
          <strong>{projectApiPort}</strong>
          <span>Base</span>
          <strong>{projectApiBaseUrl}</strong>
        </div>

        <small>
          Cette API sert à la sauvegarde des projets et à la réception des informations
          complètes de simulation. Elle correspond au backend Flask dans dashboard/app.py.
        </small>
      </div>

      <div className="panel-section">
        <h2>Endpoint simulation</h2>
        <p className="muted">
          {currentProjectId
            ? "Les données complètes du projet sont envoyées ici pendant la simulation."
            : "Crée ou ouvre un projet avant l’envoi de simulation."}
        </p>
        <pre className="api-endpoint-box">POST {simulationEndpoint}</pre>
        <small>
          Payload envoyé : projet, composants, fils, capteurs, mesures, configuration,
          état du Raspberry Pi, timestamp et résumé de simulation.
        </small>
      </div>

      <div className="panel-section">
        <h2>État</h2>
        <div className={running ? "sim-status on" : "sim-status"}>
          {running ? "Simulation active" : "Simulation arrêtée"}
        </div>
        <div className={apiEnabled ? "sim-status on" : "sim-status"}>
          {apiEnabled ? "Transmission automatique active" : "Transmission automatique désactivée"}
        </div>
      </div>

      <div className="panel-section">
        <h2>Journal API</h2>
        <div className="api-log-list">
          {logs.length === 0 && <p>Aucune opération pour le moment.</p>}
          {logs.slice(0, 12).map((log) => (
            <div key={log.id} className={`api-log ${log.status}`}>
              <strong>{log.method} · {log.time}</strong>
              <small>{log.message}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function RightSidebar({
  selectedItem,
  items,
  wires,
  sensorConfigs,
  sensorDataByItem,
  actuatorDataByItem = {},
  updateSensorConfig,
  running,
  logs,
  projectApiHost,
  projectApiPort,
  projectApiBaseUrl,
  simulationEndpoint,
  currentProjectId,
  apiEnabled,
  setApiEnabled,
  openPiConfig,
}) {
  const [tab, setTab] = useState("simulation");

  const sensors = useMemo(() => items.filter((item) => isSensor(item.type)), [items]);
  const actuators = useMemo(() => items.filter((item) => isActuator(item.type)), [items]);

  return (
    <aside className="right-sidebar">
      <div className="rs-tabs">
        <button className={tab === "simulation" ? "rs-tab active" : "rs-tab"} onClick={() => setTab("simulation")}>Simulation</button>
        <button className={tab === "api" ? "rs-tab active" : "rs-tab"} onClick={() => setTab("api")}>API</button>
        <button className={tab === "info" ? "rs-tab active" : "rs-tab"} onClick={() => setTab("info")}>Info</button>
      </div>

      <div className="rs-body">
        {tab === "simulation" && (
          <>
            <div className="panel-section">
              <h2>Simulation réaliste</h2>
              <p>Configure les valeurs que les capteurs doivent détecter. Les animations autour des capteurs apparaissent seulement pendant la simulation.</p>
              <div className={running ? "sim-status on" : "sim-status"}>{running ? "Simulation active" : "Simulation arrêtée"}</div>
            </div>

            {sensors.length === 0 && (
              <div className="panel-section"><h2>Aucun capteur</h2><p>Ajoute un capteur dans l’éditeur.</p></div>
            )}

            {sensors.map((item) => (
              <SensorConfigCard
                key={item.id}
                item={item}
                config={sensorConfigs[item.id]}
                data={sensorDataByItem[item.id]}
                updateSensorConfig={updateSensorConfig}
              />
            ))}

            <div className="panel-section">
              <h2>Réactions automatiques</h2>
              <p>LED rouge = critique, LED verte = pré-critique. Le refroidissement démarre sur pic de température. Le ventilateur démarre sur détection gaz/fumée.</p>
              {actuators.length === 0 && <p>Aucun actionneur de réaction ajouté.</p>}
              {actuators.map((item) => (
                <ActuatorStatusCard
                  key={item.id}
                  item={item}
                  data={actuatorDataByItem[item.id]}
                />
              ))}
            </div>

            <div className="panel-section"><ConnectionGuide wires={wires} /></div>
          </>
        )}

        {tab === "api" && (
          <ApiTab
            apiEnabled={apiEnabled}
            setApiEnabled={setApiEnabled}
            projectApiHost={projectApiHost}
            projectApiPort={projectApiPort}
            projectApiBaseUrl={projectApiBaseUrl}
            simulationEndpoint={simulationEndpoint}
            currentProjectId={currentProjectId}
            logs={logs}
            running={running}
          />
        )}

        {tab === "info" && (
          <div className="panel-section">
            <h2>Élément sélectionné</h2>
            {!selectedItem && <p>Aucun élément sélectionné.</p>}
            {selectedItem && (
              <>
                <p><strong>{componentsData[selectedItem.type]?.name}</strong></p>
                <p>{componentsData[selectedItem.type]?.description}</p>
                {selectedItem.type === "rpi5" && (
                  <button className="send-btn" onClick={() => openPiConfig(selectedItem.id)}>Configurer le Raspberry Pi</button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
