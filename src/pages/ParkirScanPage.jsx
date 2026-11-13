import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import Icon from "../components/global/Icon";
import KodeQr from "../components/global/KodeQr";
import { cekParkir, KODE_DEMO } from "../services/engineService";

const LEVEL = { ramai: "Ramai", sedang: "Sedang", sepi: "Sepi" };

/** Scan QR kantong parkir → cek ISPU, suhu, jam ramai → ISPU sehat? (flowchart). */
export default function ParkirScanPage() {
  const navigate = useNavigate();
  const [hasil, setHasil] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function scan(kode) {
    setBusy(true); setError("");
    try { setHasil((await cekParkir(kode)).data); } catch (e) { setHasil(null); setError(e.friendlyMessage || e.message); } finally { setBusy(false); }
  }
  const h = hasil;
  return (
    <PageShell title="Cek Sebelum Jalan" showBack>
      <h2 className="font-display font-bold text-2xl text-ink-900">Udara aman untuk berjalan?</h2>
      <p className="text-sm text-ink-500 mt-1 mb-4">Pindai QR di kantong parkir untuk melihat ISPU, suhu, dan keramaian sebelum berjalan ke pasar atau taman.</p>
      <KodeQr label="QR kantong parkir" contoh={KODE_DEMO.parkir} onSubmit={scan} busy={busy} tombol="Cek" />
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 text-red-700 text-sm px-3.5 py-2.5">{error}</p>}
      {h && (
        <section className="mt-4 space-y-3" aria-live="polite">
          <div className={`rounded-2xl p-4 ${h.sehat ? "bg-canopy-100 text-canopy-800" : "bg-amber-100 text-amber-900"}`}>
            <p className="font-semibold flex items-center gap-2"><Icon name={h.sehat ? "checkCircle" : "info"} size={18} />{h.sehat ? "ISPU sehat — silakan berjalan" : "Kurang nyaman untuk berjalan sekarang"}</p>
            <p className="text-sm mt-1">{h.titik.nama}{h.koridor ? ` · ${h.koridor.nama}` : ""}</p>
            {!h.sehat && <p className="text-sm mt-1">Penyebab: {h.alasan_tidak_sehat.join(", ")}</p>}
            {!h.data_lengkap && <p className="text-xs mt-1">Sebagian data sensor belum tersedia.</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-2xl border border-canopy-800/10 p-3"><p className="text-xs text-ink-500">ISPU</p><p className="font-bold text-xl text-ink-900">{h.ispu?.nilai ?? "—"}</p><p className="text-[11px] text-ink-500">{h.ispu?.kategori ?? ""}</p></div>
            <div className="bg-white rounded-2xl border border-canopy-800/10 p-3"><p className="text-xs text-ink-500">Suhu</p><p className="font-bold text-xl text-ink-900">{h.suhu_c != null ? `${h.suhu_c}°` : "—"}</p><p className="text-[11px] text-ink-500">{h.selisih_suhu_c != null ? `kanopi −${h.selisih_suhu_c}°` : ""}</p></div>
            <div className="bg-white rounded-2xl border border-canopy-800/10 p-3"><p className="text-xs text-ink-500">Jam ramai</p><p className="font-bold text-xl text-ink-900">{h.jam_ramai ? LEVEL[h.jam_ramai.level] : "—"}</p><p className="text-[11px] text-ink-500">{h.jam_ramai ? `puncak ${h.jam_ramai.jam_terpadat}` : ""}</p></div>
          </div>
          {h.hari_festival?.aktif && <p className="text-sm rounded-xl bg-white border border-canopy-800/10 px-3.5 py-2.5">Hari festival: {h.hari_festival.nama}. Kawasan bisa lebih ramai.</p>}
          {h.saran && (
            <div className="rounded-2xl bg-white border border-canopy-800/10 p-4" data-testid="saran">
              <p className="font-semibold text-ink-900 text-sm">Saran waktu atau rute lain</p>
              <ul className="mt-1 text-sm text-ink-500 list-disc pl-5">{h.saran.teks.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
          <button onClick={() => navigate("/checkin")} className="w-full bg-canopy-700 text-white rounded-2xl py-3.5 font-medium">Jalan ke pasar atau taman</button>
        </section>
      )}
    </PageShell>
  );
}
