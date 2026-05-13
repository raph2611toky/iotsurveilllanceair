import { SvgBase } from "./VisualHelpers";

const GPIO_LABELS = [
  ["1", "3V3"], ["2", "5V"],
  ["3", "SDA"], ["4", "5V"],
  ["5", "SCL"], ["6", "GND"],
  ["7", "GP4"], ["8", "TXD"],
  ["9", "GND"], ["10", "RXD"],
  ["11", "GP17"], ["12", "GP18"],
  ["13", "GP27"], ["14", "GND"],
  ["15", "GP22"], ["16", "GP23"],
  ["17", "3V3"], ["18", "GP24"],
  ["19", "MOSI"], ["20", "GND"],
  ["21", "MISO"], ["22", "GP25"],
  ["23", "SCLK"], ["24", "CE0"],
  ["25", "GND"], ["26", "CE1"],
  ["27", "IDSD"], ["28", "IDSC"],
  ["29", "GP5"], ["30", "GND"],
  ["31", "GP6"], ["32", "GP12"],
  ["33", "GP13"], ["34", "GND"],
  ["35", "GP19"], ["36", "GP16"],
  ["37", "GP26"], ["38", "GP20"],
  ["39", "GND"], ["40", "GP21"],
];

const GPIO_START_X = 56;
const GPIO_STEP_X = 12.8;
const GPIO_TOP_Y = 30;
const GPIO_BOTTOM_Y = 42;

function GpioPin({ x, y, number, label, row }) {
  return (
    <g>
      <rect
        x={x - 3.45}
        y={y - 3.45}
        width="6.9"
        height="6.9"
        rx="1"
        fill="#111"
        stroke="#383838"
        strokeWidth="0.55"
      />

      <circle
        cx={x}
        cy={y}
        r="2.35"
        fill="#c8b85a"
        stroke="#8a7b30"
        strokeWidth="0.45"
      />

      <circle cx={x} cy={y} r="0.9" fill="#fff1a0" />

      <text
        x={x}
        y={y + 1}
        fontSize="2.55"
        fill="#111"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="'Courier New', monospace"
      >
        {number}
      </text>

      <text
        x={x}
        y={row === 0 ? y - 6.3 : y + 8.8}
        fontSize="3.05"
        fill="#ffffff"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="'Courier New', monospace"
      >
        {label}
      </text>
    </g>
  );
}

function MetalPort({ x, y, w, h, label, label2 = "", blue = false }) {
  return (
    <g>
      <defs>
        <linearGradient id={`metal-port-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7f7f7" />
          <stop offset="28%" stopColor="#d7d7d7" />
          <stop offset="70%" stopColor="#a9a9a9" />
          <stop offset="100%" stopColor="#747474" />
        </linearGradient>
      </defs>

      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={`url(#metal-port-${x}-${y})`}
        stroke="#737373"
        strokeWidth="1.7"
      />

      <rect
        x={x + 6}
        y={y + 6}
        width={w - 12}
        height={h - 12}
        rx="2"
        fill={blue ? "#173b70" : "#242424"}
        stroke="#555"
        strokeWidth="0.9"
      />

      {blue && (
        <rect
          x={x + 7}
          y={y + 7}
          width={w - 14}
          height="5"
          rx="1"
          fill="#1d8dff"
          opacity="0.9"
        />
      )}

      <line
        x1={x + 6}
        y1={y + 2}
        x2={x + w - 6}
        y2={y + 2}
        stroke="#fff"
        strokeWidth="1"
        opacity="0.65"
      />

      <text
        x={x + w / 2}
        y={y + h / 2 - 1}
        fontSize="6"
        textAnchor="middle"
        fill="#d8d8d8"
        fontWeight="900"
        fontFamily="'Courier New', monospace"
      >
        {label}
      </text>

      {label2 && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 9}
          fontSize="4.5"
          textAnchor="middle"
          fill="#b8b8b8"
          fontWeight="800"
          fontFamily="'Courier New', monospace"
        >
          {label2}
        </text>
      )}
    </g>
  );
}

