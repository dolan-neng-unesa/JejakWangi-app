import { ISPU_CATEGORIES } from "../../lib/ispu";

// Legenda warna ISPU, urutan sama dengan papan ISPU (baik -> berbahaya).
export default function IspuLegend() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3" aria-label="Keterangan warna ISPU">
      {ISPU_CATEGORIES.map((c) => (
        <li key={c.key} className="flex items-center gap-1.5 text-[0.65rem] text-ink-700">
          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.bg }} />
          {c.label} <span className="text-ink-500">{c.range}</span>
        </li>
      ))}
    </ul>
  );
}
