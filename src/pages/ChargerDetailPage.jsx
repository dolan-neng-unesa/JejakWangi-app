import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/global/Icon";
import SmartImage from "../components/global/SmartImage";
import BottomNav from "../components/layout/BottomNav";
import { getCharger } from "../services/chargerService";

const STEPS = ["Pilih port yang tersedia di stasiun.", "Hubungkan perangkat dengan kabel USB-C.", "Tekan Mulai Charging dan pantau daya."];

export default function ChargerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(undefined); // undefined = memuat, null = tidak ada
  const [port, setPort] = useState(null);

  useEffect(() => {
    let off = false;
    setC(undefined);
    getCharger(id).then((d) => !off && setC(d)).catch(() => !off && setC(null));
    return () => { off = true; };
  }, [id]);

  if (c === undefined) return <div className="min-h-dvh flex items-center justify-center text-sm text-ink-500">Memuat stasiun…</div>;
  if (c === null) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-ink-500">Stasiun tidak ditemukan.</p>
        <button onClick={() => navigate("/charger")} className="text-canopy-700 font-medium text-sm underline">Kembali ke daftar</button>
      </div>
    );
  }
  const ports = Array.from({ length: c.ports_total }, (_, i) => ({ label: `A${i + 1}`, free: i < c.ports_available }));
  const chosen = port ?? ports.find((p) => p.free)?.label ?? null;

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"><Icon name="chevronLeft" size={19} /></button>
          <div><p className="text-[0.6rem] font-semibold tracking-widest text-canopy-700">JEJAK WANGI</p><h1 className="font-semibold text-ink-900">Detail Charger Station</h1></div>
        </div>

        <div className="relative mt-4">
          {c.image_url
            ? <SmartImage src={c.image_url} alt={c.name} className="w-full h-44 object-cover rounded-2xl" />
            : <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-canopy-700 to-canopy-900 flex items-center justify-center text-sand-50"><Icon name="bolt" size={48} /></div>}
          <span className="absolute bottom-2 right-2 text-xs bg-white/95 rounded-full px-2.5 py-1 text-canopy-800">{c.ports_available} port tersedia</span>
        </div>

        <div className="flex items-start justify-between mt-4">
          <div><h2 className="font-display font-bold text-2xl text-ink-900">{c.name}</h2><p className="text-sm text-ink-500">{c.location}</p></div>
          <span className="text-sm font-semibold text-canopy-700">Gratis</span>
        </div>
        <p className="text-xs text-ink-500 mt-1">Buka {c.opening_hours}</p>

        <div className="grid grid-cols-3 mt-4 rounded-2xl bg-canopy-100/60 py-3 text-center">
          <div><p className="font-data text-lg">{c.solar_kwp} kWp</p><p className="text-xs text-ink-500">Daya surya</p></div>
          <div><p className="font-data text-lg">{c.battery_percent}%</p><p className="text-xs text-ink-500">Baterai</p></div>
          <div><p className="font-data text-lg">{c.ports_available} / {c.ports_total}</p><p className="text-xs text-ink-500">Port tersedia</p></div>
        </div>

        <h3 className="font-semibold text-ink-900 mt-5 mb-2">Pilih port</h3>
        <div className="flex gap-2 flex-wrap">
          {ports.map((p) => (
            <button key={p.label} disabled={!p.free} onClick={() => setPort(p.label)} aria-pressed={chosen === p.label}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${chosen === p.label ? "bg-canopy-700 text-white border-canopy-700" : "bg-white border-canopy-800/15 text-ink-900"} disabled:opacity-40`}>
              {p.label}{!p.free && " · terpakai"}
            </button>
          ))}
        </div>

        <h3 className="font-semibold text-ink-900 mt-5 mb-2">Cara penggunaan</h3>
        <ol className="flex flex-col gap-2">
          {STEPS.map((t, i) => (
            <li key={t} className="flex items-center gap-3 text-sm text-ink-700"><span className="h-6 w-6 rounded-full bg-canopy-100 text-canopy-700 text-xs font-semibold flex items-center justify-center">{i + 1}</span>{t}</li>
          ))}
        </ol>

        <button disabled={!chosen} onClick={() => navigate(`/charger/${c.id}/isi?port=${chosen}`)} className="w-full mt-6 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2 disabled:bg-canopy-200 disabled:text-canopy-500">
          <Icon name="bolt" size={17} /> Mulai Charging
        </button>
        <p className="text-[0.7rem] text-ink-500 text-center mt-2">Progres pengisian di aplikasi masih simulasi sampai stasiun terhubung ke sensor.</p>
      </div>
      <BottomNav />
    </div>
  );
}
