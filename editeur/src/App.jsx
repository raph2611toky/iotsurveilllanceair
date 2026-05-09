// App.jsx
// Racine de l'application — gestion de l'état global, simulation, envoi API

import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import Header      from "./components/Header";
import LeftSidebar from "./components/LeftSidebar";
import EditorCanvas from "./components/EditorCanvas";
import RightSidebar from "./components/RightSidebar";

// ── Générateur de données capteurs simulées ───────────────────────────────────
function rand(min, max, dec = 1) {
  return Number((Math.random() * (max - min) + min).toFixed(dec));
}

function generateSensorData() {
  const temperature = rand(22, 36);
  const humidity    = rand(45, 88);
  const co2         = rand(380, 1200, 0);
  const smoke       = rand(0, 350, 0);

  return {
    source:      "Raspberry Pi 5",
    temperature,
    humidity,
    co2,
    smoke,
    status:      co2 > 900 || smoke > 200 ? "danger" : "normal",
    timestamp:   new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Circuit : composants placés et fils ──────────────────────────────────
  const [items, setItems] = useState([
    { id: "rpi-default",        type: "rpi5",       x: 440, y: 160 },
    { id: "breadboard-default", type: "breadboard", x: 380, y: 420 },
    { id: "dht22-default",      type: "dht22",      x: 140, y: 150 },
    { id: "mq135-default",      type: "mq135",      x: 140, y: 310 },
  ]);

  const [wires,      setWires]      = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // ── Mode câblage & pin en attente ────────────────────────────────────────
  const [wireMode,    setWireMode]    = useState(false);
  const [pendingPin,  setPendingPin]  = useState(null);

  // ── Zoom ─────────────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(100);

  // ── Simulation ───────────────────────────────────────────────────────────
  const [running,    setRunning]    = useState(false);
  const [sensorData, setSensorData] = useState(generateSensorData());

  // ── API REST ─────────────────────────────────────────────────────────────
  const [apiEnabled, setApiEnabled] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3001/api/sensors");
  const [apiLogs,    setApiLogs]    = useState([]);
  const [port,       setPort]       = useState("3001");

  // Synchroniser le port dans l'URL de base
  useEffect(() => {
    setApiBaseUrl(`http://localhost:${port}/api/sensors`);
  }, [port]);

  // ── Boucle de simulation (2.5 s) ─────────────────────────────────────────
  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      const data = generateSensorData();
      setSensorData(data);
      if (apiEnabled) sendToApi(data, true);
    }, 2500);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, apiEnabled, apiBaseUrl]);

  // ── Envoi vers l'API ──────────────────────────────────────────────────────
  async function sendToApi(data = sensorData, automatic = false) {
    const method = automatic ? "AUTO POST" : "POST";
    const time   = new Date().toLocaleTimeString("fr-FR");

    if (!apiEnabled) {
      addLog({ method, status: "blocked", time, message: "Transmission API désactivée." });
      return;
    }

    try {
      await axios.post(apiBaseUrl, data);
      addLog({ method, status: "success", time, message: `✅ Données envoyées → ${apiBaseUrl}` });
    } catch (err) {
      addLog({
        method,
        status: "error",
        time,
        message: `❌ Erreur : ${err?.message || "Impossible de joindre l'API"}`,
      });
    }
  }

  function addLog(entry) {
    setApiLogs((prev) => [{ id: Date.now(), ...entry }, ...prev].slice(0, 20));
  }

  // ── Bouton "Envoyer test" ─────────────────────────────────────────────────
  function sendNow() {
    const data = generateSensorData();
    setSensorData(data);
    sendToApi(data, false);
  }

  // ── Effacer le circuit ────────────────────────────────────────────────────
  function clearAll() {
    setItems([]);
    setWires([]);
    setSelectedId(null);
    setPendingPin(null);
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Header
        wireMode={wireMode}
        setWireMode={setWireMode}
        running={running}
        setRunning={setRunning}
        sendNow={sendNow}
        clearAll={clearAll}
        port={port}
        setPort={setPort}
        zoom={zoom}
        setZoom={setZoom}
      />

      <div className="workspace">
        <LeftSidebar />

        <EditorCanvas
          items={items}
          setItems={setItems}
          wires={wires}
          setWires={setWires}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          wireMode={wireMode}
          pendingPin={pendingPin}
          setPendingPin={setPendingPin}
          running={running}
          sensorData={sensorData}
          zoom={zoom}
        />

        <RightSidebar
          selectedId={selectedId}
          items={items}
          sensorData={sensorData}
          apiEnabled={apiEnabled}
          setApiEnabled={setApiEnabled}
          apiBaseUrl={apiBaseUrl}
          setApiBaseUrl={setApiBaseUrl}
          apiLogs={apiLogs}
          sendNow={sendNow}
          running={running}
        />
      </div>
    </div>
  );
}