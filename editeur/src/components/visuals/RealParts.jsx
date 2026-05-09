// RealParts.jsx
// Rendus SVG réalistes des composants électroniques.
// Objectif : imiter visuellement les composants réels sans modifier le design général de l’éditeur.

function SvgBase({ width, height, children, className = "", viewBox }) {
  return (
    <svg
      className={`real-svg ${className}`}
      width={width}
      height={height}
      viewBox={viewBox || `0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {children}
    </svg>
  );
}

function Text({
  x,
  y,
  children,
  size = 8,
  fill = "#111",
  weight = 800,
  anchor = "middle",
  rotate = null,
}) {
  const transform = rotate ? `rotate(${rotate} ${x} ${y})` : undefined;

  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={fill}
      fontWeight={weight}
      textAnchor={anchor}
      fontFamily="Segoe UI, Arial, sans-serif"
      transform={transform}
    >
      {children}
    </text>
  );
}

function LiveBox({ x, y, value, color = "#111", width = 76 }) {
  if (!value) return null;

  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - 11}
        width={width}
        height="17"
        rx="4"
        fill="rgba(255,255,255,0.94)"
        stroke="#d8d8d8"
      />
      <Text x={x} y={y + 1} size={7.2} fill={color}>
        {value}
      </Text>
    </g>
  );
}

/* ─────────────────────────────────────────────
   RASPBERRY PI 5 — rendu proche réel
   ───────────────────────────────────────────── */

export function RaspberryPi5Svg({ width, height, running }) {
  return (
    <SvgBase width={width} height={height} className="svg-rpi5" viewBox="0 0 260 180">
      <defs>
        <linearGradient id="rpiPcbReal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#138f64" />
          <stop offset="45%" stopColor="#0d7d58" />
          <stop offset="100%" stopColor="#086648" />
        </linearGradient>

        <linearGradient id="rpiMetal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f4f7fa" />
          <stop offset="45%" stopColor="#bfc7ce" />
          <stop offset="100%" stopColor="#78838d" />
        </linearGradient>

        <linearGradient id="rpiEthernet" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#e0c984" />
          <stop offset="45%" stopColor="#c89b45" />
          <stop offset="100%" stopColor="#8b6426" />
        </linearGradient>

        <linearGradient id="rpiChip" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b3b3b" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>

        <filter id="rpiShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.28" />
        </filter>

        <pattern id="rpiTraces" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 8 H18 M8 0 V18" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect
        x="3"
        y="3"
        width="254"
        height="174"
        rx="13"
        fill="url(#rpiPcbReal)"
        stroke="#075b41"
        strokeWidth="3"
        filter="url(#rpiShadow)"
      />

      <rect x="5" y="5" width="250" height="170" rx="12" fill="url(#rpiTraces)" opacity="0.8" />

      <circle cx="17" cy="17" r="8.5" fill="#d9b64a" stroke="#805f13" strokeWidth="3" />
      <circle cx="243" cy="17" r="8.5" fill="#d9b64a" stroke="#805f13" strokeWidth="3" />
      <circle cx="17" cy="163" r="8.5" fill="#d9b64a" stroke="#805f13" strokeWidth="3" />
      <circle cx="243" cy="163" r="8.5" fill="#d9b64a" stroke="#805f13" strokeWidth="3" />

      <Text x="42" y="22" size="9" fill="#eafff6" anchor="start">
        Raspberry Pi 5
      </Text>
      <Text x="42" y="33" size="5.8" fill="#baf5de" anchor="start">
        BCM2712 · 2.4GHz · GPIO 40
      </Text>

      <rect x="96" y="9" width="140" height="27" rx="4" fill="#111" stroke="#222" strokeWidth="1.5" />
      {Array.from({ length: 20 }).map((_, i) => (
        <rect key={`gpio-a-${i}`} x={101 + i * 6.5} y="14" width="4.2" height="4.2" rx="1" fill="#d6d6d6" />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <rect key={`gpio-b-${i}`} x={101 + i * 6.5} y="25" width="4.2" height="4.2" rx="1" fill="#d6d6d6" />
      ))}

      <rect x="92" y="67" width="65" height="51" rx="6" fill="url(#rpiChip)" stroke="#4b5563" strokeWidth="3" />
      <Text x="124.5" y="92" size="6.6" fill="#d1d5db">
        BCM2712
      </Text>
      <Text x="124.5" y="102" size="4.8" fill="#9ca3af">
        ARM CPU
      </Text>

      <rect x="166" y="75" width="43" height="31" rx="4" fill="#111827" stroke="#4b5563" strokeWidth="2" />
      <Text x="187.5" y="93" size="5.5" fill="#d1d5db">
        RAM
      </Text>

      <rect x="54" y="83" width="31" height="25" rx="4" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
      <Text x="69.5" y="98" size="4.9" fill="#cbd5e1">
        WiFi
      </Text>

      <rect x="32" y="50" width="24" height="11" rx="2" fill="#1f2937" stroke="#334155" />
      <rect x="31" y="66" width="25" height="12" rx="2" fill="#1f2937" stroke="#334155" />

      <rect x="60" y="122" width="10" height="49" rx="3" fill="#c9a74c" stroke="#80662a" strokeWidth="2" />
      <rect x="180" y="122" width="10" height="49" rx="3" fill="#c9a74c" stroke="#80662a" strokeWidth="2" />

      <rect x="229" y="47" width="34" height="23" rx="4" fill="url(#rpiMetal)" stroke="#747d86" strokeWidth="3" />
      <rect x="229" y="75" width="34" height="23" rx="4" fill="url(#rpiMetal)" stroke="#747d86" strokeWidth="3" />
      <rect x="229" y="103" width="34" height="23" rx="4" fill="url(#rpiMetal)" stroke="#747d86" strokeWidth="3" />
      <rect x="229" y="131" width="34" height="23" rx="4" fill="url(#rpiMetal)" stroke="#747d86" strokeWidth="3" />

      <rect x="177" y="121" width="49" height="38" rx="5" fill="url(#rpiEthernet)" stroke="#7b632d" strokeWidth="3" />
      <rect x="185" y="131" width="33" height="15" rx="2" fill="rgba(0,0,0,0.18)" />

      <rect x="112" y="171" width="48" height="14" rx="7" fill="#d8d8d8" stroke="#737373" strokeWidth="2" />
      <rect x="41" y="172" width="34" height="12" rx="3" fill="#222" stroke="#777" strokeWidth="2" />
      <rect x="80" y="172" width="34" height="12" rx="3" fill="#222" stroke="#777" strokeWidth="2" />

      <circle cx="43" cy="43" r="4.5" fill={running ? "#22c55e" : "#555"} stroke="#e5e7eb" strokeWidth="1" />
      {running && <circle cx="43" cy="43" r="9" fill="rgba(34,197,94,0.18)" />}
    </SvgBase>
  );
}

/* ─────────────────────────────────────────────
   MQ-135 / MQ-2 — capsule métallique + carte bleue
   ───────────────────────────────────────────── */

export function MqSensorSvg({ width, height, type, name, liveValue }) {
  const isMq135 = type === "mq135";
  const label = isMq135 ? "MQ-135" : "MQ-2";
  const accent = isMq135 ? "#1e4f8f" : "#7f1d1d";

  return (
    <SvgBase width={width} height={height} className="svg-mq-real" viewBox="0 0 120 110">
      <defs>
        <linearGradient id={`mqBoard-${type}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#2e6fa5" />
          <stop offset="100%" stopColor="#123c6b" />
        </linearGradient>

        <radialGradient id={`mqMetalCap-${type}`} cx="40%" cy="25%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#d8d8d8" />
          <stop offset="70%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </radialGradient>

        <linearGradient id={`mqRing-${type}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="45%" stopColor="#c9c9c9" />
          <stop offset="100%" stopColor="#7f7f7f" />
        </linearGradient>

        <filter id={`mqShadow-${type}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.28" />
        </filter>

        <pattern id={`mqMesh-${type}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 4 L4 0 M-1 1 L1 -1 M3 5 L5 3" stroke="#777" strokeWidth=".6" opacity=".65" />
        </pattern>
      </defs>

      <path
        d="M 12 42 L 102 29 L 114 79 L 24 96 Z"
        fill="url(#mqBoard)"
        stroke="#0e2f52"
        strokeWidth="2"
        filter={`url(#mqShadow-${type})`}
      />

      <circle cx="21" cy="48" r="5" fill="#dbeafe" stroke="#8fb4d8" strokeWidth="2" />
      <circle cx="102" cy="37" r="5" fill="#dbeafe" stroke="#8fb4d8" strokeWidth="2" />
      <circle cx="103" cy="73" r="5" fill="#dbeafe" stroke="#8fb4d8" strokeWidth="2" />

      <ellipse cx="54" cy="39" rx="34" ry="27" fill={`url(#mqRing-${type})`} stroke="#777" strokeWidth="2" />
      <ellipse cx="54" cy="30" rx="28" ry="25" fill={`url(#mqMetalCap-${type})`} stroke="#777" strokeWidth="2.5" />
      <ellipse cx="54" cy="28" rx="24" ry="21" fill={`url(#mqMesh-${type})`} opacity=".9" />

      <path d="M 28 55 Q 54 68 82 55" fill="none" stroke="#5f5f5f" strokeWidth="2" />
      <Text x="54" y="60" size="13" fill="#333">
        {label}
      </Text>

      <rect x="48" y="72" width="28" height="22" rx="3" fill="#2058b8" stroke="#153875" strokeWidth="3" />
      <line x1="53" y1="77" x2="53" y2="90" stroke="#7da2ff" strokeWidth="2" />
      <line x1="60" y1="77" x2="60" y2="90" stroke="#7da2ff" strokeWidth="2" />
      <line x1="67" y1="77" x2="67" y2="90" stroke="#7da2ff" strokeWidth="2" />

      <rect x="81" y="63" width="16" height="10" rx="2" fill="#111" />
      <circle cx="101" cy="57" r="2.6" fill="#e5e7eb" />
      <circle cx="108" cy="56" r="2.6" fill="#e5e7eb" />
      <circle cx="101" cy="65" r="2.6" fill="#e5e7eb" />
      <circle cx="108" cy="64" r="2.6" fill="#e5e7eb" />

      <line x1="102" y1="83" x2="118" y2="83" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="101" y1="90" x2="118" y2="90" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="100" y1="97" x2="117" y2="97" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />

      <LiveBox x="61" y="103" value={liveValue} color={isMq135 ? "#0f3f75" : "#9b1c1c"} width="84" />
    </SvgBase>
  );
}

/* ─────────────────────────────────────────────
   DHT22 / DHT11 module — grille blanche + PCB noir
   ───────────────────────────────────────────── */

export function Dht22Svg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-dht-real" viewBox="0 0 100 130">
      <defs>
        <linearGradient id="dhtWhite" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f1efe9" />
          <stop offset="100%" stopColor="#d7d2c6" />
        </linearGradient>

        <filter id="dhtShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.22" />
        </filter>
      </defs>

      <rect x="15" y="9" width="68" height="70" rx="9" fill="url(#dhtWhite)" stroke="#dfdbd1" strokeWidth="2" filter="url(#dhtShadow)" />

      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 5 }).map((__, col) => (
          <rect
            key={`${row}-${col}`}
            x={25 + col * 11}
            y={20 + row * 10}
            width="7"
            height="7"
            rx="1.5"
            fill="#4b4b4b"
            opacity=".55"
          />
        ))
      )}

      <path d="M 19 80 L 88 80 L 95 120 L 26 120 Z" fill="#101010" stroke="#2a2a2a" strokeWidth="2" />

      <circle cx="72" cy="101" r="11" fill="#d1d5db" stroke="#777" strokeWidth="2" />
      <circle cx="72" cy="101" r="6" fill="#e5e7eb" stroke="#888" />

      <rect x="36" y="87" width="22" height="12" rx="2" fill="#111" />
      <circle cx="30" cy="105" r="2" fill="#e5e7eb" />
      <circle cx="37" cy="105" r="2" fill="#e5e7eb" />
      <circle cx="44" cy="105" r="2" fill="#e5e7eb" />
      <circle cx="51" cy="105" r="2" fill="#e5e7eb" />

      <line x1="72" y1="120" x2="72" y2="130" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="84" y1="120" x2="84" y2="130" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="96" y1="120" x2="96" y2="130" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />

      <Text x="49" y="70" size="7" fill="#c7bfb0">
        DHT22
      </Text>

      <LiveBox x="50" y="112" value={liveValue} color="#1e7a34" width="86" />
    </SvgBase>
  );
}

