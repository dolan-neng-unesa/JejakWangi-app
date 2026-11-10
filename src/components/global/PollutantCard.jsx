import { useSensorReading } from "../../hooks/useSensorReading";
import { POLLUTANTS, ispuCategory, toIspuIndex } from "../../lib/ispu";

/**
 * Kartu satu polutan (PM10, SO2, CO, O3, NO2) berwarna sesuai kategori ISPU.
 * Sumber data: API sensor Laravel (live / data lama dari DB). Kalau backend
 * belum aktif atau belum ada bacaan, jatuh balik ke `fallbackValue` (mock).
 */
export default function PollutantCard({ pollutant, koridorId, fallbackValue }) {
  const meta = POLLUTANTS[pollutant];
  const reading = useSensorReading(pollutant, koridorId);

  const value = reading.source ? reading.data.value : fallbackValue;
  const index = toIspuIndex(pollutant, value);
  const category = ispuCategory(index);

  if (!category) return null;

  const sourceNote = reading.source === "live" ? "Live" : reading.source === "db" ? "Data lama" : null;
  const shown = Math.round(value).toLocaleString("id-ID");

  return (
    <div
      className="min-w-[124px] rounded-2xl p-3 shrink-0"
      style={{ backgroundColor: category.bg, color: category.fg }}
      role="group"
      aria-label={`${meta.name}: ${shown} ${meta.unit}, ISPU ${index}, ${category.label}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-display font-bold text-base leading-none">
          {meta.sym}
          {meta.sub && <sub className="text-[0.6em]">{meta.sub}</sub>}
        </p>
        {sourceNote && <span className="text-[0.6rem] font-medium leading-none opacity-80">{sourceNote}</span>}
      </div>
      <p className="font-data text-xl mt-3 leading-none">{shown}</p>
      <p className="text-[0.65rem] opacity-80 mt-1">{meta.unit}</p>
      <p className="text-xs font-semibold mt-2 leading-tight">{category.label}</p>
      <p className="text-[0.65rem] opacity-80">ISPU {index}</p>
    </div>
  );
}
