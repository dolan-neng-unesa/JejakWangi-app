import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import Icon from "../components/global/Icon";
import KodeQr from "../components/global/KodeQr";
import { getToken } from "../services/sessionStore";
import { KODE_DEMO, mulaiCheckin, selesaiCheckin } from "../services/engineService";

/**
 * Check-in QR (flowchart): scan QR lapak → bawa tas sendiri? →
 *   Ya: tercatat │ Tidak: scan QR tujuan kedua → kecepatan wajar? → dihitung / tidak dihitung.
 * "Tanpa belanja" langsung ke scan QR tujuan kedua.
 */
export default function CheckinPage() {
  const navigate = useNavigate();
  const [tanpa, setTanpa] = useState(false);
  const [kode, setKode] = useState("");
  const [langkah, setLangkah] = useState("mulai"); // mulai | tanya_tas | scan_tujuan_kedua | selesai | tidak_dihitung
  const [checkin, setCheckin] = useState(null);
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!getToken()) {
    return <PageShell title="Check-in Koridor" showBack><button onClick={() => navigate("/login")} className="w-full mt-5 bg-canopy-700 text-white rounded-2xl py-3 font-medium">Masuk untuk check-in</button></PageShell>;
  }

  async function mulai(code, bawa_tas) {
    setBusy(true); setError("");
    try {
      const r = (await mulaiCheckin({ code, tanpa_belanja: tanpa, ...(bawa_tas === undefined ? {} : { bawa_tas }) })).data;
      setKode(code); setLangkah(r.langkah); setCheckin(r.checkin); setPesan(r.pesan);
    } catch (e) { setError(e.friendlyMessage || e.message); } finally { setBusy(false); }
  }
  async function selesai(code) {
    setBusy(true); setError("");
    try {
      const c = (await selesaiCheckin(checkin.id, code)).data;
      setCheckin(c); setLangkah(c.status === "dihitung" ? "selesai" : "tidak_dihitung"); setPesan(c.status === "dihitung" ? `Perjalanan ${c.jarak_m} m dihitung.` : c.alasan);
    } catch (e) { setError(e.friendlyMessage || e.message); } finally { setBusy(false); }
  }
  const ulang = () => { setLangkah("mulai"); setCheckin(null); setPesan(""); setError(""); setKode(""); };

  return (
    <PageShell title="Check-in Koridor" showBack>
      <h2 className="font-display font-bold text-2xl text-ink-900">Jalan, scan, dapat dampak.</h2>
      <p className="text-sm text-ink-500 mt-1 mb-4">Pindai QR lapak saat tiba. Membawa tas sendiri langsung tercatat; selain itu pindai QR tujuan kedua agar jarak jalan kakimu dihitung.</p>

      {langkah === "mulai" && (
        <>
          <label className="flex items-center gap-2 text-sm text-ink-900 mb-3"><input type="checkbox" checked={tanpa} onChange={(e) => setTanpa(e.target.checked)} />Tanpa belanja (hanya berjalan)</label>
          <KodeQr label="QR lapak atau titik awal" contoh={[...KODE_DEMO.lapak, ...KODE_DEMO.tujuan]} onSubmit={(c) => mulai(c)} busy={busy} />
        </>
      )}
      {langkah === "tanya_tas" && (
        <div className="bg-white border border-canopy-800/10 rounded-2xl p-4">
          <p className="font-semibold text-ink-900">Bawa tas sendiri?</p>
          <p className="text-sm text-ink-500 mt-1">Tas belanja milikmu mencegah kantong plastik sekali pakai.</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button disabled={busy} onClick={() => mulai(kode, true)} className="bg-canopy-700 text-white rounded-xl py-3 font-medium">Ya, bawa</button>
            <button disabled={busy} onClick={() => mulai(kode, false)} className="bg-sand-50 border border-canopy-800/15 text-ink-900 rounded-xl py-3 font-medium">Tidak</button>
          </div>
        </div>
      )}
      {langkah === "scan_tujuan_kedua" && (
        <>
          <p role="status" className="rounded-xl bg-canopy-100 text-canopy-800 text-sm px-3.5 py-2.5 mb-3">{pesan}</p>
          <KodeQr label="QR tujuan kedua" contoh={[...KODE_DEMO.tujuan, ...KODE_DEMO.lapak]} onSubmit={selesai} busy={busy} tombol="Selesai" />
        </>
      )}
      {(langkah === "selesai" || langkah === "tidak_dihitung") && (
        <div className={`rounded-2xl p-5 ${langkah === "selesai" ? "bg-canopy-100 text-canopy-800" : "bg-red-50 text-red-700"}`} role="status">
          <p className="font-semibold flex items-center gap-2"><Icon name={langkah === "selesai" ? "checkCircle" : "info"} size={18} />{langkah === "selesai" ? "Check-in dihitung" : "Check-in tidak dihitung"}</p>
          <p className="text-sm mt-1">{pesan}</p>
          {checkin && langkah === "selesai" && <p className="text-sm mt-2">CO₂ terhindar {String(checkin.co2_kg).replace(".", ",")} kg{checkin.plastik_pcs ? ` · ${checkin.plastik_pcs} kantong plastik terhindar` : ""} · +{checkin.points} poin</p>}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={ulang} className="bg-white rounded-xl py-2.5 text-sm font-medium text-ink-900">Check-in lagi</button>
            <button onClick={() => navigate("/dampak")} className="bg-canopy-700 text-white rounded-xl py-2.5 text-sm font-medium">Lihat kartu dampak</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 text-red-700 text-sm px-3.5 py-2.5">{error}</p>}
      <button onClick={() => navigate("/lapor")} className="w-full mt-4 text-sm text-canopy-700 underline">Lihat masalah di koridor? Lapor Koridor</button>
    </PageShell>
  );
}
