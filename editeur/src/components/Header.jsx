function Header({
  running,
  setRunning,
  sendNow,
  clearAll,
  port,
  setPort,
  zoom,
  setZoom,
  apiEnabled,
  setApiEnabled,
  currentProjectName,
  onNewProject,
  onSaveProject,
}) {
  function handleZoom(delta) {
    setZoom((value) => Math.min(200, Math.max(40, value + delta)));
  }

  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo-dot">IoT</div>

        <div>
          <h1>IoT Circuit Simulator</h1>
          <div className="brand-sub">
            Projet : {currentProjectName || "Aucun projet"}
          </div>
        </div>
      </div>

      <div className="tb-sep" />

      <div className="top-center">
        <button className="tb-btn gold" onClick={onNewProject}>
          Nouveau projet
        </button>

        <button className="tb-btn" onClick={onSaveProject}>
          Sauvegarder
        </button>

        <div className="tb-sep" />

        <button
          className="tb-btn"
          onClick={() => handleZoom(-10)}
          title="Zoom arrière"
        >
          −
        </button>

        <span className="zoom-value">{zoom}%</span>

        <button
          className="tb-btn"
          onClick={() => handleZoom(10)}
          title="Zoom avant"
        >
          +
        </button>

        <div className="tb-sep" />

        <button
          className={running ? "tb-btn danger" : "tb-btn success"}
          onClick={() => setRunning((value) => !value)}
        >
          {running ? "Arrêter" : "Simuler"}
        </button>

        <button
          className={apiEnabled ? "tb-btn active" : "tb-btn"}
          onClick={() => setApiEnabled((value) => !value)}
        >
          API {apiEnabled ? "ON" : "OFF"}
        </button>

        <button className="tb-btn gold" onClick={sendNow}>
          Envoyer API
        </button>

        <button className="tb-btn danger" onClick={clearAll}>
          Effacer
        </button>
      </div>

      <div className="top-actions">
        <div className="live-indicator">
          <span className={running ? "live-dot on" : "live-dot"} />
          <span>{running ? "Simulation active" : "Simulation arrêtée"}</span>
        </div>

        <input
          className="port-input"
          value={port}
          onChange={(event) => setPort(event.target.value)}
          title="Port de l’API externe"
        />

        <span className="port-badge">localhost:{port}</span>
      </div>
    </header>
  );
}

export default Header;