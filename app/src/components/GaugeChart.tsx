interface GaugeChartProps {
  value: number; // 0..100
  size?: number;
  label?: string;
  rating?: string;
}

/** Semicircular ESG gauge drawn with SVG arcs (0–100). */
export function GaugeChart({ value, size = 240, label = 'ESG Score', rating }: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 18;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // Semicircle from 180° (left) to 0° (right).
  const polar = (deg: number) => {
    const rad = (Math.PI * deg) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };
  const arcPath = (startDeg: number, endDeg: number) => {
    const s = polar(startDeg);
    const e = polar(endDeg);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    // sweep flag 0 because we draw from high angle to low angle (clockwise on screen)
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  };

  const valueAngle = 180 - (clamped / 100) * 180;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        {/* track */}
        <path d={arcPath(180, 0)} fill="none" stroke="#EDEBF2" strokeWidth={stroke} strokeLinecap="round" />
        {/* value */}
        <path
          d={arcPath(180, valueAngle)}
          fill="none"
          stroke="#A100FF"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-ink" fontSize="40" fontWeight={700}>
          {clamped}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-ink-muted" fontSize="13">
          {label}
        </text>
      </svg>
      {rating && (
        <span className="-mt-2 rounded-full bg-accenture-50 px-3 py-1 text-sm font-semibold text-accenture-700">
          Rating {rating}
        </span>
      )}
    </div>
  );
}