function EthernetPort({ x, y, w, h }) {
  return (
    <g>
      <defs>
        <linearGradient id="ethernet-metal-wide" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ededed" />
          <stop offset="40%" stopColor="#c9c9c9" />
          <stop offset="100%" stopColor="#8b8b8b" />
        </linearGradient>
      </defs>

      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="5"
        fill="url(#ethernet-metal-wide)"
        stroke="#707070"
        strokeWidth="2"
      />

      <rect
        x={x + 7}
        y={y + 10}
        width={w - 14}
        height={h - 20}
        rx="3"
        fill="#202020"
        stroke="#4a4a4a"
        strokeWidth="1.2"
      />

      <rect
        x={x + 19}
        y={y + 42}
        width={w - 38}
        height="13"
        rx="2"
        fill="#2c2c2c"
        stroke="#5d5d5d"
        strokeWidth="0.8"
      />

      {Array.from({ length: 8 }).map((_, index) => (
        <rect
          key={`eth-contact-${index}`}
          x={x + 20 + index * ((w - 42) / 8)}
          y={y + 14}
          width="3.2"
          height="20"
          fill="#c8a020"
        />
      ))}

      <text
        x={x + w / 2}
        y={y + h - 35}
        fontSize="10"
        textAnchor="middle"
        fill="#cfcfcf"
        fontWeight="900"
        fontFamily="'Courier New', monospace"
      >
        TRXCOM
      </text>

      <text
        x={x + w / 2}
        y={y + h - 23}
        fontSize="6.4"
        textAnchor="middle"
        fill="#bdbdbd"
        fontWeight="900"
        fontFamily="'Courier New', monospace"
      >
        TRJG0926HENL4R
      </text>

      <text
        x={x + w / 2}
        y={y + h - 12}
        fontSize="6.2"
        textAnchor="middle"
        fill="#b8b8b8"
        fontWeight="800"
        fontFamily="'Courier New', monospace"
      >
        CHINA M 2322
      </text>

      <text
        x={x + w / 2}
        y={y + h + 10}
        fontSize="6"
        textAnchor="middle"
        fill="#c8ffd4"
        fontWeight="900"
        fontFamily="'Courier New', monospace"
      >
        ETHERNET
      </text>

      <circle cx={x + w - 13} cy={y + 13} r="3.2" fill="#f59e0b" />
      <circle cx={x + w - 25} cy={y + 13} r="3.2" fill="#22c55e" opacity="0.9" />
    </g>
  );
}

function FlatPort({ x, y, w, h, label }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="2.5"
        fill="#b8b8b8"
        stroke="#777"
        strokeWidth="1.2"
      />

      <rect
        x={x + 3}
        y={y + 3}
        width={w - 6}
        height={h - 6}
        rx="1"
        fill="#1e1e1e"
      />

      <text
        x={x + w / 2}
        y={y + h + 7}
        fontSize="5"
        textAnchor="middle"
        fill="#eafff5"
        fontWeight="900"
        fontFamily="'Courier New', monospace"
      >
        {label}
      </text>
    </g>
  );
}

