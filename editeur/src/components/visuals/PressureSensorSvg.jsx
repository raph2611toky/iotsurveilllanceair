import { SvgBase, LiveBox } from "./VisualHelpers";

export default function PressureSensorSvg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-pressure" viewBox="0 0 120 170">
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

      <rect x="33" y="22" width="70" height="68" rx="10" fill="url(#pressureBlackReal)" />
      <circle cx="68" cy="35" r="7" fill="#e0e0e0" stroke="#777" strokeWidth="2" />

      <path d="M 32 48 L 5 48 Q 0 48 0 54 L 0 70 Q 0 76 5 76 L 32 76 Z" fill="#111" stroke="#2a2a2a" strokeWidth="5" />
      <circle cx="10" cy="62" r="12" fill="#050505" stroke="#252525" strokeWidth="5" />

      <rect x="39" y="88" width="58" height="26" rx="5" fill="#111" />
      <rect x="29" y="110" width="78" height="38" rx="6" fill="url(#pressureMetalReal)" stroke="#777" strokeWidth="2" />

      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="43" y={147 + i * 3} width="50" height="2" fill={i % 2 ? "#7f878d" : "#d8d8d8"} />
      ))}

      <rect x="42" y="146" width="52" height="24" rx="3" fill="transparent" stroke="#777" strokeWidth="2" />

      <line x1="35" y1="6" x2="35" y2="22" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="60" y1="6" x2="60" y2="22" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="85" y1="6" x2="85" y2="22" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />

      <LiveBox x="68" y="104" value={liveValue} color="#222" width="84" />
    </SvgBase>
  );
}