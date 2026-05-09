import { SvgBase, Text, LiveBox } from "./VisualHelpers";

export function Bmp280Svg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-bmp">
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill="#cfe7ff" stroke="#1558a0" strokeWidth="3" />
      <circle cx="13" cy="13" r="6" fill="#e8f4ff" stroke="#1558a0" strokeWidth="3" />
      <circle cx={width - 13} cy="13" r="6" fill="#e8f4ff" stroke="#1558a0" strokeWidth="3" />
      <rect x={width / 2 - 18} y="22" width="36" height="32" rx="4" fill="#10192f" stroke="#263f6e" strokeWidth="2" />
      <Text x={width / 2} y="42" size="7" fill="#6ab0ff">BMP</Text>
      <LiveBox x={width / 2} y="68" value={liveValue} color="#1558a0" width="66" />
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
      <LiveBox x={width / 2} y="62" value={liveValue} color="#6b35b0" width="58" />
      <Text x={width / 2} y={height - 12} size="8" fill="#6b35b0">PIR</Text>
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
      <Text x={width / 2} y={height - 10} size="7" fill="#44665f">UART</Text>
    </SvgBase>
  );
}

export function RelaySvg({ width, height }) {
  return (
    <SvgBase width={width} height={height} className="svg-relay">
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill="#e5d7f8" stroke="#6b35b0" strokeWidth="3" />
      <rect x={width / 2 - 31} y="8" width="62" height="34" rx="5" fill="#1e4080" stroke="#0a2060" strokeWidth="2" />
      <Text x={width / 2} y="28" size="7" fill="#9bbcff">RELAY 5V</Text>
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
      <path
        d={`M ${width / 2 - 13} 24 Q ${width / 2} 2 ${width / 2 + 13} 24 L ${width / 2 + 9} 41 L ${width / 2 - 9} 41 Z`}
        fill={`url(#ledReal-${type})`}
        stroke={color}
        strokeWidth="3"
      />
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
      <path
        d={`M ${width / 2 - 19} 36 Q ${width / 2} 8 ${width / 2 + 19} 36 L ${width / 2 + 19} 43 L ${width / 2 - 19} 43 Z`}
        fill="#111"
        stroke="#333"
        strokeWidth="2"
      />
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