/* ─────────────────────────────────────────────
   Breadboard — trous carrés, colonnes, rails
   ───────────────────────────────────────────── */

export function BreadboardSvg({ width, height }) {
  return (
    <SvgBase width={width} height={height} className="svg-breadboard-real" viewBox="0 0 300 110">
      <defs>
        <linearGradient id="bbBody" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff5c9" />
          <stop offset="45%" stopColor="#f5eab5" />
          <stop offset="100%" stopColor="#dfd198" />
        </linearGradient>

        <filter id="bbInset">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity=".18" />
        </filter>
      </defs>

      <rect x="2" y="2" width="296" height="106" rx="6" fill="url(#bbBody)" stroke="#c8b84a" strokeWidth="2.5" />

      <rect x="13" y="8" width="31" height="94" rx="4" fill="#fff8d6" stroke="#e5dca9" />
      <rect x="255" y="8" width="31" height="94" rx="4" fill="#fff8d6" stroke="#e5dca9" />

      <line x1="20" y1="16" x2="20" y2="94" stroke="#d21f1f" strokeWidth="2" />
      <line x1="37" y1="16" x2="37" y2="94" stroke="#1d5fd1" strokeWidth="2" />
      <line x1="262" y1="16" x2="262" y2="94" stroke="#d21f1f" strokeWidth="2" />
      <line x1="279" y1="16" x2="279" y2="94" stroke="#1d5fd1" strokeWidth="2" />

      {Array.from({ length: 15 }).map((_, row) =>
        Array.from({ length: 2 }).map((__, col) => (
          <rect
            key={`rail-l-${row}-${col}`}
            x={24 + col * 10}
            y={18 + row * 5.1}
            width="6"
            height="4"
            rx="1"
            fill="#806e2e"
            filter="url(#bbInset)"
          />
        ))
      )}

      {Array.from({ length: 15 }).map((_, row) =>
        Array.from({ length: 2 }).map((__, col) => (
          <rect
            key={`rail-r-${row}-${col}`}
            x={266 + col * 10}
            y={18 + row * 5.1}
            width="6"
            height="4"
            rx="1"
            fill="#806e2e"
            filter="url(#bbInset)"
          />
        ))
      )}

      <rect x="55" y="8" width="190" height="94" rx="3" fill="#fff2bf" stroke="#e0d092" />
      <rect x="145" y="8" width="12" height="94" fill="#b99e56" opacity=".7" />

      {["A", "B", "C", "D", "E"].map((letter, i) => (
        <Text key={`top-l-${letter}`} x={70 + i * 14} y="15" size="7" fill="#222">
          {letter}
        </Text>
      ))}
      {["F", "G", "H", "I", "J"].map((letter, i) => (
        <Text key={`top-r-${letter}`} x={172 + i * 14} y="15" size="7" fill="#222">
          {letter}
        </Text>
      ))}

      {Array.from({ length: 20 }).map((_, row) => (
        <Text key={`num-l-${row}`} x="61" y={25 + row * 3.7} size="4.8" fill="#333">
          {row + 1}
        </Text>
      ))}

      {Array.from({ length: 20 }).map((_, row) => (
        <Text key={`num-r-${row}`} x="239" y={25 + row * 3.7} size="4.8" fill="#333">
          {row + 1}
        </Text>
      ))}

      {Array.from({ length: 20 }).map((_, row) =>
        Array.from({ length: 5 }).map((__, col) => (
          <rect
            key={`holes-l-${row}-${col}`}
            x={68 + col * 14}
            y={20 + row * 3.9}
            width="7"
            height="3.2"
            rx="1"
            fill="#7f6b2a"
            filter="url(#bbInset)"
          />
        ))
      )}

      {Array.from({ length: 20 }).map((_, row) =>
        Array.from({ length: 5 }).map((__, col) => (
          <rect
            key={`holes-r-${row}-${col}`}
            x={170 + col * 14}
            y={20 + row * 3.9}
            width="7"
            height="3.2"
            rx="1"
            fill="#7f6b2a"
            filter="url(#bbInset)"
          />
        ))
      )}
    </SvgBase>
  );
}

