import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ecoTip } from "../../lib/ecoCoach";
import { askEcoCoach } from "../../services/ecoCoachService";
import maskot from "../../assets/pages/koridor/maskot.png";

/**
 * Kartu saran Eco-Coach kontekstual; dipasang di tiap halaman utama alur Jejak Wangi.
 *
 * Selalu mulai dari saran berbasis aturan (`ecoTip`, offline, instan). Bila `ai` diberikan dan server
 * tersedia, teksnya diganti penjelasan dari Eco-Coach AI beserta label sumbernya; bila gagal/offline,
 * saran aturan tetap tampil — kartu tidak pernah kosong atau error.
 *
 * @param {string} [message] menggantikan saran aturan (saran khusus sebuah koridor)
 * @param {{mode: "ringkasan"|"tanya", koridorId?: number|string, pertanyaan?: string}|null} [ai]
 * @param {string|null} [tanyaLink] bila diisi, tampil tautan "Tanya Eco-Coach" ke rute tersebut
 */
export default function EcoCoach({ className = "", message = null, ai = null, tanyaLink = null, ...ctx }) {
  const [hasil, setHasil] = useState(null);
  const mode = ai?.mode;
  const koridorId = ai?.koridorId;
  const pertanyaan = ai?.pertanyaan;

  useEffect(() => {
    setHasil(null);
    if (!mode) return undefined;
    let off = false;
    askEcoCoach({ mode, koridorId, pertanyaan })
      .then((h) => { if (!off) setHasil(h); })
      .catch(() => {}); // gagal = tetap pakai saran aturan
    return () => { off = true; };
  }, [mode, koridorId, pertanyaan]);

  return (
    <aside className={`flex items-start gap-3 rounded-2xl bg-canopy-100/70 border border-canopy-800/10 px-3.5 py-3 ${className}`} aria-label="Saran Eco-Coach">
      <img src={maskot} alt="" aria-hidden="true" className="h-10 w-9 object-contain shrink-0" />
      <div className="min-w-0">
        <p className="text-[0.6rem] font-semibold tracking-widest uppercase text-canopy-700">Eco-Coach</p>
        <p className="text-sm text-ink-900 leading-snug whitespace-pre-line" aria-live="polite">{hasil?.teks ?? message ?? ecoTip(ctx)}</p>
        {hasil && (
          <p className="mt-1 text-[0.65rem] text-ink-500" data-testid="eco-coach-sumber">
            {hasil.sumber === "ai" ? "Dijelaskan AI" : "Ringkasan otomatis"}
          </p>
        )}
        {tanyaLink && (
          <Link to={tanyaLink} className="mt-1.5 inline-block text-xs font-medium text-canopy-700 underline">Tanya Eco-Coach</Link>
        )}
      </div>
    </aside>
  );
}
