// Header.jsx
// Barre supérieure : logo, mode fil, zoom, simulation, envoi API, indicateurs

function Header({
  wireMode,
  setWireMode,
  running,
  setRunning,
  sendNow,
  clearAll,
  port,
  setPort,
  zoom,
  setZoom,
}) {
  function handleZoom(delta) {
    setZoom((z) => Math.min(200, Math.max(40, z + delta)));
  }

  return (
    <header className="topbar">
      {/* ── Logo ── */}
      <div className="brand">
        <div className="logo-dot">IoT</div>
        <div>
          <h1>IoT Circuit Simulator</h1>
          <div className="brand-sub">Raspberry Pi 5 · Capteurs · API REST</div>
        </div>
      </div>

      <div className="tb-sep" />

      {/* ── Actions circuit ── */}
      <div className="top-center">
        {/* Mode fil */}
        <button
          className={wireMode ? "tb-btn active" : "tb-btn"}
          onClick={() => setWireMode((v) => !v)}
          title="Activer le mode câblage (cliquer sur les pins pour tracer des fils)"
        >
          {/* Icône SVG fil */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12h4M17 12h4" />
            <circle cx="10" cy="12" r="3" />
          </svg>
          {wireMode ? "🔌 Fil actif" : "Fil"}
        </button>

        {/* Zoom */}
        <button className="tb-btn" onClick={() => handleZoom(-10)} title="Zoom arrière">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#c4ae72", minWidth: 34, textAlign: "center" }}>
          {zoom}%
        </span>
        <button className="tb-btn" onClick={() => handleZoom(10)} title="Zoom avant">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button className="tb-btn" onClick={() => setZoom(100)} title="Réinitialiser le zoom">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3.51 15a9 9 0 1 0 .49-5"/><polyline points="3 4 3 10 9 10"/></svg>
        </button>

        <div className="tb-sep" />

        {/* Effacer */}
        <button
          className="tb-btn"
          onClick={clearAll}
          title="Effacer tous les composants"
          style={{ color: "#e87070" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          Effacer
        </button>
      </div>

      <div className="tb-sep" />

      {/* ── API & Simulation ── */}
      <div className="top-actions">
        {/* Indicateur live */}
        <div className="live-indicator">
          <div className={`live-dot${running ? " on" : ""}`} />
          <span>{running ? "En simulation" : "Arrêté"}</span>
        </div>

        {/* Port */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10, color: "#c4ae72", fontWeight: 600 }}>Port</span>
          <input
            type="number"
            min={1024}
            max={65535}
            value={port}
            onChange={(e) => setPort(e.target.value)}
            style={{
              width: 64,
              padding: "4px 7px",
              borderRadius: 6,
              border: "1px solid #4a3510",
              background: "#1a1006",
              color: "#c9a227",
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: 11,
              outline: "none",
            }}
            title="Port local de l'API REST"
          />
        </div>

        {/* Simuler / Arrêter */}
        <button
          className={running ? "tb-btn danger" : "tb-btn success"}
          onClick={() => setRunning((v) => !v)}
          title={running ? "Arrêter la simulation" : "Lancer la simulation des capteurs"}
        >
          {running ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>
              Arrêter
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Simuler
            </>
          )}
        </button>

        {/* Envoyer test API */}
        <button
          className="tb-btn gold"
          onClick={sendNow}
          title="Envoyer une mesure test vers l'API REST"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
          Envoyer test
        </button>
      </div>
    </header>
  );
}

export default Header;