/* ─────────────────────────────────────────────
   Autres composants : conservés en SVG cohérents
   ───────────────────────────────────────────── */

export function Bmp280Svg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-bmp">
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill="#cfe7ff" stroke="#1558a0" strokeWidth="3" />
      <circle cx="13" cy="13" r="6" fill="#e8f4ff" stroke="#1558a0" strokeWidth="3" />
      <circle cx={width - 13} cy="13" r="6" fill="#e8f4ff" stroke="#1558a0" strokeWidth="3" />
      <rect x={width / 2 - 18} y="22" width="36" height="32" rx="4" fill="#10192f" stroke="#263f6e" strokeWidth="2" />
      <Text x={width / 2} y="42" size="7" fill="#6ab0ff">BMP</Text>
      <LiveBox x={width / 2} y="68" value={liveValue} color="#1558a0" />
      <Text x={width / 2} y={height - 17} size="10" fill="#1558a0">BMP280</Text>
    </SvgBase>
  );
}

export function PirSvg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-pir">
      <defs>
        <radialGradient id="pirDomeReal" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#d6c8f0" />
          <stop offset="100%" stopColor="#9b84ce" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill="#eee5ff" stroke="#6b35b0" strokeWidth="3" />
      <circle cx={width / 2} cy="30" r="24" fill="url(#pirDomeReal)" stroke="#6b35b0" strokeWidth="3" />
      <circle cx={width / 2 - 8} cy="22" r="5" fill="rgba(255,255,255,0.55)" />
      <rect x={width / 2 - 13} y="58" width="26" height="10" rx="2" fill="#111" />
      <LiveBox x={width / 2} y="62" value={liveValue} color="#6b35b0" />
      <Text x={width / 2} y={height - 12} size="8" fill="#6b35b0">PIR</Text>
    </SvgBase>
  );
}

