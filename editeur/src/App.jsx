import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

import Header from "./components/Header";
import LeftSidebar from "./components/LeftSidebar";
import EditorCanvas from "./components/EditorCanvas";
import RightSidebar from "./components/RightSidebar";
import PiConfigModal from "./components/PiConfigModal";
import { componentsData } from "./data/componentsData";

const SENSOR_TYPES = ["dht22", "mq135", "mq2", "bmp280", "pir", "pressure", "soil"];

const DEFAULT_SENSOR_CONFIGS = {
  dht22: { temperature: 28, humidity: 65, variation: 4 },
  mq135: { co2: 650, variation: 120 },
  mq2: { smoke: 80, variation: 60 },
  bmp280: { pressure: 1012, temperature: 27, variation: 8 },
  pir: { motion: false, variation: 1 },
  pressure: { pressure: 1013, variation: 20 },
  soil: { humidity: 55, variation: 12 },
};

const STORAGE_CURRENT_PROJECT = "iot-editor-current-project";
const STORAGE_PROJECT_PREFIX = "iot-editor-project-";

function randAround(base, variation, dec = 1) {
  const min = Number(base) - Number(variation);
  const max = Number(base) + Number(variation);
  return Number((Math.random() * (max - min) + min).toFixed(dec));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isSensor(type) {
  return SENSOR_TYPES.includes(type);
}

function createDefaultConfigFor(type) {
  return { ...(DEFAULT_SENSOR_CONFIGS[type] || {}) };
}

function generateSensorValue(type, config) {
  if (type === "dht22") {
    return {
      type,
      temperature: clamp(randAround(config.temperature ?? 28, config.variation ?? 4), -40, 80),
      humidity: clamp(randAround(config.humidity ?? 65, config.variation ?? 4), 0, 100),
      unit: "°C / %",
      timestamp: new Date().toISOString(),
    };
  }

  if (type === "mq135") {
    const co2 = clamp(randAround(config.co2 ?? 650, config.variation ?? 120, 0), 300, 2500);

    return {
      type,
      co2,
      airQuality: co2 > 1000 ? "mauvaise" : co2 > 800 ? "moyenne" : "bonne",
      unit: "ppm",
      timestamp: new Date().toISOString(),
    };
  }

  if (type === "mq2") {
    const smoke = clamp(randAround(config.smoke ?? 80, config.variation ?? 60, 0), 0, 1000);

    return {
      type,
      smoke,
      alert: smoke > 250,
      unit: "ppm",
      timestamp: new Date().toISOString(),
    };
  }

  if (type === "bmp280") {
    return {
      type,
      pressure: clamp(randAround(config.pressure ?? 1012, config.variation ?? 8, 0), 850, 1100),
      temperature: clamp(randAround(config.temperature ?? 27, 2, 1), -20, 80),
      unit: "hPa",
      timestamp: new Date().toISOString(),
    };
  }

  if (type === "pir") {
    const randomMotion = Math.random() > 0.65;

    return {
      type,
      motion: Boolean(config.motion) || randomMotion,
      label: Boolean(config.motion) || randomMotion ? "Mouvement" : "Calme",
      timestamp: new Date().toISOString(),
    };
  }

  if (type === "pressure") {
    return {
      type,
      pressure: clamp(randAround(config.pressure ?? 1013, config.variation ?? 20, 0), 500, 2000),
      unit: "hPa",
      timestamp: new Date().toISOString(),
    };
  }

  if (type === "soil") {
    return {
      type,
      humidity: clamp(randAround(config.humidity ?? 55, config.variation ?? 12, 1), 0, 100),
      unit: "%",
      timestamp: new Date().toISOString(),
    };
  }

  return {
    type,
    timestamp: new Date().toISOString(),
  };
}

function generateSensorDataByItem(items, sensorConfigs) {
  const result = {};

  items.forEach((item) => {
    if (!isSensor(item.type)) return;

    const config = sensorConfigs[item.id] || createDefaultConfigFor(item.type);
    result[item.id] = generateSensorValue(item.type, config);
  });

  return result;
}

function buildApiPayload(items, wires, sensorDataByItem) {
  const sensors = items
    .filter((item) => isSensor(item.type))
    .map((item) => ({
      itemId: item.id,
      type: item.type,
      name: componentsData[item.type]?.name || item.type,
      data: sensorDataByItem[item.id] || null,
    }));

  const raspberryPi = items.find((item) => item.type === "rpi5");

  return {
    source: "Raspberry Pi 5",
    raspberryPi: raspberryPi
      ? {
          itemId: raspberryPi.id,
          powered: Boolean(raspberryPi.powered),
        }
      : null,
    sensors,
    connections: wires.map((wire) => ({
      from: wire.from,
      to: wire.to,
      color: wire.color,
      points: wire.points || [],
    })),
    status: sensors.some((sensor) => sensor.data?.alert) ? "danger" : "normal",
    timestamp: new Date().toISOString(),
  };
}

function createInitialItems() {
  return [
    {
      id: "rpi-default",
      type: "rpi5",
      x: 440,
      y: 160,
      rotation: 0,
      powered: false,
    },
    {
      id: "breadboard-default",
      type: "breadboard",
      x: 380,
      y: 430,
      rotation: 0,
    },
    {
      id: "dht22-default",
      type: "dht22",
      x: 140,
      y: 150,
      rotation: 0,
    },
    {
      id: "mq135-default",
      type: "mq135",
      x: 140,
      y: 330,
      rotation: 0,
    },
  ];
}

function safeProjectName(name) {
  return name
    .trim()
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

export default function App() {
  const hasLoadedProject = useRef(false);

  const [items, setItems] = useState(createInitialItems);
  const [wires, setWires] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(100);

  const [running, setRunning] = useState(false);
  const [sensorConfigs, setSensorConfigs] = useState({});
  const [sensorDataByItem, setSensorDataByItem] = useState({});

  const [port, setPort] = useState("3001");
  const [apiUrl, setApiUrl] = useState("http://localhost:3001/api/iot/data");
  const [apiEnabled, setApiEnabled] = useState(false);
  const [logs, setLogs] = useState([]);

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const [piConfigItemId, setPiConfigItemId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState("");

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === selectedId) || null;
  }, [items, selectedId]);

  const piConfigItem = useMemo(() => {
    return items.find((item) => item.id === piConfigItemId) || null;
  }, [items, piConfigItemId]);

  useEffect(() => {
    const projectName = localStorage.getItem(STORAGE_CURRENT_PROJECT);

    if (!projectName) {
      hasLoadedProject.current = true;
      return;
    }

    const rawProject = localStorage.getItem(`${STORAGE_PROJECT_PREFIX}${projectName}`);

    if (!rawProject) {
      localStorage.removeItem(STORAGE_CURRENT_PROJECT);
      hasLoadedProject.current = true;
      return;
    }

    try {
      const project = JSON.parse(rawProject);

      setCurrentProjectName(project.name || projectName);
      setItems(Array.isArray(project.items) ? project.items : createInitialItems());
      setWires(Array.isArray(project.wires) ? project.wires : []);
      setSensorConfigs(project.sensorConfigs || {});
      setZoom(project.zoom || 100);
      setPort(project.port || "3001");
      setApiEnabled(Boolean(project.apiEnabled));
      setSelectedId(project.selectedId || null);
      setLeftCollapsed(Boolean(project.leftCollapsed));
      setRightCollapsed(Boolean(project.rightCollapsed));

      setLogs((previous) => [
        {
          id: Date.now(),
          status: "success",
          method: "LOAD",
          url: project.name || projectName,
          time: new Date().toLocaleTimeString(),
          message: "Projet rechargé automatiquement après actualisation.",
        },
        ...previous,
      ]);
    } catch {
      localStorage.removeItem(STORAGE_CURRENT_PROJECT);
      localStorage.removeItem(`${STORAGE_PROJECT_PREFIX}${projectName}`);
    } finally {
      hasLoadedProject.current = true;
    }
  }, []);

  useEffect(() => {
    setApiUrl(`http://localhost:${port}/api/iot/data`);
  }, [port]);

  useEffect(() => {
    setSensorConfigs((previous) => {
      const next = { ...previous };

      items.forEach((item) => {
        if (isSensor(item.type) && !next[item.id]) {
          next[item.id] = createDefaultConfigFor(item.type);
        }
      });

      Object.keys(next).forEach((itemId) => {
        if (!items.some((item) => item.id === itemId)) {
          delete next[itemId];
        }
      });

      return next;
    });
  }, [items]);

  useEffect(() => {
    setSensorDataByItem(generateSensorDataByItem(items, sensorConfigs));
  }, [sensorConfigs, items]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const nextData = generateSensorDataByItem(items, sensorConfigs);
      setSensorDataByItem(nextData);

      if (apiEnabled) {
        sendData(nextData, true);
      }
    }, 1600);

    return () => clearInterval(interval);
  }, [running, apiEnabled, apiUrl, items, sensorConfigs]);

  useEffect(() => {
    if (!hasLoadedProject.current) return;
    if (!currentProjectName) return;

    const timeout = setTimeout(() => {
      saveProject(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    items,
    wires,
    sensorConfigs,
    zoom,
    port,
    apiEnabled,
    selectedId,
    leftCollapsed,
    rightCollapsed,
    currentProjectName,
  ]);

  function buildProjectData(projectName = currentProjectName) {
    return {
      name: projectName,
      version: "1.0.0",
      savedAt: new Date().toISOString(),
      items,
      wires,
      sensorConfigs,
      zoom,
      port,
      apiEnabled,
      selectedId,
      leftCollapsed,
      rightCollapsed,
    };
  }

  function saveProject(showLog = true) {
    let projectName = currentProjectName;

    if (!projectName) {
      const name = window.prompt("Nom du projet :");
      if (!name) return;

      projectName = safeProjectName(name);

      if (!projectName) return;

      setCurrentProjectName(projectName);
      localStorage.setItem(STORAGE_CURRENT_PROJECT, projectName);
    }

    const data = buildProjectData(projectName);

    localStorage.setItem(STORAGE_CURRENT_PROJECT, projectName);
    localStorage.setItem(`${STORAGE_PROJECT_PREFIX}${projectName}`, JSON.stringify(data));

    if (showLog) {
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "success",
          method: "SAVE",
          url: projectName,
          time: new Date().toLocaleTimeString(),
          message: "État du projet sauvegardé. Il sera restauré après actualisation.",
        },
        ...previous,
      ]);
    }
  }

  function createNewProject() {
    const name = window.prompt("Nom du nouveau projet :");

    if (!name) return;

    const projectName = safeProjectName(name);

    if (!projectName) return;

    const initialItems = createInitialItems();

    const initialProject = {
      name: projectName,
      version: "1.0.0",
      savedAt: new Date().toISOString(),
      items: initialItems,
      wires: [],
      sensorConfigs: {},
      zoom: 100,
      port,
      apiEnabled: false,
      selectedId: null,
      leftCollapsed: false,
      rightCollapsed: false,
    };

    setCurrentProjectName(projectName);
    setItems(initialItems);
    setWires([]);
    setSelectedId(null);
    setZoom(100);
    setSensorConfigs({});
    setSensorDataByItem({});
    setApiEnabled(false);
    setLeftCollapsed(false);
    setRightCollapsed(false);
    setLogs((previous) => [
      {
        id: Date.now(),
        status: "success",
        method: "NEW",
        url: projectName,
        time: new Date().toLocaleTimeString(),
        message: "Nouveau projet créé et sauvegardé.",
      },
      ...previous,
    ]);

    localStorage.setItem(STORAGE_CURRENT_PROJECT, projectName);
    localStorage.setItem(`${STORAGE_PROJECT_PREFIX}${projectName}`, JSON.stringify(initialProject));
  }

  function updateSensorConfig(itemId, key, value) {
    setSensorConfigs((previous) => ({
      ...previous,
      [itemId]: {
        ...(previous[itemId] || {}),
        [key]: value,
      },
    }));
  }

  function toggleRpiPower(itemId) {
    setItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              powered: !item.powered,
            }
          : item
      )
    );
  }

  async function sendData(dataOverride = sensorDataByItem, automatic = false) {
    const payload = {
      ...buildApiPayload(items, wires, dataOverride),
      transmission: automatic ? "automatic" : "manual",
      apiUrl,
    };

    const logBase = {
      id: Date.now(),
      method: "POST",
      url: apiUrl,
      payload,
      time: new Date().toLocaleTimeString(),
    };

    try {
      await axios.post(apiUrl, payload);

      setLogs((previous) => [
        {
          ...logBase,
          status: "success",
          message: "Données envoyées avec succès",
        },
        ...previous,
      ]);
    } catch {
      setLogs((previous) => [
        {
          ...logBase,
          status: "error",
          message:
            "API non joignable. C’est normal si ton serveur externe n’est pas encore créé.",
        },
        ...previous,
      ]);
    }
  }

  function clearAll() {
    const confirmClear = window.confirm(
      "Voulez-vous vraiment vider l’éditeur ? Le projet courant sera sauvegardé vide."
    );

    if (!confirmClear) return;

    setItems([]);
    setWires([]);
    setSelectedId(null);
    setLogs((previous) => [
      {
        id: Date.now(),
        status: "blocked",
        method: "CLEAR",
        url: currentProjectName || "éditeur",
        time: new Date().toLocaleTimeString(),
        message: "Éditeur vidé. Cliquez sur Sauvegarder pour conserver cet état.",
      },
      ...previous,
    ]);
    setSensorConfigs({});
    setSensorDataByItem({});
    setPiConfigItemId(null);
  }

  function handleApplyPiConfig() {
    setLogs((previous) => [
      {
        id: Date.now(),
        status: "success",
        method: "UPLOAD",
        url: "Raspberry Pi 5 virtuel",
        time: new Date().toLocaleTimeString(),
        message: "Configuration téléversée virtuellement dans le Raspberry Pi 5.",
      },
      ...previous,
    ]);

    setPiConfigItemId(null);
  }

  if (piConfigItem) {
    return (
      <PiConfigModal
        item={piConfigItem}
        items={items}
        wires={wires}
        sensorConfigs={sensorConfigs}
        sensorDataByItem={sensorDataByItem}
        onClose={() => setPiConfigItemId(null)}
        onApply={handleApplyPiConfig}
      />
    );
  }

  const workspaceClassName = [
    "workspace",
    leftCollapsed ? "left-collapsed" : "",
    rightCollapsed ? "right-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="app-shell">
      <Header
        running={running}
        setRunning={setRunning}
        sendNow={() => sendData(sensorDataByItem, false)}
        clearAll={clearAll}
        port={port}
        setPort={setPort}
        zoom={zoom}
        setZoom={setZoom}
        apiEnabled={apiEnabled}
        setApiEnabled={setApiEnabled}
        currentProjectName={currentProjectName}
        onNewProject={createNewProject}
        onSaveProject={() => saveProject(true)}
      />

      <div className={workspaceClassName}>
        <div className="side-shell left-side-shell">
          <button
            className="sidebar-collapse-btn left"
            onClick={() => setLeftCollapsed((value) => !value)}
            title={leftCollapsed ? "Afficher les composants" : "Réduire le menu gauche"}
          >
            {leftCollapsed ? "›" : "‹"}
          </button>

          {!leftCollapsed && <LeftSidebar />}
        </div>

        <EditorCanvas
          items={items}
          setItems={setItems}
          wires={wires}
          setWires={setWires}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          running={running}
          sensorDataByItem={sensorDataByItem}
          zoom={zoom}
          toggleRpiPower={toggleRpiPower}
          openPiConfig={(itemId) => setPiConfigItemId(itemId)}
        />

        <div className="side-shell right-side-shell">
          <button
            className="sidebar-collapse-btn right"
            onClick={() => setRightCollapsed((value) => !value)}
            title={rightCollapsed ? "Afficher le panneau droit" : "Réduire le menu droit"}
          >
            {rightCollapsed ? "‹" : "›"}
          </button>

          {!rightCollapsed && (
            <RightSidebar
              selectedItem={selectedItem}
              items={items}
              wires={wires}
              sensorConfigs={sensorConfigs}
              sensorDataByItem={sensorDataByItem}
              updateSensorConfig={updateSensorConfig}
              running={running}
              logs={logs}
              apiUrl={apiUrl}
              apiEnabled={apiEnabled}
              setApiEnabled={setApiEnabled}
              openPiConfig={(itemId) => setPiConfigItemId(itemId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}