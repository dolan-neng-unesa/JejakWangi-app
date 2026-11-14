import { useState } from "react";
import Icon from "./Icon";

/** Input kode/isi QR (kamera dipakai di ScanPage; di sini tempel kode atau pilih kode demo). */
export default function KodeQr({ label, contoh = [], onSubmit, busy, tombol = "Pindai" }) {
  const [v, setV] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (v.trim()) onSubmit(v.trim()); }} className="bg-white border border-canopy-800/10 rounded-2xl p-4">
      <label className="text-sm font-semibold text-ink-900 flex items-center gap-2"><Icon name="qr" size={17} className="text-canopy-700" />{label}</label>
      <div className="flex gap-2 mt-2">
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="jejakwangi:titik:…" aria-label={label} className="flex-1 min-w-0 rounded-xl border border-canopy-800/15 bg-sand-50 px-3 py-2.5 text-sm" />
        <button disabled={busy} className="bg-canopy-700 text-white rounded-xl px-4 text-sm font-medium disabled:opacity-60">{tombol}</button>
      </div>
      {contoh.length > 0 && (
        <p className="mt-2 text-xs text-ink-500">Kode demo: {contoh.map((c) => <button key={c} type="button" onClick={() => setV(c)} className="mr-2 underline text-canopy-700">{c}</button>)}</p>
      )}
    </form>
  );
}