export function SoilMoistureSvg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-soil">
      <rect x="18" y="2" width={width - 36} height="34" rx="6" fill="#28231c" />
      <Text x={width / 2} y="23" size="7" fill="#ffffff">SOIL MOISTURE</Text>
      <path d={`M ${width * 0.22} 32 L ${width * 0.46} 32 L ${width * 0.38} ${height - 8} Q ${width * 0.34} ${height - 2} ${width * 0.29} ${height - 8} Z`} fill="#d7bd75" stroke="#a88742" strokeWidth="2" />
      <path d={`M ${width * 0.54} 32 L ${width * 0.78} 32 L ${width * 0.71} ${height - 8} Q ${width * 0.66} ${height - 2} ${width * 0.62} ${height - 8} Z`} fill="#d7bd75" stroke="#a88742" strokeWidth="2" />
      <LiveBox x={width / 2} y={height / 2 + 5} value={liveValue} color="#6b4d22" />
    </SvgBase>
  );
}

export function PressureSensorSvg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-pressure">
      <defs>
        <linearGradient id="pressureBlackReal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#383838" />
          <stop offset="100%" stopColor="#090909" />
        </linearGradient>
        <linearGradient id="pressureMetalReal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f0f0f0" />
          <stop offset="45%" stopColor="#b7b7b7" />
          <stop offset="100%" stopColor="#7d848a" />
        </linearGradient>
      </defs>
      <rect x="27" y="1" width="62" height="60" rx="9" fill="url(#pressureBlackReal)" />
      <circle cx="58" cy="12" r="6" fill="#e0e0e0" stroke="#777" strokeWidth="2" />
      <path d="M 26 23 L 4 23 Q -1 23 -1 28 L -1 42 Q -1 47 4 47 L 26 47 Z" fill="#111" stroke="#2a2a2a" strokeWidth="5" />
      <circle cx="7" cy="35" r="11" fill="#050505" stroke="#252525" strokeWidth="5" />
      <rect x="31" y="58" width="53" height="24" rx="5" fill="#111" />
      <rect x="23" y="80" width="69" height="34" rx="6" fill="url(#pressureMetalReal)" stroke="#777" strokeWidth="2" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="34" y={112 + i * 4} width="48" height="2" fill={i % 2 ? "#7f878d" : "#d8d8d8"} />
      ))}
      <rect x="33" y="111" width="49" height="32" rx="3" fill="transparent" stroke="#777" strokeWidth="2" />
      <LiveBox x="58" y="72" value={liveValue} color="#222" />
    </SvgBase>
  );
}