function Chip({ x, y, w, h, label, sublabel = "", silver = false }) {
  return (
    <g>
      <defs>
        <linearGradient id={`chip-grad-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="100%">
          {silver ? (
            <>
              <stop offset="0%" stopColor="#eeeeee" />
              <stop offset="48%" stopColor="#c9c9c9" />
              <stop offset="100%" stopColor="#8c8c8c" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#3c3c3c" />
              <stop offset="100%" stopColor="#111" />
            </>
          )}
        </linearGradient>
      </defs>

      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={`url(#chip-grad-${x}-${y})`}
        stroke={silver ? "#999" : "#484848"}
        strokeWidth="1.5"
      />

      {Array.from({ length: Math.max(3, Math.floor(h / 9)) }).map((_, i) => (
        <g key={`chip-pin-${x}-${y}-${i}`}>
          <rect
            x={x - 2.3}
            y={y + 7 + i * 8}
            width="2.3"
            height="3.5"
            fill={silver ? "#aaa" : "#555"}
          />

          <rect
            x={x + w}
            y={y + 7 + i * 8}
            width="2.3"
            height="3.5"
            fill={silver ? "#aaa" : "#555"}
          />
        </g>
      ))}

      <text
        x={x + w / 2}
        y={y + h / 2 - (sublabel ? 3 : 0)}
        fontSize={w > 70 ? "7" : "5.5"}
        textAnchor="middle"
        fill={silver ? "#444" : "#999"}
        fontWeight="900"
        fontFamily="'Courier New', monospace"
      >
        {label}
      </text>

      {sublabel && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 7}
          fontSize="4.5"
          textAnchor="middle"
          fill={silver ? "#666" : "#666"}
          fontFamily="'Courier New', monospace"
        >
          {sublabel}
        </text>
      )}

      <circle cx={x + 7} cy={y + 7} r="2" fill={silver ? "#999" : "#2a2a2a"} />
    </g>
  );
}

function RpiLogo({ x, y, size = 22 }) {
  const s = size / 22;

  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <path
        d="M11 2 C13 2 14.5 4 14 6 C16 5.5 17.5 7 17 9 C18.5 9 19.5 11 18.5 12.5
           C19.5 13.5 19 15.5 17.5 16 C17.5 18 15.5 19.5 13.5 19
           C13 20.5 11.5 21 11 21 C10.5 21 9 20.5 8.5 19
           C6.5 19.5 4.5 18 4.5 16 C3 15.5 2.5 13.5 3.5 12.5
           C2.5 11 3.5 9 5 9 C4.5 7 6 5.5 8 6 C7.5 4 9 2 11 2Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        opacity="0.9"
      />

      <path
        d="M9 3.5 C9.5 1.5 12.5 1.5 13 3.5"
        fill="none"
        stroke="#fff"
        strokeWidth="1.2"
        opacity="0.75"
      />

      {[[8, 9], [11, 8], [14, 9], [7.5, 12], [10.5, 11], [13.5, 12], [9, 15], [12, 15], [11, 18]].map(
        ([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.4" fill="#fff" opacity="0.85" />
        )
      )}
    </g>
  );
}

