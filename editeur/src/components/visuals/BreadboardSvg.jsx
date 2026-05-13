import { SvgBase, Text } from "./VisualHelpers";

export default function BreadboardSvg({ width, height }) {
  const mainRows = 30;
  const leftLetters = ["A", "B", "C", "D", "E"];
  const rightLetters = ["F", "G", "H", "I", "J"];

  return (
    <SvgBase width={width} height={height} className="svg-breadboard-real" viewBox="0 0 420 260">
      <defs>
        <linearGradient id="bbBodyNew" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff9dc" />
          <stop offset="45%" stopColor="#f5e9b7" />
          <stop offset="100%" stopColor="#dfd09a" />
        </linearGradient>

        <filter id="bbHoleShadowNew">
          <feDropShadow dx="0.7" dy="0.7" stdDeviation="0.45" floodOpacity="0.22" />
        </filter>
      </defs>

      <rect x="3" y="3" width="414" height="254" rx="9" fill="url(#bbBodyNew)" stroke="#c8b84a" strokeWidth="3" />

      <rect x="17" y="16" width="58" height="228" rx="5" fill="#fff4c8" stroke="#e5dca9" />
      <rect x="345" y="16" width="58" height="228" rx="5" fill="#fff4c8" stroke="#e5dca9" />

      <line x1="33" y1="28" x2="33" y2="232" stroke="#df1f1f" strokeWidth="2.6" />
      <line x1="58" y1="28" x2="58" y2="232" stroke="#1d5fd1" strokeWidth="2.6" />
      <line x1="361" y1="28" x2="361" y2="232" stroke="#df1f1f" strokeWidth="2.6" />
      <line x1="386" y1="28" x2="386" y2="232" stroke="#1d5fd1" strokeWidth="2.6" />

      {Array.from({ length: 30 }).map((_, row) => (
        <g key={`rail-left-${row}`}>
          <rect x="31" y={36 + row * 6.25} width="6" height="3.7" rx="0.8" fill="#6f5b22" filter="url(#bbHoleShadowNew)" />
          <rect x="56" y={36 + row * 6.25} width="6" height="3.7" rx="0.8" fill="#6f5b22" filter="url(#bbHoleShadowNew)" />
        </g>
      ))}

      {Array.from({ length: 30 }).map((_, row) => (
        <g key={`rail-right-${row}`}>
          <rect x="359" y={36 + row * 6.25} width="6" height="3.7" rx="0.8" fill="#6f5b22" filter="url(#bbHoleShadowNew)" />
          <rect x="384" y={36 + row * 6.25} width="6" height="3.7" rx="0.8" fill="#6f5b22" filter="url(#bbHoleShadowNew)" />
        </g>
      ))}

      <rect x="92" y="16" width="236" height="228" rx="5" fill="#fff0bd" stroke="#decf91" />
      <rect x="205" y="22" width="18" height="216" rx="4" fill="#b99e56" opacity="0.72" />

      {leftLetters.map((letter, index) => (
        <Text key={`top-left-${letter}`} x={116 + index * 22} y="30" size="10" fill="#333">
          {letter}
        </Text>
      ))}

      {rightLetters.map((letter, index) => (
        <Text key={`top-right-${letter}`} x={246 + index * 22} y="30" size="10" fill="#333">
          {letter}
        </Text>
      ))}

      {leftLetters.map((letter, index) => (
        <Text key={`bottom-left-${letter}`} x={116 + index * 22} y="238" size="10" fill="#333">
          {letter}
        </Text>
      ))}

      {rightLetters.map((letter, index) => (
        <Text key={`bottom-right-${letter}`} x={246 + index * 22} y="238" size="10" fill="#333">
          {letter}
        </Text>
      ))}

      {Array.from({ length: mainRows }).map((_, row) => (
        <Text key={`num-left-${row}`} x="100" y={45 + row * 6.2} size="6.2" fill="#333">
          {row + 1}
        </Text>
      ))}

      {Array.from({ length: mainRows }).map((_, row) => (
        <Text key={`num-right-${row}`} x="320" y={45 + row * 6.2} size="6.2" fill="#333">
          {row + 1}
        </Text>
      ))}

      {Array.from({ length: mainRows }).map((_, row) =>
        leftLetters.map((letter, col) => (
          <rect
            key={`hole-left-${letter}-${row}`}
            x={113 + col * 22}
            y={38.5 + row * 6.2}
            width="6.5"
            height="3.4"
            rx="0.8"
            fill="#6f5b22"
            filter="url(#bbHoleShadowNew)"
          />
        ))
      )}

      {Array.from({ length: mainRows }).map((_, row) =>
        rightLetters.map((letter, col) => (
          <rect
            key={`hole-right-${letter}-${row}`}
            x={247 + col * 22}
            y={38.5 + row * 6.2}
            width="6.5"
            height="3.4"
            rx="0.8"
            fill="#6f5b22"
            filter="url(#bbHoleShadowNew)"
          />
        ))
      )}
    </SvgBase>
  );
}