export function WifiSvg({ width, height, type }) {
  const isWifi = type === "wifi";
  const border = isWifi ? "#0f7a6b" : "#1558a0";
  const bg = isWifi ? "#c0f0e8" : "#b8d8f8";
  const label = isWifi ? "ESP8266" : "HC-05";

  return (
    <SvgBase width={width} height={height} className="svg-wireless">
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill={bg} stroke={border} strokeWidth="3" />
      <rect x="15" y="18" width="35" height="24" rx="4" fill="#111" />
      {isWifi ? (
        <>
          <path d={`M ${width - 38} 25 Q ${width - 23} 8 ${width - 8} 25`} fill="none" stroke={border} strokeWidth="4" />
          <path d={`M ${width - 31} 30 Q ${width - 23} 20 ${width - 15} 30`} fill="none" stroke={border} strokeWidth="3" />
        </>
      ) : (
        <Text x={width - 25} y="33" size="18" fill={border}>BT</Text>
      )}
      <Text x={width / 2} y={height - 22} size="11" fill={border}>{label}</Text>
      <Text x={width / 2} y={height - 10} size="7" fill="#44665f">UART MODULE</Text>
    </SvgBase>
  );
}

export function RelaySvg({ width, height }) {
  return (
    <SvgBase width={width} height={height} className="svg-relay">
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill="#e5d7f8" stroke="#6b35b0" strokeWidth="3" />
      <rect x={width / 2 - 31} y="8" width="62" height="34" rx="5" fill="#1e4080" stroke="#0a2060" strokeWidth="2" />
      <Text x={width / 2} y="28" size="7" fill="#9bbcff">RELAY 5V</Text>
      <rect x="18" y="47" width="13" height="15" rx="2" fill="#c7c7c7" stroke="#888" />
      <rect x={width / 2 - 6} y="47" width="13" height="15" rx="2" fill="#c7c7c7" stroke="#888" />
      <rect x={width - 31} y="47" width="13" height="15" rx="2" fill="#c7c7c7" stroke="#888" />
    </SvgBase>
  );
}

