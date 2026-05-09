import { SvgBase, Text, LiveBox } from "./VisualHelpers";

export default function MqSensorSvg({ width, height, type, liveValue }) {
  const isMq135 = type === "mq135";
  const label = isMq135 ? "MQ-135" : "MQ-2";

  return (
    <SvgBase width={width} height={height} className="svg-mq-real" viewBox="0 0 150 120">
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
          <path d="M0 4 L4 0 M-1 1 L1 -1 M3 5 L5 3" stroke="#777" strokeWidth="0.6" opacity="0.65" />
        </pattern>
      </defs>

      <rect
        x="7"
        y="17"
        width="132"
        height="90"
        rx="6"
        fill={`url(#mqBoard-${type})`}
        stroke="#0e2f52"
        strokeWidth="2"
        filter={`url(#mqShadow-${type})`}
      />

      <circle cx="19" cy="29" r="5" fill="#dbeafe" stroke="#8fb4d8" strokeWidth="2" />
      <circle cx="128" cy="29" r="5" fill="#dbeafe" stroke="#8fb4d8" strokeWidth="2" />
      <circle cx="19" cy="96" r="5" fill="#dbeafe" stroke="#8fb4d8" strokeWidth="2" />
      <circle cx="128" cy="96" r="5" fill="#dbeafe" stroke="#8fb4d8" strokeWidth="2" />

      <ellipse cx="56" cy="52" rx="35" ry="28" fill={`url(#mqRing-${type})`} stroke="#777" strokeWidth="2" />
      <ellipse cx="56" cy="43" rx="29" ry="25" fill={`url(#mqMetalCap-${type})`} stroke="#777" strokeWidth="2.5" />
      <ellipse cx="56" cy="41" rx="25" ry="21" fill={`url(#mqMesh-${type})`} opacity="0.9" />

      <path d="M 29 62 Q 56 76 85 62" fill="none" stroke="#5f5f5f" strokeWidth="2" />
      <Text x="56" y="68" size="13" fill="#333">
        {label}
      </Text>

      <rect x="48" y="82" width="30" height="24" rx="3" fill="#2058b8" stroke="#153875" strokeWidth="3" />
      <rect x="90" y="74" width="20" height="12" rx="2" fill="#111" />

      <line x1="138" y1="38" x2="150" y2="38" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="138" y1="58" x2="150" y2="58" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="138" y1="78" x2="150" y2="78" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
      <line x1="138" y1="98" x2="150" y2="98" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />

      <Text x="124" y="39" size="5" fill="#fff">VCC</Text>
      <Text x="124" y="59" size="5" fill="#fff">GND</Text>
      <Text x="124" y="79" size="5" fill="#fff">D0</Text>
      <Text x="124" y="99" size="5" fill="#fff">A0</Text>

      <LiveBox
        x="75"
        y="115"
        value={liveValue}
        color={isMq135 ? "#0f3f75" : "#9b1c1c"}
        width="96"
      />
    </SvgBase>
  );
}