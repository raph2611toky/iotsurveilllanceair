import { SvgBase, Text } from "./VisualHelpers";

function PinDot({ x, y, n }) {
  return (
    <g>
      <rect x={x - 5.5} y={y - 4.6} width="11" height="9.2" rx="2" fill="#2a2a2a" />
      <circle cx={x} cy={y} r="4.1" fill="#d8d8d8" stroke="#666" strokeWidth="0.9" />
      <circle cx={x} cy={y} r="1.5" fill="#f9f9f9" />
      <text
        x={x}
        y={y + 1.9}
        fontSize="4.2"
        fill="#101010"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="Segoe UI, Arial, sans-serif"
      >
        {n}
      </text>
    </g>
  );
}

export default function RaspberryPi5Svg({ width, height, running }) {
  const headerStartX = 46;
  const headerStep = 9.9;
  const headerY1 = 30;
  const headerY2 = 42;

  return (
    <SvgBase width={width} height={height} className="svg-rpi5" viewBox="0 0 360 240">
      <defs>
        <linearGradient id="rpiBoardGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#24b47e" />
          <stop offset="45%" stopColor="#11996a" />
          <stop offset="100%" stopColor="#0b7c57" />
        </linearGradient>

        <linearGradient id="rpiMetalGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#d6d6d6" />
          <stop offset="75%" stopColor="#9fa8ae" />
          <stop offset="100%" stopColor="#747d85" />
        </linearGradient>

        <linearGradient id="rpiGoldGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#efd47c" />
          <stop offset="50%" stopColor="#d4ab42" />
          <stop offset="100%" stopColor="#8a641d" />
        </linearGradient>

        <linearGradient id="rpiChipGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b3b3b" />
          <stop offset="100%" stopColor="#0c0c0c" />
        </linearGradient>

        <linearGradient id="rpiConnWhite" x1="0" x2="1">
          <stop offset="0%" stopColor="#fffefc" />
          <stop offset="100%" stopColor="#dad7d1" />
        </linearGradient>

        <pattern id="rpiTraces" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 8 H18 M8 0 V18" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </pattern>

        <filter id="rpiShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.22" />
        </filter>
      </defs>

      <rect
        x="5"
        y="5"
        width="350"
        height="230"
        rx="17"
        fill="url(#rpiBoardGrad)"
        stroke="#0b6c4c"
        strokeWidth="4"
        filter="url(#rpiShadow)"
      />

      <rect
        x="9"
        y="9"
        width="342"
        height="222"
        rx="14"
        fill="url(#rpiTraces)"
        opacity="0.9"
      />

      <circle cx="22" cy="22" r="10" fill="#f1c933" stroke="#8b6811" strokeWidth="4" />
      <circle cx="338" cy="22" r="10" fill="#f1c933" stroke="#8b6811" strokeWidth="4" />
      <circle cx="22" cy="218" r="10" fill="#f1c933" stroke="#8b6811" strokeWidth="4" />
      <circle cx="338" cy="218" r="10" fill="#f1c933" stroke="#8b6811" strokeWidth="4" />

      <Text x="72" y="57" size="9" fill="#f6fff9" anchor="start">
        Raspberry Pi 5
      </Text>
      <Text x="72" y="69" size="6" fill="#d5fff0" anchor="start">
        GPIO INTERFACE
      </Text>

      <g>
        <rect x="34" y="20" width="204" height="33" rx="6" fill="#111111" stroke="#2f2f2f" strokeWidth="2" />

        {Array.from({ length: 20 }).map((_, i) => {
          const x = headerStartX + i * headerStep;
          return <PinDot key={`gpio-top-${i}`} x={x} y={headerY1} n={i * 2 + 1} />;
        })}

        {Array.from({ length: 20 }).map((_, i) => {
          const x = headerStartX + i * headerStep;
          return <PinDot key={`gpio-bottom-${i}`} x={x} y={headerY2} n={i * 2 + 2} />;
        })}

        <Text x="136" y="16" size="6.4" fill="#effff7">
          40 PIN GPIO HEADER
        </Text>
        <Text x="33" y="60" size="5.2" fill="#effff7" anchor="start">
          Pin 1
        </Text>
        <Text x="235" y="60" size="5.2" fill="#effff7" anchor="end">
          Pin 40
        </Text>
      </g>

      <g opacity="0.75">
        <path d="M40 92 C80 78, 118 98, 155 87" fill="none" stroke="#7be4b2" strokeWidth="1" />
        <path d="M57 115 C92 111, 130 128, 173 114" fill="none" stroke="#7be4b2" strokeWidth="1" />
        <path d="M93 181 C128 158, 172 176, 210 150" fill="none" stroke="#7be4b2" strokeWidth="1" />
        <path d="M178 86 C212 98, 230 88, 260 104" fill="none" stroke="#7be4b2" strokeWidth="1" />
        <path d="M176 138 C215 146, 251 131, 288 147" fill="none" stroke="#7be4b2" strokeWidth="1" />
      </g>

      <rect x="104" y="94" width="86" height="62" rx="8" fill="url(#rpiMetalGrad)" stroke="#8b8b8b" strokeWidth="3" />
      <rect x="96" y="58" width="70" height="31" rx="3" fill="url(#rpiChipGrad)" stroke="#59636a" strokeWidth="2" />
      <Text x="131" y="76" size="6.2" fill="#d1d5db">
        RAM
      </Text>

      <rect x="198" y="60" width="50" height="42" rx="4" fill="url(#rpiChipGrad)" stroke="#59636a" strokeWidth="2" />
      <Text x="223" y="78" size="6.2" fill="#d1d5db">
        RP1
      </Text>
      <Text x="223" y="88" size="5" fill="#cdd6dc">
        I/O
      </Text>

      <rect x="263" y="70" width="19" height="19" rx="2" fill="#222" stroke="#666" strokeWidth="1.5" />
      <circle cx="272.5" cy="79.5" r="2.2" fill="#bfbfbf" />
      <circle cx="278.5" cy="79.5" r="2.2" fill="#bfbfbf" />

      <rect x="293" y="28" width="49" height="49" rx="4" fill="url(#rpiMetalGrad)" stroke="#727b82" strokeWidth="3" />
      <rect x="293" y="80" width="49" height="49" rx="4" fill="url(#rpiMetalGrad)" stroke="#727b82" strokeWidth="3" />
      <rect x="287" y="138" width="57" height="57" rx="5" fill="url(#rpiMetalGrad)" stroke="#727b82" strokeWidth="3" />
      <rect x="296" y="157" width="39" height="18" rx="2" fill="rgba(0,0,0,0.12)" />

      <rect x="28" y="150" width="68" height="10" rx="2" fill="#1c1c1c" stroke="#666" strokeWidth="1.5" />
      <rect x="246" y="150" width="68" height="10" rx="2" fill="#1c1c1c" stroke="#666" strokeWidth="1.5" />
      <rect x="31" y="145" width="62" height="5" fill="#d8d1bd" />
      <rect x="249" y="145" width="62" height="5" fill="#d8d1bd" />

      <rect x="15" y="102" width="19" height="22" rx="2" fill="url(#rpiConnWhite)" stroke="#888" strokeWidth="2" />
      <rect x="15" y="132" width="19" height="22" rx="2" fill="url(#rpiConnWhite)" stroke="#888" strokeWidth="2" />

      <rect x="14" y="182" width="28" height="17" rx="4" fill="#dcdcdc" stroke="#7f7f7f" strokeWidth="2" />
      <Text x="28" y="194" size="4.8" fill="#555">
        USB-C
      </Text>

      <rect x="55" y="177" width="18" height="19" rx="3" fill="url(#rpiConnWhite)" stroke="#888" strokeWidth="2" />
      <rect x="82" y="177" width="18" height="19" rx="3" fill="url(#rpiConnWhite)" stroke="#888" strokeWidth="2" />

      <Text x="64" y="206" size="4.8" fill="#f3fff9">
        HDMI
      </Text>
      <Text x="91" y="206" size="4.8" fill="#f3fff9">
        HDMI
      </Text>

      <rect x="112" y="171" width="24" height="26" rx="4" fill="#111" stroke="#666" strokeWidth="2" />
      <circle cx="124" cy="184" r="5.7" fill="#202020" stroke="#8b8b8b" strokeWidth="1.4" />

      <rect x="44" y="78" width="25" height="22" rx="3" fill="url(#rpiMetalGrad)" stroke="#777" strokeWidth="2" />
      <path d="M57 84 C57 88, 63 88, 63 92" stroke="#999" strokeWidth="1.2" fill="none" />
      <path d="M51 91 H63" stroke="#999" strokeWidth="1.2" />

      <path
        d="M55 115
           C60 108, 70 107, 75 113
           C79 107, 89 107, 94 114
           C99 121, 98 131, 89 137
           C83 142, 78 145, 75 150
           C72 145, 66 142, 61 137
           C52 130, 50 121, 55 115 Z"
        fill="#f1f5f9"
        opacity="0.9"
      />

      <rect x="52" y="161" width="21" height="21" rx="2" fill="#2a2a2a" stroke="#555" />
      <rect x="80" y="159" width="23" height="24" rx="2" fill="#333" stroke="#555" />
      <rect x="192" y="110" width="24" height="17" rx="2" fill="#333" stroke="#555" />
      <rect x="224" y="112" width="18" height="13" rx="2" fill="#333" stroke="#555" />

      <circle cx="250" cy="32" r="4.7" fill={running ? "#22c55e" : "#555"} stroke="#e5e7eb" strokeWidth="1" />
      {running && <circle cx="250" cy="32" r="10" fill="rgba(34,197,94,0.18)" />}
    </SvgBase>
  );
}