export function BuzzerSvg({ width, height, running }) {
  return (
    <SvgBase width={width} height={height} className="svg-buzzer">
      <defs>
        <radialGradient id="buzzGradReal" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill="#f8caca" stroke="#b52020" strokeWidth="3" />
      {running && <circle cx={width / 2} cy="29" r="28" fill="rgba(181,32,32,.12)" />}
      <circle cx={width / 2} cy="28" r="22" fill="url(#buzzGradReal)" stroke="#222" strokeWidth="4" />
      <circle cx={width / 2} cy="28" r="6" fill="#555" stroke="#777" strokeWidth="2" />
      <Text x={width / 2} y={height - 8} size="8" fill="#b52020">BUZZER</Text>
    </SvgBase>
  );
}

export function OledSvg({ width, height, sensorData }) {
  return (
    <SvgBase width={width} height={height} className="svg-oled">
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="8" fill="#1a1a2e" stroke="#1558a0" strokeWidth="3" />
      <rect x="10" y="9" width={width - 20} height={height - 18} rx="4" fill="#00111f" stroke="#0a3060" strokeWidth="2" />
      {sensorData ? (
        <>
          <Text x={width / 2} y="24" size="7" fill="#7ee7ff">AIR MONITOR</Text>
          <Text x={width / 2} y="39" size="9" fill="#ffd166">{sensorData.temperature} C</Text>
          <Text x={width / 2} y="52" size="9" fill="#00d4ff">{sensorData.co2} PPM</Text>
        </>
      ) : (
        <>
          <Text x={width / 2} y="29" size="8" fill="#7ee7ff">OLED 0.96</Text>
          <Text x={width / 2} y="45" size="8" fill="#ffd166">128 x 64</Text>
        </>
      )}
    </SvgBase>
  );
}

