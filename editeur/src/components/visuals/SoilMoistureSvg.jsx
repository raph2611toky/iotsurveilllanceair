import { SvgBase, Text, LiveBox } from "./VisualHelpers";

export default function SoilMoistureSvg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-soil" viewBox="0 0 150 240">
      <defs>
        <linearGradient id="soilProbe" x1="0" x2="1">
          <stop offset="0%" stopColor="#f4e5b5" />
          <stop offset="100%" stopColor="#c6a85c" />
        </linearGradient>
      </defs>

      <rect x="22" y="2" width="106" height="38" rx="6" fill="#28231c" />
      <Text x="75" y="25" size="8" fill="#ffffff">
        SOIL MOISTURE
      </Text>

      <line x1="30" y1="0" x2="30" y2="18" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="58" y1="0" x2="58" y2="18" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="86" y1="0" x2="86" y2="18" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="114" y1="0" x2="114" y2="18" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />

      <path
        d="M 30 38 L 67 38 L 56 225 Q 49 238 41 225 Z"
        fill="url(#soilProbe)"
        stroke="#a88742"
        strokeWidth="2"
      />

      <path
        d="M 83 38 L 120 38 L 109 225 Q 101 238 94 225 Z"
        fill="url(#soilProbe)"
        stroke="#a88742"
        strokeWidth="2"
      />

      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={`l-${i}`} x="38" y={60 + i * 18} width="24" height="7" rx="3" fill="#fff7dd" stroke="#cbb87b" />
      ))}

      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={`r-${i}`} x="91" y={60 + i * 18} width="24" height="7" rx="3" fill="#fff7dd" stroke="#cbb87b" />
      ))}

      <LiveBox x="75" y="132" value={liveValue} color="#6b4d22" width="72" />
    </SvgBase>
  );
}