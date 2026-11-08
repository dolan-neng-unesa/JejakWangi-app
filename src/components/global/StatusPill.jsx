const tones = {
  online: "bg-canopy-100 text-canopy-800",
  offline: "bg-alert-600/10 text-alert-600",
  stale: "bg-ochre-100 text-ochre-600",
  neutral: "bg-sand-100 text-ink-500",
};

const labels = {
  online: "Sensor aktual",
  offline: "Sensor luring",
  stale: "Data terakhir",
  neutral: "",
};

export default function StatusPill({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "online" ? "bg-canopy-600" : tone === "offline" ? "bg-alert-600" : tone === "stale" ? "bg-ochre-500" : "bg-ink-500"
        }`}
      />
      {children ?? labels[tone]}
    </span>
  );
}
