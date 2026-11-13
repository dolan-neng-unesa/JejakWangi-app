import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import maskot from "../assets/pages/koridor/maskot.png";
import { ApiError } from "../services/laravelClient";
import { askEcoCoach } from "../services/ecoCoachService";

const CONTOH = ["Bagaimana kualitas udara di koridor ini?", "Apa arti ISPU?", "Kenapa jalan kaki mengurangi emisi?"];
const MAKS = 300;

/** Chat sederhana dengan Eco-Coach. Jawaban berasal dari data sistem; AI hanya menjelaskannya. */
export default function EcoCoachChatPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const koridorId = params.get("koridor");
  const [pesan, setPesan] = useState([]);
  const [teks, setTeks] = useState("");
  const [loading, setLoading] = useState(false);
  const akhir = useRef(null);

  async function kirim(pertanyaan) {
    const q = pertanyaan.trim();
    if (q.length < 2 || loading) return;
    setPesan((p) => [...p, { dari: "saya", teks: q }]);
    setTeks("");
    setLoading(true);
    let balasan;
    try {
      const h = await askEcoCoach({ mode: "tanya", pertanyaan: q, koridorId });
      balasan = h
        ? { dari: "coach", teks: h.teks, sumber: h.sumber }
        : { dari: "coach", teks: "Eco-Coach sedang tidak bisa dihubungi. Coba lagi nanti.", galat: true };
    } catch (err) {
      balasan = { dari: "coach", teks: err instanceof ApiError ? err.friendlyMessage : "Eco-Coach sedang tidak bisa dihubungi. Coba lagi nanti.", galat: true };
    }
    setPesan((p) => [...p, balasan]);
    setLoading(false);
    setTimeout(() => akhir.current?.scrollIntoView?.({ behavior: "smooth", block: "end" }), 0);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-44 flex-1">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"><Icon name="chevronLeft" size={16} /></button>
          <div><p className="text-[0.6rem] font-semibold tracking-widest text-canopy-700">JEJAK WANGI</p><h1 className="font-semibold text-ink-900">Tanya Eco-Coach</h1></div>
        </div>

        <div className="mt-4 rounded-3xl bg-canopy-100 p-4 flex items-center gap-3">
          <img src={maskot} alt="" aria-hidden="true" className="h-16 object-contain" />
          <p className="text-sm text-ink-700">Tanyakan soal udara, suhu, jalan kaki, jejak karbon, atau sampah di kawasan ini. Angka yang kusebut selalu dari data sistem.</p>
        </div>

        {pesan.length === 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {CONTOH.map((c) => (
              <button key={c} onClick={() => kirim(c)} className="text-xs rounded-full bg-white border border-canopy-800/15 px-3 py-1.5 text-canopy-700">{c}</button>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2.5" role="log" aria-live="polite" aria-label="Percakapan dengan Eco-Coach">
          {pesan.map((m, i) => (
            <div key={i} className={m.dari === "saya" ? "self-end max-w-[85%] rounded-2xl rounded-br-md bg-canopy-700 text-sand-50 px-3.5 py-2.5 text-sm" : "self-start max-w-[90%] rounded-2xl rounded-bl-md bg-white border border-canopy-800/10 px-3.5 py-2.5 text-sm text-ink-900"}>
              <p className="whitespace-pre-line leading-snug">{m.teks}</p>
              {m.dari === "coach" && m.sumber && (
                <p className="mt-1 text-[0.65rem] text-ink-500">{m.sumber === "ai" ? "Dijelaskan AI" : "Ringkasan otomatis"}</p>
              )}
            </div>
          ))}
          {loading && <p className="self-start text-xs text-ink-500" role="status">Eco-Coach sedang menulis…</p>}
          <div ref={akhir} />
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); kirim(teks); }}
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] mx-auto w-full max-w-md px-4"
      >
        <div className="flex gap-2 rounded-2xl bg-white border border-canopy-800/15 p-2 shadow-sm">
          <label htmlFor="pertanyaan-eco" className="sr-only">Pertanyaan untuk Eco-Coach</label>
          <input
            id="pertanyaan-eco"
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            maxLength={MAKS}
            placeholder="Tulis pertanyaanmu…"
            className="flex-1 min-w-0 bg-transparent px-2 text-sm text-ink-900 outline-none"
          />
          <button type="submit" disabled={loading || teks.trim().length < 2} className="rounded-xl bg-canopy-700 text-sand-50 text-sm font-medium px-4 py-2 disabled:bg-canopy-200 disabled:text-canopy-500">Kirim</button>
        </div>
      </form>
      <BottomNav />
    </div>
  );
}
