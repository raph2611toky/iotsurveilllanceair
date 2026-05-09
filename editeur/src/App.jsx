import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import Header from "./components/Header";
import LeftSidebar from "./components/LeftSidebar";
import EditorCanvas from "./components/EditorCanvas";
import RightSidebar from "./components/RightSidebar";

function rand(min, max, dec = 1) {
  return Number((Math.random() * (max - min) + min).toFixed(dec));
}

function generateSensorData() {
  const temperature = rand(22, 36);
  const humidity = rand(45, 88);
  const co2 = rand(380, 1200, 0);
  const smoke = rand(0, 350, 0);
  const pressure = rand(990, 1035, 0);

  return {
    source: "Raspberry Pi 5",
    temperature,
    humidity,
    co2,
    smoke,
    pressure,
    status: co2 > 900 || smoke > 200 ? "danger" : "normal",
    timestamp: new Date().toISOString(),
  };
}

export default function App() {
  const [items, setItems] = useState([
    { id: "rpi-default", type: "rpi5", x: 440, y: 160 },
    { id: "breadboard-default", type: "breadboard", x: 380, y: 430 },
    { id: "dht22-default", type: "dht22", x: 140, y: 150 },
    { id: "mq135-default", type: "mq135", x: 140, y: 330 },
  ]);

  const [wires, setWires] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [zoom, setZoom] = useState(100);

  const [running, setRunning] = useState(false);
  const [sensorData, setSensorData] = useState(generateSensorData());

  const [port, setPort] = useState("3001");
  const [apiUrl, setApiUrl] = useState("http://localhost:3001/api/iot/data");
  const [apiEnabled, setApiEnabled] = useState(false);
  const [logs, setLogs] = useState([]);

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  useEffect(() => {
    setApiUrl(`http://localhost:${port}/api/iot/data`);
  }, [port]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const data = generateSensorData();
      setSensorData(data);

      if (apiEnabled) {
        sendData(data, true);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [running, apiEnabled, apiUrl]);

  async function sendData(data = sensorData, automatic = false) {
    const payload = {
      ...data,
      source: "Raspberry Pi 5",
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
    } catch (error) {
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
    setItems([]);
    setWires([]);
    setSelectedId(null);
    setLogs([]);
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
        sendNow={() => sendData(sensorData, false)}
        clearAll={clearAll}
        port={port}
        setPort={setPort}
        zoom={zoom}
        setZoom={setZoom}
        apiEnabled={apiEnabled}
        setApiEnabled={setApiEnabled}
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
          sensorData={sensorData}
          zoom={zoom}
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
              selectedId={selectedId}
              items={items}
              wires={wires}
              sensorData={sensorData}
              running={running}
              logs={logs}
              apiUrl={apiUrl}
              apiEnabled={apiEnabled}
              setApiEnabled={setApiEnabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}