import { SvgBase, Text, LiveBox } from "./VisualHelpers";

export default function Dht22Svg({ width, height, liveValue }) {
  return (
    <SvgBase width={width} height={height} className="svg-dht-real" viewBox="0 0 120 160">
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

      <rect x="22" y="12" width="76" height="82" rx="10" fill="url(#dhtWhite)" stroke="#dfdbd1" strokeWidth="2" filter="url(#dhtShadow)" />

      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 5 }).map((__, col) => (
          <rect
            key={`${row}-${col}`}
            x={34 + col * 11}
            y={24 + row * 11}
            width="7"
            height="7"
            rx="1.5"
            fill="#4b4b4b"
            opacity="0.55"
          />
        ))
      )}

      <Text x="60" y="87" size="7" fill="#c7bfb0">
        DHT22
      </Text>

      <rect x="17" y="96" width="86" height="49" rx="4" fill="#101010" stroke="#2a2a2a" strokeWidth="2" />

      <circle cx="82" cy="120" r="12" fill="#d1d5db" stroke="#777" strokeWidth="2" />
      <circle cx="82" cy="120" r="6" fill="#e5e7eb" stroke="#888" />

      <rect x="35" y="106" width="26" height="13" rx="2" fill="#111" />

      <line x1="74" y1="145" x2="74" y2="160" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="89" y1="145" x2="89" y2="160" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="104" y1="145" x2="104" y2="160" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />

      <LiveBox x="60" y="139" value={liveValue} color="#1e7a34" width="94" />
    </SvgBase>
  );
}