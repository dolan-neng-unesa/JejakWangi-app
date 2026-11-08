// Elemen signature SVARGA: dial melingkar bergaya "instrumen digital twin",
// dipakai berulang untuk shade score, air quality, comfort, dsb.
// Busur 270° (mulai -135° s.d. +135°) agar terasa seperti jarum ukur fisik, bukan progress bar generik.

const SIZE = 108;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const START_ANGLE = -135;
const SWEEP = 270;

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function EnvGauge({ label, value, unit = "", max = 100, tone = "canopy" }) {
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const clamped = Math.max(0, Math.min(max, value ?? 0));
  const filledAngle = START_ANGLE + (clamped / max) * SWEEP;

  const strokeColor =
    tone === "ochre" ? "var(--color-ochre-500)" : tone === "info" ? "var(--color-info-600)" : "var(--color-canopy-600)";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <path
          d={arcPath(cx, cy, RADIUS, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke="var(--color-sand-200)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {value != null && (
          <path
            d={arcPath(cx, cy, RADIUS, START_ANGLE, filledAngle)}
            fill="none"
            stroke={strokeColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="font-data"
          fontSize="20"
          fill="var(--color-ink-900)"
        >
          {value != null ? Math.round(value) : "–"}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontSize="9" fill="var(--color-ink-500)">
          {unit}
        </text>
      </svg>
      <span className="text-xs text-ink-500 text-center leading-tight max-w-[7rem]">{label}</span>
    </div>
  );
}
