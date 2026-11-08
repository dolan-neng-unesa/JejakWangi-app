import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { getCharger } from "../services/chargerService";
import maskot from "../assets/pages/koridor/maskot.png";

const FULL_AFTER_SEC = 60; // simulasi: penuh dalam ±1 menit
const WATT = 15;
const CO2_G_PER_KWH = 870; // faktor grid Jamali (carbonBalance.js) — listrik PLN yang tergantikan matahari

export default function ChargingPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const port = params.get("port") ?? "A1";
  const [c, setC] = useState(null);
  const [sec, setSec] = useState(0);
  const [stopped, setStopped] = useState(false);
  const timer = useRef(null);

  useEffect(() => { getCharger(id).then(setC).catch(() => setC(null)); }, [id]);
  useEffect(() => {
    timer.current = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, []);

  const pct = Math.min(100, Math.round((sec / FULL_AFTER_SEC) * 100));
  const done = pct >= 100 || stopped;
  useEffect(() => { if (done) clearInterval(timer.current); }, [done]);

  const kwh = (WATT * (sec / 3600)) / 1000 * 60; // dipercepat 60× agar angka terlihat berubah
  const co2g = kwh * CO2_G_PER_KWH;
  const R = 70, C = 2 * Math.PI * R;

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28 text-center">
        <div className="flex items-center gap-3 text-left">
          <button onClick={() => navigate(`/charger/${id}`)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"><Icon name="chevronLeft" size={19} /></button>
          <h1 className="font-semibold text-ink-900">{done ? "Pengisian Selesai" : "Pengisian Daya"}</h1>
        </div>

        {done ? (
          <>
            <img src={maskot} alt="" className="h-32 mx-auto mt-6 object-contain" />
            <h2 className="font-display font-bold text-3xl text-canopy-700 mt-2">Berhasil!</h2>
            <p className="text-sm text-ink-500">Pengisian daya selesai. Siap melangkah lagi!</p>
            <div className="mt-4 rounded-2xl bg-canopy-100/70 px-4 py-3 text-left text-sm text-ink-900">
              Kamu menghemat ±{co2g.toFixed(1)} g emisi CO₂ dengan energi matahari. Terima kasih!
            </div>
            <dl className="mt-3 bg-white border border-canopy-800/10 rounded-2xl p-4 text-sm text-left grid grid-cols-2 gap-y-2">
              <dt className="text-ink-500">Stasiun / Port</dt><dd className="text-right font-medium">{c?.name ?? `Stasiun ${id}`} / {port}</dd>
              <dt className="text-ink-500">Durasi / Energi</dt><dd className="text-right font-medium">{Math.max(1, Math.round(sec / 60 * 30))} menit / {kwh.toFixed(3)} kWh</dd>
              <dt className="text-ink-500">Biaya</dt><dd className="text-right font-medium">Gratis</dd>
            </dl>
            <button onClick={() => navigate("/home")} className="w-full mt-4 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium">Kembali ke Beranda</button>
          </>
        ) : (
          <>
            <p className="inline-block mt-4 text-xs bg-canopy-100 text-canopy-800 rounded-full px-3 py-1">Terhubung · Port {port}</p>
            <div className="relative mx-auto mt-4 h-52 w-52">
              <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`Pengisian ${pct} persen`}>
                <circle cx="80" cy="80" r={R} fill="none" stroke="#dfe8e0" strokeWidth="12" />
                <circle cx="80" cy="80" r={R} fill="none" stroke="#3f6e45" strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-canopy-700"><Icon name="bolt" size={44} /></span>
            </div>
            <p className="font-display font-bold text-5xl text-ink-900 mt-2">{pct}%</p>
            <p className="text-sm text-ink-500">Pengisian daya berlangsung…</p>
            <div className="grid grid-cols-3 mt-4 bg-white border border-canopy-800/10 rounded-2xl py-3">
              <div><p className="font-data">{Math.round(sec / 60 * 30)} mnt</p><p className="text-xs text-ink-500">Durasi</p></div>
              <div><p className="font-data">{WATT} W</p><p className="text-xs text-ink-500">Daya saat ini</p></div>
              <div><p className="font-data">{kwh.toFixed(3)}</p><p className="text-xs text-ink-500">kWh terisi</p></div>
            </div>
            <button onClick={() => setStopped(true)} className="w-full mt-4 border border-canopy-700 text-canopy-700 rounded-2xl py-3 font-medium">Hentikan Pengisian</button>
            <p className="text-[0.7rem] text-ink-500 mt-2">Simulasi: angka dipercepat dan belum dibaca dari sensor stasiun.</p>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
