import { ecoTip } from "../../lib/ecoCoach";
import maskot from "../../assets/pages/koridor/maskot.png";

/** Kartu saran Eco-Coach kontekstual; dipasang di tiap halaman utama alur Jejak Wangi. */
export default function EcoCoach({ className = "", ...ctx }) {
  return (
    <aside className={`flex items-start gap-3 rounded-2xl bg-canopy-100/70 border border-canopy-800/10 px-3.5 py-3 ${className}`} aria-label="Saran Eco-Coach">
      <img src={maskot} alt="" aria-hidden="true" className="h-10 w-9 object-contain shrink-0" />
      <div>
        <p className="text-[0.6rem] font-semibold tracking-widest uppercase text-canopy-700">Eco-Coach</p>
        <p className="text-sm text-ink-900 leading-snug">{ecoTip(ctx)}</p>
      </div>
    </aside>
  );
}
