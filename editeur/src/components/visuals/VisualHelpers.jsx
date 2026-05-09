export function SvgBase({ width, height, children, className = "", viewBox }) {
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

export function Text({
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

export function LiveBox({ x, y, value, color = "#111", width = 78 }) {
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