import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import maskot from "../assets/pages/koridor/maskot.png";

const LANGKAH = [
  { icon: "pin", t: "Temukan stasiun", d: "Lihat peta dan pilih yang tersedia." },
  { icon: "bolt", t: "Sambungkan perangkat", d: "Gunakan kabel USB-C, lalu mulai charging." },
  { icon: "checkCircle", t: "Pantau dan selesai", d: "Cek progres, cabut kabel setelah penuh." },
];
const FAQ = [
  { q: "Apakah pengisian benar-benar gratis?", a: "Ya. Stasiun JEJAK WANGI memakai energi matahari dan dapat dipakai tanpa biaya." },
  { q: "Bagaimana jika port tidak berfungsi?", a: "Coba port lain di stasiun yang sama atau pilih stasiun terdekat di peta, lalu laporkan lewat tim SVARGA." },
  { q: "Apa itu titik hijau, oranye, dan biru di peta?", a: "Hijau: rute hijau. Oranye: UMKM sekitar. Biru: charger station surya." },
];

export default function InfoPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"><Icon name="chevronLeft" size={19} /></button>
          <div><p className="text-[0.6rem] font-semibold tracking-widest text-canopy-700">JEJAK WANGI</p><h1 className="font-semibold text-ink-900">Info & Panduan</h1></div>
        </div>
        <div className="mt-4 rounded-3xl bg-canopy-100 p-5 flex items-center gap-3">
          <div><h2 className="font-display font-bold text-xl text-canopy-800">Isi daya, rawat bumi.</h2><p className="text-sm text-ink-700 mt-1">JEJAK WANGI membantumu menemukan pengisian perangkat gratis berbasis tenaga surya di Banyuwangi.</p></div>
          <img src={maskot} alt="" className="h-20 object-contain" />
        </div>
        <h3 className="font-semibold text-ink-900 mt-5 mb-2">Mulai dalam 3 langkah</h3>
        <div className="flex flex-col gap-2">
          {LANGKAH.map((l) => (
            <div key={l.t} className="bg-white border border-canopy-800/10 rounded-2xl p-3.5 flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-canopy-100 text-canopy-700 flex items-center justify-center"><Icon name={l.icon} size={18} /></span>
              <div><p className="font-medium text-sm text-ink-900">{l.t}</p><p className="text-xs text-ink-500">{l.d}</p></div>
            </div>
          ))}
        </div>
        <h3 className="font-semibold text-ink-900 mt-5 mb-2">Pertanyaan umum</h3>
        <div className="flex flex-col gap-2">
          {FAQ.map((f, i) => (
            <div key={f.q} className="bg-white border border-canopy-800/10 rounded-2xl">
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="w-full flex items-center justify-between text-left px-4 py-3 text-sm font-medium text-ink-900">
                {f.q}<Icon name="chevronDown" size={16} className={open === i ? "rotate-180" : ""} />
              </button>
              {open === i && <p className="px-4 pb-3 text-sm text-ink-500">{f.a}</p>}
            </div>
          ))}
        </div>
        <Link to="/charger" className="block text-center w-full mt-5 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium">Cari charger station</Link>
      </div>
      <BottomNav />
    </div>
  );
}
