import { BADGES } from "../../lib/journey";
import Icon from "./Icon";

/** Badge leaderboard bulanan (Top 1/3/5/10). `badge` = { kode, label } dari server atau null. */
export default function BadgeChip({ badge, className = "" }) {
  if (!badge) return null;
  const def = BADGES[badge.kode];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${def?.warna ?? "bg-canopy-100 text-canopy-800"} ${className}`}>
      <Icon name="trophy" size={11} /> {badge.label ?? def?.label}
    </span>
  );
}
