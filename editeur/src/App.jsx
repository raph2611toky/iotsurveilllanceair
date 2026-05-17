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
const ACTUATOR_TYPES = ["led_r", "led_g", "relay", "buzzer", "fan", "cooler"];

const DEFAULT_SENSOR_CONFIGS = {
  // Pics critiques rendus volontairement plus fréquents pour tester rapidement
  // les LEDs, le ventilateur, le refroidissement, le dashboard et les emails.
  dht22: { temperature: 28, humidity: 65, variation: 4, warningChance: 0.24, criticalChance: 0.30 },
  mq135: { co2: 650, variation: 120, warningChance: 0.24, criticalChance: 0.36 },
  mq2: { smoke: 80, variation: 60, warningChance: 0.24, criticalChance: 0.34 },
  bmp280: { pressure: 1012, temperature: 27, variation: 8, warningChance: 0.20, criticalChance: 0.26 },
  pir: { motion: false, variation: 1 },
  pressure: { pressure: 1013, variation: 20 },
  soil: { humidity: 55, variation: 12 },
};

const CRITICAL_SIMULATION_POLICY = {
  // Appliqué même aux anciens projets déjà sauvegardés avec de faibles valeurs.
  minWarningChance: 0.18,
  minCriticalChance: 0.28,

  // Si aucun capteur ne sort critique pendant un cycle, on force parfois
  // un vrai pic critique sur un capteur compatible.
  forceCriticalPulseChance: 0.38,

  criticalTypes: ["dht22", "mq135", "mq2", "bmp280"],
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

function randomBetween(min, max, dec = 1) {
  return Number((Math.random() * (max - min) + min).toFixed(dec));
}

function simulationLevel(config = {}, forcedLevel = null) {
  if (forcedLevel) return forcedLevel;

  const configuredCriticalChance = Number(config.criticalChance ?? 0);
  const configuredWarningChance = Number(config.warningChance ?? 0);

  const criticalChance = clamp(
    Math.max(configuredCriticalChance, CRITICAL_SIMULATION_POLICY.minCriticalChance),
    0,
    0.75
  );

  const warningChance = clamp(
    Math.max(configuredWarningChance, CRITICAL_SIMULATION_POLICY.minWarningChance),
    0,
    Math.max(0, 1 - criticalChance)
  );

  const roll = Math.random();

  if (roll < criticalChance) return "critical";
  if (roll < criticalChance + warningChance) return "warning";
  return "normal";
}

function boolFromThreshold(value, warning, critical) {
  return {
    isWarning: Number(value) >= warning,
    isCritical: Number(value) >= critical,
  };
}

function isSensor(type) {
  return SENSOR_TYPES.includes(type);
}

function isActuator(type) {
  return ACTUATOR_TYPES.includes(type);
}

function createDefaultConfigFor(type) {
  return { ...(DEFAULT_SENSOR_CONFIGS[type] || {}) };
}

function generateSensorValue(type, config = {}, forcedLevel = null) {
  const level = simulationLevel(config, forcedLevel);
  const timestamp = new Date().toISOString();

  if (type === "dht22") {
    let temperature = clamp(randAround(config.temperature ?? 28, config.variation ?? 4), -40, 80);
    let humidity = clamp(randAround(config.humidity ?? 65, config.variation ?? 4), 0, 100);

    if (level === "warning") {
      temperature = randomBetween(32.5, 38.5, 1);
      humidity = Math.random() > 0.5 ? randomBetween(76, 84, 1) : randomBetween(18, 24, 1);
    }

    if (level === "critical") {
      temperature = randomBetween(40.5, 55, 1);
      humidity = Math.random() > 0.5 ? randomBetween(90, 98, 1) : randomBetween(8, 14, 1);
    }

    return {
      type,
      level,
      temperature,
      humidity,
      unit: "°C / %",
      timestamp,
    };
  }

  if (type === "mq135") {
    let co2 = clamp(randAround(config.co2 ?? 650, config.variation ?? 120, 0), 300, 2500);

    if (level === "warning") co2 = randomBetween(820, 1150, 0);
    if (level === "critical") co2 = randomBetween(1220, 2400, 0);

    const { isWarning, isCritical } = boolFromThreshold(co2, 800, 1200);

    return {
      type,
      level: isCritical ? "critical" : isWarning ? "warning" : level,
      co2,
      co2_ppm: co2,
      ppm: co2,
      gasDetected: isWarning,
      gas_detected: isWarning,
      detected: isWarning,
      digital_raw: isWarning ? 1 : 0,
      airQuality: isCritical ? "critique" : isWarning ? "mauvaise" : "bonne",
      unit: "ppm",
      timestamp,
    };
  }

  if (type === "mq2") {
    let smoke = clamp(randAround(config.smoke ?? 80, config.variation ?? 60, 0), 0, 1000);

    if (level === "warning") smoke = randomBetween(155, 285, 0);
    if (level === "critical") smoke = randomBetween(310, 900, 0);

    const { isWarning, isCritical } = boolFromThreshold(smoke, 150, 300);

    return {
      type,
      level: isCritical ? "critical" : isWarning ? "warning" : level,
      smoke,
      smoke_ppm: smoke,
      ppm: smoke,
      alert: isCritical,
      gasDetected: isWarning,
      gas_detected: isWarning,
      detected: isWarning,
      digital_raw: isWarning ? 1 : 0,
      unit: "ppm",
      timestamp,
    };
  }

  if (type === "bmp280") {
    let pressure = clamp(randAround(config.pressure ?? 1012, config.variation ?? 8, 0), 850, 1100);
    let temperature = clamp(randAround(config.temperature ?? 27, 2, 1), -20, 80);

    if (level === "warning") {
      pressure = Math.random() > 0.5 ? randomBetween(1036, 1055, 0) : randomBetween(965, 979, 0);
      temperature = randomBetween(32, 38, 1);
    }

    if (level === "critical") {
      pressure = Math.random() > 0.5 ? randomBetween(1061, 1095, 0) : randomBetween(900, 949, 0);
      temperature = randomBetween(40, 50, 1);
    }

    return {
      type,
      level,
      pressure,
      temperature,
      unit: "hPa",
      timestamp,
    };
  }

  if (type === "pir") {
    const randomMotion = Math.random() > 0.65;
    return {
      type,
      motion: Boolean(config.motion) || randomMotion,
      label: Boolean(config.motion) || randomMotion ? "Mouvement" : "Calme",
      timestamp,
    };
  }

  if (type === "pressure") {
    return {
      type,
      pressure: clamp(randAround(config.pressure ?? 1013, config.variation ?? 20, 0), 500, 2000),
      unit: "hPa",
      timestamp,
    };
  }

  if (type === "soil") {
    return {
      type,
      humidity: clamp(randAround(config.humidity ?? 55, config.variation ?? 12, 1), 0, 100),
      unit: "%",
      timestamp,
    };
  }

  return { type, timestamp };
}

function isCriticalSimulationValue(data) {
  if (!data) return false;
  if (data.level === "critical") return true;

  return (
    Number(data.temperature) >= 40 ||
    Number(data.humidity) >= 90 ||
    Number(data.humidity) <= 15 ||
    Number(data.pressure) >= 1060 ||
    Number(data.pressure) <= 950 ||
    Number(data.co2 ?? data.co2_ppm ?? data.ppm) >= 1200 ||
    Number(data.smoke ?? data.smoke_ppm ?? data.ppm) >= 300 ||
    Boolean(data.alert)
  );
}

function generateSensorDataByItem(items, sensorConfigs) {
  const result = {};
  const criticalCandidateItems = [];

  items.forEach((item) => {
    if (!isSensor(item.type)) return;

    const config = sensorConfigs[item.id] || createDefaultConfigFor(item.type);
    result[item.id] = generateSensorValue(item.type, config);

    if (CRITICAL_SIMULATION_POLICY.criticalTypes.includes(item.type)) {
      criticalCandidateItems.push(item);
    }
  });

  const hasCritical = Object.values(result).some(isCriticalSimulationValue);

  if (
    !hasCritical &&
    criticalCandidateItems.length > 0 &&
    Math.random() < CRITICAL_SIMULATION_POLICY.forceCriticalPulseChance
  ) {
    const randomIndex = Math.floor(Math.random() * criticalCandidateItems.length);
    const item = criticalCandidateItems[randomIndex];
    const config = sensorConfigs[item.id] || createDefaultConfigFor(item.type);
    result[item.id] = generateSensorValue(item.type, config, "critical");
  }

  return result;
}

function getSensorMetrics(sensorDataByItem = {}) {
  const values = Object.values(sensorDataByItem || {}).filter(Boolean);

  const dht = values.find((entry) => entry.type === "dht22") || {};
  const bmp = values.find((entry) => entry.type === "bmp280") || {};
  const mq135 = values.find((entry) => entry.type === "mq135") || {};
  const mq2 = values.find((entry) => entry.type === "mq2") || {};

  const temperature = Number.isFinite(Number(dht.temperature))
    ? Number(dht.temperature)
    : Number.isFinite(Number(bmp.temperature))
      ? Number(bmp.temperature)
      : null;

  const humidity = Number.isFinite(Number(dht.humidity)) ? Number(dht.humidity) : null;
  const pressure = Number.isFinite(Number(bmp.pressure)) ? Number(bmp.pressure) : null;
  const co2 = Number.isFinite(Number(mq135.co2)) ? Number(mq135.co2) : null;
  const smoke = Number.isFinite(Number(mq2.smoke)) ? Number(mq2.smoke) : null;

  return { temperature, humidity, pressure, co2, smoke, mq135, mq2 };
}

function evaluateSimulationState(sensorDataByItem = {}) {
  const metrics = getSensorMetrics(sensorDataByItem);
  const alerts = [];

  if (metrics.temperature !== null) {
    if (metrics.temperature >= 40) alerts.push({ level: "critical", source: "temperature", message: "Température critique" });
    else if (metrics.temperature >= 32) alerts.push({ level: "warning", source: "temperature", message: "Température élevée" });
  }

  if (metrics.humidity !== null) {
    if (metrics.humidity >= 90 || metrics.humidity <= 15) alerts.push({ level: "critical", source: "humidity", message: "Humidité critique" });
    else if (metrics.humidity >= 75 || metrics.humidity <= 25) alerts.push({ level: "warning", source: "humidity", message: "Humidité proche du seuil" });
  }

  if (metrics.pressure !== null) {
    if (metrics.pressure >= 1060 || metrics.pressure <= 950) alerts.push({ level: "critical", source: "pressure", message: "Pression critique" });
    else if (metrics.pressure >= 1035 || metrics.pressure <= 980) alerts.push({ level: "warning", source: "pressure", message: "Pression inhabituelle" });
  }

  const mq135Detected = Boolean(metrics.mq135.gasDetected || metrics.mq135.gas_detected || metrics.mq135.detected);
  const mq2Detected = Boolean(metrics.mq2.gasDetected || metrics.mq2.gas_detected || metrics.mq2.detected || metrics.mq2.alert);

  if (metrics.co2 !== null) {
    if (metrics.co2 >= 1200) alerts.push({ level: "critical", source: "mq135", message: "Qualité de l’air critique" });
    else if (metrics.co2 >= 800 || mq135Detected) alerts.push({ level: "warning", source: "mq135", message: "Gaz/pollution détecté" });
  } else if (mq135Detected) {
    alerts.push({ level: "warning", source: "mq135", message: "Gaz/pollution détecté" });
  }

  if (metrics.smoke !== null) {
    if (metrics.smoke >= 300 || metrics.mq2.alert) alerts.push({ level: "critical", source: "mq2", message: "Fumée/gaz critique" });
    else if (metrics.smoke >= 150 || mq2Detected) alerts.push({ level: "warning", source: "mq2", message: "Fumée/gaz détecté" });
  } else if (mq2Detected) {
    alerts.push({ level: "warning", source: "mq2", message: "Fumée/gaz détecté" });
  }

  const status = alerts.some((alert) => alert.level === "critical")
    ? "critical"
    : alerts.some((alert) => alert.level === "warning")
      ? "warning"
      : "normal";

  return { status, alerts, metrics };
}

function generateActuatorDataByItem(items, sensorDataByItem = {}) {
  const result = {};
  const analysis = evaluateSimulationState(sensorDataByItem);
  const { status, metrics } = analysis;

  const temperature = metrics.temperature;
  const co2 = metrics.co2;
  const smoke = metrics.smoke;
  const mq135Detected = Boolean(metrics.mq135.gasDetected || metrics.mq135.gas_detected || metrics.mq135.detected);
  const mq2Detected = Boolean(metrics.mq2.gasDetected || metrics.mq2.gas_detected || metrics.mq2.detected || metrics.mq2.alert);

  const temperatureWarning = temperature !== null && temperature >= 32;
  const temperatureCritical = temperature !== null && temperature >= 40;
  const gasWarning = mq135Detected || mq2Detected || (co2 ?? 0) >= 800 || (smoke ?? 0) >= 150;
  const gasCritical = (co2 ?? 0) >= 1200 || (smoke ?? 0) >= 300 || Boolean(metrics.mq2.alert);

  items.forEach((item) => {
    if (!isActuator(item.type)) return;

    let active = false;
    let label = "OFF";
    let reason = "Aucune réaction nécessaire.";
    let intensity = 0;
    let reactionStatus = status;

    if (item.type === "led_r") {
      active = status === "critical";
      label = active ? "CRITIQUE" : "OFF";
      reason = active ? "Au moins une valeur a dépassé un seuil critique." : "Pas d’état critique.";
      intensity = active ? 100 : 0;
    } else if (item.type === "led_g") {
      active = status === "warning";
      label = active ? "PRÉ-CRITIQUE" : "OFF";
      reason = active ? "Une valeur monte vers un seuil critique." : "Pas de pré-alerte.";
      intensity = active ? 75 : 0;
    } else if (item.type === "buzzer") {
      active = status === "critical";
      label = active ? "ALARME" : "OFF";
      reason = active ? "Signal sonore activé en état critique." : "Buzzer en attente.";
      intensity = active ? 100 : 0;
    } else if (item.type === "relay") {
      active = status === "critical";
      label = active ? "RELAIS ON" : "OFF";
      reason = active ? "Relais fermé pour alimenter une réaction de sécurité." : "Relais ouvert.";
      intensity = active ? 100 : 0;
    } else if (item.type === "fan") {
      active = gasWarning;
      label = active ? (gasCritical ? "EXTRACTION MAX" : "EXTRACTION AIR") : "OFF";
      reason = active
        ? "Gaz/fumée détecté : le ventilateur renouvelle l’air."
        : "Aucune fumée ni pollution détectée.";
      intensity = active ? (gasCritical ? 100 : 70) : 0;
      reactionStatus = gasCritical ? "critical" : gasWarning ? "warning" : "normal";
    } else if (item.type === "cooler") {
      active = temperatureWarning;
      label = active ? (temperatureCritical ? "FROID MAX" : "REFROIDIR") : "OFF";
      reason = active
        ? "Pic de température détecté : refroidissement activé."
        : "Température dans la zone normale.";
      intensity = active ? (temperatureCritical ? 100 : 65) : 0;
      reactionStatus = temperatureCritical ? "critical" : temperatureWarning ? "warning" : "normal";
    }

    result[item.id] = {
      type: item.type,
      active,
      label,
      reason,
      intensity,
      status: reactionStatus,
      triggers: {
        temperature,
        co2,
        smoke,
        temperatureWarning,
        temperatureCritical,
        gasWarning,
        gasCritical,
      },
      timestamp: new Date().toISOString(),
    };
  });

  return result;
}

function buildApiPayload(items, wires, sensorDataByItem, actuatorDataByItem = {}) {
  const sensors = items
    .filter((item) => isSensor(item.type))
    .map((item) => ({
      itemId: item.id,
      type: item.type,
      name: componentsData[item.type]?.name || item.type,
      data: sensorDataByItem[item.id] || null,
    }));

  const actuators = items
    .filter((item) => isActuator(item.type))
    .map((item) => ({
      itemId: item.id,
      type: item.type,
      name: componentsData[item.type]?.name || item.type,
      data: actuatorDataByItem[item.id] || null,
    }));

  const analysis = evaluateSimulationState(sensorDataByItem);
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
    actuators,
    status: analysis.status,
    alerts: analysis.alerts,
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

  const actuatorDataByItem = useMemo(() => {
    return generateActuatorDataByItem(items, sensorDataByItem);
  }, [items, sensorDataByItem]);

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
    const nextActuatorData = generateActuatorDataByItem(items, dataOverride);

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
        actuatorDataByItem: nextActuatorData,
        summary: buildApiPayload(items, wires, dataOverride, nextActuatorData),
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
          actuatorDataByItem={actuatorDataByItem}
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
              actuatorDataByItem={actuatorDataByItem}
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
