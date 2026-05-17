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

const DEFAULT_PROJECT_API_HOST = import.meta.env.VITE_API_HOST || "127.0.0.1";
const DEFAULT_PROJECT_API_PORT = import.meta.env.VITE_API_PORT || "5000";
const ENV_ACTIVE_PROJECT_ID = import.meta.env.VITE_ACTIVE_PROJECT_ID || import.meta.env.VITE_PROJECT_ID || "";
const STORAGE_CURRENT_PROJECT_ID = "iot-editor-current-project-id";
const STORAGE_CURRENT_PROJECT_NAME = "iot-editor-current-project-name";
const STORAGE_RPI_CODE = "iot-editor-rpi-code";

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

  return { type, timestamp: new Date().toISOString() };
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
      ? { itemId: raspberryPi.id, powered: Boolean(raspberryPi.powered) }
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
    { id: "rpi-default", type: "rpi5", x: 440, y: 160, rotation: 0, powered: false },
    { id: "breadboard-default", type: "breadboard", x: 380, y: 430, rotation: 0 },
    { id: "dht22-default", type: "dht22", x: 140, y: 150, rotation: 0 },
    { id: "mq135-default", type: "mq135", x: 140, y: 330, rotation: 0 },
  ];
}

function safeProjectName(name) {
  return name
    .trim()
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function buildProjectApiBaseUrl(host, portValue) {
  const cleanHost = String(host || DEFAULT_PROJECT_API_HOST).trim().replace(/\/$/, "");
  const hasProtocol = /^https?:\/\//i.test(cleanHost);
  const baseHost = hasProtocol ? cleanHost : `http://${cleanHost}`;
  const cleanPort = String(portValue || "").trim();

  if (!cleanPort) {
    return `${baseHost}/api`;
  }

  return `${baseHost}:${cleanPort}/api`;
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

  const [projectApiHost, setProjectApiHost] = useState(DEFAULT_PROJECT_API_HOST);
  const [port, setPort] = useState(DEFAULT_PROJECT_API_PORT);
  const [apiUrl, setApiUrl] = useState(`http://${DEFAULT_PROJECT_API_HOST}:${DEFAULT_PROJECT_API_PORT}/api`);
  const [apiEnabled, setApiEnabled] = useState(false);
  const [logs, setLogs] = useState([]);

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [piConfigItemId, setPiConfigItemId] = useState(null);

  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState("");
  const [raspberryPiCode, setRaspberryPiCode] = useState(() => localStorage.getItem(STORAGE_RPI_CODE) || "");
  const [projectApiReady, setProjectApiReady] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === selectedId) || null;
  }, [items, selectedId]);

  const piConfigItem = useMemo(() => {
    return items.find((item) => item.id === piConfigItemId) || null;
  }, [items, piConfigItemId]);

  const projectApiBaseUrl = buildProjectApiBaseUrl(projectApiHost, port);
  const simulationEndpoint = currentProjectId
    ? `${projectApiBaseUrl}/projects/${currentProjectId}/simulation-data`
    : `${projectApiBaseUrl}/projects/<id>/simulation-data`;

  useEffect(() => {
    bootProjectSystem();
  }, []);

  async function bootProjectSystem() {
    try {
      await axios.get(`${projectApiBaseUrl}/health`);
      setProjectApiReady(true);

      const [projectsResponse, editorEnvResponse] = await Promise.all([
        axios.get(`${projectApiBaseUrl}/projects`),
        axios.get(`${projectApiBaseUrl}/editor-env`).catch(() => ({ data: {} })),
      ]);

      setProjects(projectsResponse.data || []);

      const savedProjectId =
        localStorage.getItem(STORAGE_CURRENT_PROJECT_ID) ||
        editorEnvResponse.data?.activeProjectId ||
        ENV_ACTIVE_PROJECT_ID ||
        "";

      const savedProjectName =
        localStorage.getItem(STORAGE_CURRENT_PROJECT_NAME) ||
        editorEnvResponse.data?.activeProjectName ||
        "";

      if (savedProjectId) {
        await loadProjectById(Number(savedProjectId), false);
      } else if (savedProjectName) {
        setCurrentProjectName(savedProjectName);
      }
    } catch {
      setProjectApiReady(false);
      setCurrentProjectName(localStorage.getItem(STORAGE_CURRENT_PROJECT_NAME) || "");
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "error",
          method: "DB",
          url: projectApiBaseUrl,
          time: new Date().toLocaleTimeString(),
          message: "Backend Flask non joignable. Lance dashboard/app.py pour charger/sauvegarder les projets.",
        },
        ...previous,
      ]);
    } finally {
      hasLoadedProject.current = true;
    }
  }

  async function persistActiveProject(projectId, projectName) {
    if (!projectId) return;

    localStorage.setItem(STORAGE_CURRENT_PROJECT_ID, String(projectId));
    localStorage.setItem(STORAGE_CURRENT_PROJECT_NAME, projectName || "");

    try {
      await axios.post(`${projectApiBaseUrl}/editor-env`, {
        activeProjectId: Number(projectId),
        activeProjectName: projectName || "",
      });
    } catch {
      // localStorage reste la source de secours si le backend est arrêté.
    }
  }

  function applyProjectData(project) {
    const data = project.data || {};

    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name || data.name || "");
    setItems(Array.isArray(data.items) ? data.items : createInitialItems());
    setWires(Array.isArray(data.wires) ? data.wires : []);
    setSensorConfigs(data.sensorConfigs || {});
    setZoom(data.zoom || 100);
    setProjectApiHost(data.projectApiHost || DEFAULT_PROJECT_API_HOST);
    setPort(data.port || DEFAULT_PROJECT_API_PORT);
    setApiEnabled(Boolean(data.apiEnabled));
    setSelectedId(data.selectedId || null);
    setLeftCollapsed(Boolean(data.leftCollapsed));
    setRightCollapsed(Boolean(data.rightCollapsed));
    setRaspberryPiCode(data.raspberryPiCode || localStorage.getItem(STORAGE_RPI_CODE) || "");

    persistActiveProject(project.id, project.name || data.name || "");
  }

  async function loadProjectById(projectId, showLog = true) {
    if (!projectId) return;

    setIsLoadingProject(true);

    try {
      const response = await axios.get(`${projectApiBaseUrl}/projects/${projectId}`);
      applyProjectData(response.data);

      try {
        const codeResponse = await axios.get(`${projectApiBaseUrl}/projects/${projectId}/raspberry-code`);
        if (codeResponse.data?.code) {
          setRaspberryPiCode(codeResponse.data.code);
          localStorage.setItem(STORAGE_RPI_CODE, codeResponse.data.code);
        }
      } catch {
        // Le code peut ne pas encore exister pour ce projet.
      }

      if (showLog) {
        setLogs((previous) => [
          {
            id: Date.now(),
            status: "success",
            method: "LOAD",
            url: response.data.name,
            time: new Date().toLocaleTimeString(),
            message: "Projet chargé depuis SQLite.",
          },
          ...previous,
        ]);
      }
    } catch {
      localStorage.removeItem(STORAGE_CURRENT_PROJECT_ID);
      setCurrentProjectId(null);
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "error",
          method: "LOAD",
          url: `Projet ${projectId}`,
          time: new Date().toLocaleTimeString(),
          message: "Impossible de charger ce projet depuis SQLite.",
        },
        ...previous,
      ]);
    } finally {
      setIsLoadingProject(false);
    }
  }

  useEffect(() => {
    setApiUrl(projectApiBaseUrl);
  }, [projectApiBaseUrl]);

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
  }, [running, apiEnabled, projectApiBaseUrl, currentProjectId, items, sensorConfigs]);

  useEffect(() => {
    if (!hasLoadedProject.current) return;
    if (isLoadingProject) return;
    if (!currentProjectId) return;
    if (!projectApiReady) return;

    const timeout = setTimeout(() => {
      saveProject(false);
    }, 650);

    return () => clearTimeout(timeout);
  }, [
    items,
    wires,
    sensorConfigs,
    zoom,
    projectApiHost,
    port,
    apiEnabled,
    selectedId,
    leftCollapsed,
    rightCollapsed,
    currentProjectId,
    projectApiReady,
    isLoadingProject,
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
      projectApiHost,
      port,
      apiEnabled,
      selectedId,
      leftCollapsed,
      rightCollapsed,
      raspberryPiCode,
    };
  }

  async function refreshProjectList() {
    try {
      const response = await axios.get(`${projectApiBaseUrl}/projects`);
      setProjects(response.data || []);
    } catch {
      setProjectApiReady(false);
    }
  }

  async function saveProject(showLog = true) {
    if (!projectApiReady) {
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "error",
          method: "SAVE",
          url: projectApiBaseUrl,
          time: new Date().toLocaleTimeString(),
          message: "Sauvegarde impossible : backend Flask non lancé.",
        },
        ...previous,
      ]);
      return;
    }

    let projectId = currentProjectId;
    let projectName = currentProjectName;

    if (!projectId) {
      const name = window.prompt("Nom du projet :");
      if (!name) return;
      projectName = safeProjectName(name);
      if (!projectName) return;

      const response = await axios.post(`${projectApiBaseUrl}/projects`, {
        name: projectName,
        data: buildProjectData(projectName),
      });

      projectId = response.data.id;
      setCurrentProjectId(projectId);
      setCurrentProjectName(response.data.name);
      await persistActiveProject(projectId, response.data.name);
      await refreshProjectList();
    } else {
      await axios.put(`${projectApiBaseUrl}/projects/${projectId}`, {
        name: projectName,
        data: buildProjectData(projectName),
      });
    }

    if (showLog) {
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "success",
          method: "SAVE",
          url: projectName,
          time: new Date().toLocaleTimeString(),
          message: "Projet sauvegardé dans SQLite.",
        },
        ...previous,
      ]);
    }
  }

  async function createNewProject() {
    if (!projectApiReady) {
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "error",
          method: "NEW",
          url: projectApiBaseUrl,
          time: new Date().toLocaleTimeString(),
          message: "Création impossible : lance d’abord dashboard/app.py.",
        },
        ...previous,
      ]);
      return;
    }

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
      projectApiHost,
      port,
      apiEnabled: false,
      selectedId: null,
      leftCollapsed: false,
      rightCollapsed: false,
      raspberryPiCode: "",
    };

    try {
      const response = await axios.post(`${projectApiBaseUrl}/projects`, {
        name: projectName,
        data: initialProject,
      });

      setCurrentProjectId(response.data.id);
      setCurrentProjectName(response.data.name);
      setItems(initialItems);
      setWires([]);
      setSelectedId(null);
      setZoom(100);
      setSensorConfigs({});
      setSensorDataByItem({});
      setApiEnabled(false);
      setLeftCollapsed(false);
      setRightCollapsed(false);

      await persistActiveProject(response.data.id, response.data.name);

      await refreshProjectList();

      setLogs((previous) => [
        {
          id: Date.now(),
          status: "success",
          method: "NEW",
          url: response.data.name,
          time: new Date().toLocaleTimeString(),
          message: "Nouveau projet créé dans SQLite.",
        },
        ...previous,
      ]);
    } catch (error) {
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "error",
          method: "NEW",
          url: projectName,
          time: new Date().toLocaleTimeString(),
          message: error?.response?.data?.error || "Impossible de créer le projet.",
        },
        ...previous,
      ]);
    }
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
        item.id === itemId ? { ...item, powered: !item.powered } : item
      )
    );
  }

  function buildCompleteSimulationPayload(dataOverride = sensorDataByItem, automatic = false) {
    return {
      project: {
        id: currentProjectId,
        name: currentProjectName,
        savedAt: new Date().toISOString(),
      },
      editor: {
        items,
        wires,
        sensorConfigs,
        zoom,
        selectedId,
        leftCollapsed,
        rightCollapsed,
      },
      simulation: {
        running,
        transmission: automatic ? "automatic" : "manual",
        sensorDataByItem: dataOverride,
        summary: buildApiPayload(items, wires, dataOverride),
        timestamp: new Date().toISOString(),
      },
      api: {
        host: projectApiHost,
        port,
        baseUrl: projectApiBaseUrl,
        endpoint: simulationEndpoint,
      },
    };
  }

  async function sendData(dataOverride = sensorDataByItem, automatic = false) {
    if (!currentProjectId) {
      await saveProject(false);
    }

    const projectId = currentProjectId || Number(localStorage.getItem(STORAGE_CURRENT_PROJECT_ID));
    const endpoint = projectId
      ? `${projectApiBaseUrl}/projects/${projectId}/simulation-data`
      : simulationEndpoint;

    const payload = buildCompleteSimulationPayload(dataOverride, automatic);

    const logBase = {
      id: Date.now(),
      method: "POST",
      url: endpoint,
      payload,
      time: new Date().toLocaleTimeString(),
    };

    try {
      await axios.post(endpoint, payload);
      setLogs((previous) => [
        {
          ...logBase,
          status: "success",
          message: "Informations complètes de simulation envoyées au backend Flask.",
        },
        ...previous,
      ]);
    } catch {
      setLogs((previous) => [
        {
          ...logBase,
          status: "error",
          message: "Endpoint de simulation non joignable. Vérifie dashboard/app.py.",
        },
        ...previous,
      ]);
    }
  }

  function clearAll() {
    const confirmClear = window.confirm("Voulez-vous vraiment vider l’éditeur ?");
    if (!confirmClear) return;

    setItems([]);
    setWires([]);
    setSelectedId(null);
    setSensorConfigs({});
    setSensorDataByItem({});
    setPiConfigItemId(null);
    setLogs((previous) => [
      {
        id: Date.now(),
        status: "blocked",
        method: "CLEAR",
        url: currentProjectName || "éditeur",
        time: new Date().toLocaleTimeString(),
        message: "Éditeur vidé. La sauvegarde automatique va enregistrer cet état.",
      },
      ...previous,
    ]);
  }

  async function handleApplyPiConfig(code, validation = null) {
    let projectId = currentProjectId || Number(localStorage.getItem(STORAGE_CURRENT_PROJECT_ID));

    if (!projectId) {
      await saveProject(false);
      projectId = Number(localStorage.getItem(STORAGE_CURRENT_PROJECT_ID));
    }

    if (!projectId) {
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "error",
          method: "UPLOAD",
          url: "Raspberry Pi 5 virtuel",
          time: new Date().toLocaleTimeString(),
          message: "Impossible d'appliquer le code : aucun projet actif n'est disponible.",
        },
        ...previous,
      ]);
      return;
    }

    try {
      const response = await axios.post(`${projectApiBaseUrl}/projects/${projectId}/raspberry-code`, {
        itemId: piConfigItemId,
        code,
      });

      setRaspberryPiCode(code);
      localStorage.setItem(STORAGE_RPI_CODE, code);
      await persistActiveProject(projectId, currentProjectName);

      setLogs((previous) => [
        {
          id: Date.now(),
          status: response.data?.validation?.ok ? "success" : "blocked",
          method: "UPLOAD",
          url: `Projet ${projectId}`,
          time: new Date().toLocaleTimeString(),
          message: response.data?.validation?.ok
            ? "Code Raspberry Pi sauvegardé et interprété : syntaxe/imports OK."
            : validation?.installCommand || response.data?.validation?.installCommand || "Code sauvegardé, mais certains modules doivent être installés.",
        },
        ...previous,
      ]);

      setPiConfigItemId(null);
    } catch (error) {
      setLogs((previous) => [
        {
          id: Date.now(),
          status: "error",
          method: "UPLOAD",
          url: `Projet ${projectId}`,
          time: new Date().toLocaleTimeString(),
          message: error?.response?.data?.error || "Impossible de sauvegarder le code Raspberry Pi.",
        },
        ...previous,
      ]);
    }
  }

  if (piConfigItem) {
    return (
      <PiConfigModal
        item={piConfigItem}
        items={items}
        wires={wires}
        sensorConfigs={sensorConfigs}
        sensorDataByItem={sensorDataByItem}
        currentProjectId={currentProjectId}
        currentProjectName={currentProjectName}
        projectApiBaseUrl={projectApiBaseUrl}
        savedCode={raspberryPiCode}
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
        projectApiHost={projectApiHost}
        setProjectApiHost={setProjectApiHost}
        zoom={zoom}
        setZoom={setZoom}
        apiEnabled={apiEnabled}
        setApiEnabled={setApiEnabled}
        currentProjectName={currentProjectName}
        currentProjectId={currentProjectId}
        projects={projects}
        projectApiReady={projectApiReady}
        onNewProject={createNewProject}
        onSaveProject={() => saveProject(true)}
        onOpenProject={(id) => loadProjectById(Number(id), true)}
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
              projectApiHost={projectApiHost}
              projectApiPort={port}
              projectApiBaseUrl={projectApiBaseUrl}
              simulationEndpoint={simulationEndpoint}
              currentProjectId={currentProjectId}
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