export function ResistorSvg({ width, height, type }) {
  const is220 = type === "res220";
  const bands = is220
    ? ["#c00", "#c00", "#8b4513", "#d4b82a"]
    : ["#8b4513", "#000", "#ff8800", "#d4b82a"];

  const centerY = height / 2;

  return (
    <SvgBase width={width} height={height} className="svg-resistor">
      <line x1="0" y1={centerY} x2={width / 2 - 22} y2={centerY} stroke="#b69b50" strokeWidth="3" />
      <rect x={width / 2 - 22} y={centerY - 8} width="44" height="16" rx="7" fill="#f0d89c" stroke="#b69b50" />
      {bands.map((color, i) => (
        <rect key={i} x={width / 2 - 14 + i * 8} y={centerY - 8} width="4" height="16" fill={color} />
      ))}
      <line x1={width / 2 + 22} y1={centerY} x2={width} y2={centerY} stroke="#b69b50" strokeWidth="3" />
    </SvgBase>
  );
}

export function LedSvg({ width, height, type, running }) {
  const isGreen = type === "led_g";
  const color = isGreen ? "#1e7a34" : "#b52020";

  return (
    <SvgBase width={width} height={height} className="svg-led">
      <defs>
        <radialGradient id={`ledReal-${type}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor={running ? color : "rgba(255,255,255,.45)"} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      {running && <circle cx={width / 2} cy="23" r="24" fill={isGreen ? "rgba(30,122,52,.15)" : "rgba(181,32,32,.15)"} />}
      <path d={`M ${width / 2 - 13} 24 Q ${width / 2} 2 ${width / 2 + 13} 24 L ${width / 2 + 9} 41 L ${width / 2 - 9} 41 Z`} fill={`url(#ledReal-${type})`} stroke={color} strokeWidth="3" />
      <line x1={width / 2 - 7} y1="42" x2={width / 2 - 7} y2={height} stroke="#aaa" strokeWidth="2" />
      <line x1={width / 2 + 7} y1="42" x2={width / 2 + 7} y2={height} stroke="#aaa" strokeWidth="2" />
    </SvgBase>
  );
}

export function JumperSvg({ width, height }) {
  return (
    <SvgBase width={width} height={height} className="svg-jumper">
      <path d={`M 18 16 C ${width * 0.32} 0, ${width * 0.68} 3, ${width - 18} 20`} stroke="#e53935" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={`M 18 31 C ${width * 0.35} 16, ${width * 0.70} 18, ${width - 18} 36`} stroke="#222" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={`M 18 47 C ${width * 0.35} 31, ${width * 0.70} 34, ${width - 18} 52`} stroke="#d9a100" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={`M 18 63 C ${width * 0.35} 48, ${width * 0.70} 50, ${width - 18} 68`} stroke="#1e88e5" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="4" y="8" width="25" height="18" rx="3" fill="#111" stroke="#444" strokeWidth="1.5" />
      <rect x="4" y="27" width="25" height="18" rx="3" fill="#111" stroke="#444" strokeWidth="1.5" />
      <rect x="4" y="46" width="25" height="18" rx="3" fill="#111" stroke="#444" strokeWidth="1.5" />
      <rect x={width - 29} y="13" width="25" height="18" rx="3" fill="#111" stroke="#444" strokeWidth="1.5" />
      <rect x={width - 29} y="33" width="25" height="18" rx="3" fill="#111" stroke="#444" strokeWidth="1.5" />
      <rect x={width - 29} y="53" width="25" height="18" rx="3" fill="#111" stroke="#444" strokeWidth="1.5" />
    </SvgBase>
  );
}

export function CapacitorSvg({ width, height }) {
  return (
    <SvgBase width={width} height={height} className="svg-capacitor">
      <defs>
        <linearGradient id="capGradReal" x1="0" x2="1">
          <stop offset="0%" stopColor="#6b35b0" />
          <stop offset="100%" stopColor="#28134c" />
        </linearGradient>
      </defs>
      <rect x={width / 2 - 13} y="8" width="26" height="38" rx="6" fill="url(#capGradReal)" stroke="#3e1f6b" strokeWidth="2" />
      <Text x={width / 2} y="31" size="6" fill="#fff">100uF</Text>
      <line x1={width / 2 - 7} y1="46" x2={width / 2 - 7} y2={height} stroke="#aaa" strokeWidth="2" />
      <line x1={width / 2 + 7} y1="46" x2={width / 2 + 7} y2={height} stroke="#aaa" strokeWidth="2" />
    </SvgBase>
  );
}

export function TransistorSvg({ width, height }) {
  return (
    <SvgBase width={width} height={height} className="svg-transistor">
      <path d={`M ${width / 2 - 19} 36 Q ${width / 2} 8 ${width / 2 + 19} 36 L ${width / 2 + 19} 43 L ${width / 2 - 19} 43 Z`} fill="#111" stroke="#333" strokeWidth="2" />
      <Text x={width / 2} y="34" size="6.5" fill="#aaa">BC547</Text>
      <line x1={width / 2 - 14} y1="43" x2={width / 2 - 18} y2={height} stroke="#aaa" strokeWidth="2" />
      <line x1={width / 2} y1="43" x2={width / 2} y2={height} stroke="#aaa" strokeWidth="2" />
      <line x1={width / 2 + 14} y1="43" x2={width / 2 + 18} y2={height} stroke="#aaa" strokeWidth="2" />
      <Text x={width / 2 - 18} y={height - 3} size="6" fill="#666">B</Text>
      <Text x={width / 2} y={height - 3} size="6" fill="#666">C</Text>
      <Text x={width / 2 + 18} y={height - 3} size="6" fill="#666">E</Text>
    </SvgBase>
  );
}

export function PowerSvg({ width, height }) {
  return (
    <SvgBase width={width} height={height} className="svg-power">
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill="#edd276" stroke="#c9a227" strokeWidth="3" />
      <rect x={width / 2 - 29} y="12" width="58" height="30" rx="5" fill="none" stroke="#c9a227" strokeWidth="4" />
      <rect x={width / 2 + 29} y="21" width="6" height="12" rx="2" fill="#c9a227" />
      <rect x={width / 2 - 25} y="16" width="38" height="22" fill="rgba(34,197,94,.45)" />
      <Text x={width / 2} y={height - 18} size="11" fill="#6d4d05">5V / 3A</Text>
      <Text x={width / 2} y={height - 7} size="7" fill="#6d4d05">POWER</Text>
    </SvgBase>
  );
}

export function GndSvg({ width, height }) {
  return (
    <SvgBase width={width} height={height} className="svg-gnd">
      <line x1={width / 2} y1="8" x2={width / 2} y2="16" stroke="#222" strokeWidth="3" />
      <line x1={width / 2 - 20} y1="17" x2={width / 2 + 20} y2="17" stroke="#222" strokeWidth="3" />
      <line x1={width / 2 - 13} y1="24" x2={width / 2 + 13} y2="24" stroke="#222" strokeWidth="3" />
      <line x1={width / 2 - 7} y1="31" x2={width / 2 + 7} y2="31" stroke="#222" strokeWidth="3" />
      <Text x={width / 2} y={height - 4} size="8" fill="#444">GND</Text>
    </SvgBase>
  );
}

export function GenericSvg({ width, height, name, emoji }) {
  return (
    <SvgBase width={width} height={height} className="svg-generic">
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="10" fill="#ffffff" stroke="#e8d99a" strokeWidth="2" />
      <Text x={width / 2} y={height / 2 - 4} size="14" fill="#c9a227">{emoji || "?"}</Text>
      <Text x={width / 2} y={height / 2 + 14} size="8" fill="#241805">{name}</Text>
    </SvgBase>
  );
}