export default function RaspberryPi5Svg({ width, height, running, powered }) {
  const VW = 520;
  const VH = 340;

  const leftMountX = 28;
  const rightMountX = 330;

  return (
    <SvgBase width={width} height={height} className="svg-rpi5" viewBox={`0 0 ${VW} ${VH}`}>
      <defs>
        <linearGradient id="rpi5-pcb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2fd48a" />
          <stop offset="42%" stopColor="#19b86f" />
          <stop offset="100%" stopColor="#0a8050" />
        </linearGradient>

        <pattern id="rpi5-traces" width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M0 12 H24 M12 0 V24 M4 4 L20 4 M4 20 L20 20"
            stroke="rgba(255,255,255,0.055)"
            strokeWidth="0.7"
            fill="none"
          />
        </pattern>

        <filter id="rpi5-board-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.35" />
        </filter>

        <filter id="rpi5-led-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <style>{`
          .silk { font-family: 'Courier New', monospace; font-weight: 900; }
          .silk-sm { font-size: 5px; fill: #c8ffd4; }
          .silk-xs { font-size: 4px; fill: #a0ddba; }
        `}</style>
      </defs>

      <rect
        x="8"
        y="8"
        width={VW - 16}
        height={VH - 16}
        rx="18"
        fill="url(#rpi5-pcb-grad)"
        stroke="#098558"
        strokeWidth="4.5"
        filter="url(#rpi5-board-shadow)"
      />

      <rect
        x="8"
        y="8"
        width={VW - 16}
        height={VH - 16}
        rx="18"
        fill="url(#rpi5-traces)"
        opacity="0.9"
      />

      <rect
        x="14"
        y="14"
        width={VW - 28}
        height={VH - 28}
        rx="14"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {[
        [leftMountX, 28],
        [rightMountX, 28],
        [leftMountX, VH - 28],
        [rightMountX, VH - 28],
      ].map(([cx, cy], i) => (
        <g key={`hole-${i}`}>
          <circle cx={cx} cy={cy} r="13" fill="#f5d330" stroke="#0a8050" strokeWidth="4" />
          <circle cx={cx} cy={cy} r="5" fill="#faf6d0" />
        </g>
      ))}

      <g>
        <rect
          x={GPIO_START_X - 8}
          y={GPIO_TOP_Y - 12}
          width={GPIO_STEP_X * 19 + 16}
          height="42"
          rx="4"
          fill="#0f0f0f"
          stroke="#2a2a2a"
          strokeWidth="2"
        />

        <text
          x={GPIO_START_X + GPIO_STEP_X * 9.5}
          y={GPIO_TOP_Y - 15}
          className="silk silk-sm"
          textAnchor="middle"
        >
          HAT+ GPIO INTERFACE
        </text>

        {GPIO_LABELS.map(([number, label], index) => {
          const col = Math.floor(index / 2);
          const isOdd = Number(number) % 2 === 1;
          const x = GPIO_START_X + col * GPIO_STEP_X;
          const y = isOdd ? GPIO_TOP_Y : GPIO_BOTTOM_Y;

          return (
            <GpioPin
              key={`gpio-${number}`}
              x={x}
              y={y}
              number={number}
              label={label}
              row={isOdd ? 0 : 1}
            />
          );
        })}
      </g>

      <RpiLogo x={64} y={72} size={32} />

      <text
        x="108"
        y="86"
        fontSize="14"
        fill="#ffffff"
        fontWeight="900"
        className="silk"
        letterSpacing="0.5"
      >
        Raspberry Pi 5
      </text>

      <text
        x="108"
        y="100"
        fontSize="6.5"
        fill="#c8ffd4"
        fontWeight="800"
        className="silk"
      >
        Model B · 4GB · BCM2712 · 2.4GHz
      </text>

      <Chip x={160} y={112} w={110} h={90} label="BROADCOM®" sublabel="BCM2712" silver />
      <Chip x={68} y={108} w={74} h={50} label="LPDDR4X" sublabel="4GB" />
      <Chip x={292} y={102} w={64} h={52} label="RP1" sublabel="C0" />
      <Chip x={68} y={178} w={52} h={36} label="PMIC" />

      <g>
        <rect
          x="155"
          y="216"
          width="80"
          height="44"
          rx="4"
          fill="#1e1e1e"
          stroke="#3a3a3a"
          strokeWidth="1.8"
        />

        <rect x="158" y="219" width="74" height="38" rx="2" fill="#141414" />

        <text x="195" y="240" fontSize="6" textAnchor="middle" fill="#777" fontWeight="900" className="silk">
          WiFi/BT
        </text>

        <text x="195" y="249" fontSize="4.5" textAnchor="middle" fill="#555" className="silk">
          802.11ac
        </text>
      </g>

      {[
        [50, 170], [50, 181], [50, 192], [50, 203], [50, 214],
        [130, 170], [130, 181], [130, 192], [130, 203],
        [248, 177], [248, 188], [248, 199], [248, 210],
        [70, 236], [85, 236], [100, 236], [115, 236], [130, 236],
        [70, 251], [85, 251], [100, 251], [115, 251],
      ].map(([px, py], i) => (
        <rect
          key={`small-${i}`}
          x={px}
          y={py}
          width={i % 3 === 0 ? 10 : 7}
          height={i % 2 === 0 ? 5 : 4}
          rx="1"
          fill={i % 5 === 0 ? "#c8b96a" : i % 4 === 0 ? "#d0c8a0" : "#222"}
          stroke={i % 4 === 0 ? "#a09060" : "#3a3a3a"}
          strokeWidth="0.5"
        />
      ))}

      <MetalPort x={374} y={34} w={120} h={58} label="USB" label2="2.0" />
      <MetalPort x={374} y={98} w={120} h={58} label="USB" label2="3.0" blue />
      <EthernetPort x={374} y={164} w={120} h={102} />

      <FlatPort x={198} y={288} w={44} h={22} label="HDMI0" />
      <FlatPort x={250} y={288} w={44} h={22} label="HDMI1" />

      <g>
        <rect x={88} y={289} width={42} height={20} rx="4" fill="#b8b8b8" stroke="#777" strokeWidth="1.4" />
        <rect x={92} y={292} width={34} height={14} rx="2" fill="#1e1e1e" />
        <ellipse cx={109} cy={299} rx="8" ry="4" fill="none" stroke="#555" strokeWidth="1" />

        <text x={109} y={320} fontSize="4.8" textAnchor="middle" fill="#c8ffd4" fontWeight="900" className="silk">
          USB-C PWR
        </text>
      </g>

      <g>
        <rect x={148} y={289} width={26} height={20} rx="2" fill="#f0e8d0" stroke="#c0a060" strokeWidth="1.2" />

        {[0, 1, 2].map((i) => (
          <g key={`uart-${i}`}>
            <rect x={151 + i * 8} y={291} width="5" height="7" rx="1" fill="#1a1a1a" stroke="#555" strokeWidth="0.5" />
            <circle cx={153.5 + i * 8} cy={295} r="1.8" fill="#c0b060" stroke="#8a7a30" strokeWidth="0.4" />
          </g>
        ))}

        <text x={161} y={320} fontSize="4.5" textAnchor="middle" fill="#a0ddba" className="silk">
          UART
        </text>
      </g>

      <g>
        <rect x={46} y={254} width={16} height={58} rx="2" fill="#f0e8d0" stroke="#c0a060" strokeWidth="1.2" />

        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={`cam-${i}`} x={48} y={257 + i * 4.5} width="12" height="2.5" fill="#c8a020" />
        ))}

        <text x={54} y={322} fontSize="4.5" textAnchor="middle" fill="#a0ddba" className="silk">
          CAM
        </text>
      </g>

      <g>
        <rect x={355} y={254} width={16} height={58} rx="2" fill="#f0e8d0" stroke="#c0a060" strokeWidth="1.2" />

        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={`dsi-${i}`} x={357} y={257 + i * 4.5} width="12" height="2.5" fill="#c8a020" />
        ))}

        <text x={363} y={322} fontSize="4.5" textAnchor="middle" fill="#a0ddba" className="silk">
          DSI
        </text>
      </g>

      <g filter="url(#rpi5-led-glow)">
        <circle cx={52} cy={110} r="5.5" fill={powered || running ? "#22c55e" : "#1a4a2a"} />
        <circle cx={52} cy={110} r="2.5" fill="#fff" opacity={powered || running ? 0.9 : 0.1} />

        {(powered || running) && (
          <circle cx={52} cy={110} r="5.5" fill="none" stroke="#22c55e" strokeWidth="3" opacity="0.5">
            <animate attributeName="r" values="5;11;5" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      <text x={61} y={113} fontSize="5" fill="#a0ddba" className="silk">
        PWR
      </text>

      <circle cx={52} cy={124} r="4.5" fill={running ? "#ef4444" : "#3a1a1a"} />
      <circle cx={52} cy={124} r="2" fill="#fff" opacity={running ? 0.85 : 0.05} />

      <text x={61} y={127} fontSize="5" fill="#a0ddba" className="silk">
        ACT
      </text>

      <text x={374} y={30} fontSize="5.5" fill="#c8ffd4" fontWeight="900" className="silk">
        USB 2.0
      </text>

      <text x={374} y={94} fontSize="5.5" fill="#1d8dff" fontWeight="900" className="silk">
        USB 3.0
      </text>
    </SvgBase>
  );
}