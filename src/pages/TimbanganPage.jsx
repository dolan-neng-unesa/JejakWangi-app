import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { getToken } from "../services/sessionStore";
import { checkinStation, confirmWaste, fetchMyWaste, requestCorrection } from "../services/wasteService";

const STATUS = { menunggu_konfirmasi: ["Menunggu konfirmasimu", "bg-amber-100 text-amber-800"], terkonfirmasi: ["Terkonfirmasi", "bg-canopy-100 text-canopy-800"], perlu_koreksi: ["Koreksi diminta", "bg-sand-100 text-ink-700"] };
const kg = (n) => `${String(Number(n)).replace(".", ",")} kg`;

export default function TimbanganPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(null);
  const [koreksi, setKoreksi] = useState(null); // { id, note }
  const loggedIn = Boolean(getToken());

  const load = useCallback(async () => {
    if (!loggedIn) return setRows([]);
    try { setRows((await fetchMyWaste()).data ?? []); } catch (e) { setRows([]); setMsg({ ok: false, text: e.friendlyMessage || e.message }); }
  }, [loggedIn]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  async function scan(e) {
    e.preventDefault();
    if (!code.trim()) return setMsg({ ok: false, text: "Masukkan kode atau tempel isi QR lokasi." });
    setBusy("scan");
    try { const r = await checkinStation(code.trim()); setMsg({ ok: true, text: r.message }); setCode(""); } catch (ex) { setMsg({ ok: false, text: ex.friendlyMessage || ex.message }); } finally { setBusy(null); }
  }
  async function act(id, fn, okText) {
    setBusy(id);
    try { const r = await fn(); setMsg({ ok: true, text: r?.message || okText }); setKoreksi(null); await load(); } catch (ex) { setMsg({ ok: false, text: ex.friendlyMessage || ex.message }); } finally { setBusy(null); }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"><Icon name="chevronLeft" size={19} /></button>
          <h1 className="font-semibold text-ink-900">Setoran Sampah & Pangan</h1>
        </div>
        <h2 className="font-display font-bold text-2xl text-ink-900 mt-5">Setor, timbang, dapat poin.</h2>
        <p className="text-sm text-ink-500 mt-1">Pindai QR di tempat timbang agar petugas bisa mencatat setoranmu. Poin masuk setelah kamu memeriksa dan menyetujui hasilnya.</p>

        {!loggedIn ? (
          <button onClick={() => navigate("/login")} className="w-full mt-5 bg-canopy-700 text-white rounded-2xl py-3 font-medium">Masuk untuk menyetor</button>
        ) : (
          <form onSubmit={scan} className="mt-4 bg-white border border-canopy-800/10 rounded-2xl p-4">
            <label htmlFor="stasiun" className="text-sm font-semibold text-ink-900 flex items-center gap-2"><Icon name="qr" size={17} className="text-canopy-700" />QR lokasi timbang</label>
            <div className="flex gap-2 mt-2">
              <input id="stasiun" value={code} onChange={(e) => setCode(e.target.value)} placeholder="jejakwangi:timbang:BSS-001" className="flex-1 min-w-0 rounded-xl border border-canopy-800/15 px-3 py-2.5 text-sm" />
              <button disabled={busy === "scan"} className="bg-canopy-700 text-white rounded-xl px-4 text-sm font-medium disabled:opacity-60">Hubungkan</button>
            </div>
          </form>
        )}

        {msg && <p role="status" className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm ${msg.ok ? "bg-canopy-100 text-canopy-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

        {rows === null && loggedIn && <p className="text-sm text-ink-500 mt-8 text-center">Memuat…</p>}
        {rows?.length === 0 && loggedIn && <p className="text-sm text-ink-500 mt-8 text-center">Belum ada setoran. Setelah petugas menimbang, hasilnya muncul di sini.</p>}

        <div className="mt-5 space-y-3">
          {(rows ?? []).map((w) => {
            const [label, cls] = STATUS[w.status] ?? [w.status_label, "bg-sand-100 text-ink-700"];
            return (
              <article key={w.id} className="bg-white border border-canopy-800/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-xs text-ink-500">{w.code} · {w.station_name}</p><p className="font-display font-bold text-xl text-ink-900">{kg(w.total_kg)}</p></div>
                  <span className={`text-[0.7rem] font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
                </div>
                <ul className="mt-2 text-sm text-ink-700 space-y-0.5">{(w.items ?? []).map((i, n) => <li key={n} className="flex justify-between"><span>{i.label} · {kg(i.kg)}</span><span className="text-ink-500">{i.poin} poin</span></li>)}</ul>
                <p className="mt-2 text-sm font-semibold text-canopy-700">{w.status === "terkonfirmasi" ? `+${w.points} poin masuk` : `Estimasi ${w.points} poin`}</p>
                {w.note && <p className="text-xs text-ink-500 mt-1">Catatan petugas: {w.note}</p>}
                {w.status === "perlu_koreksi" && <p className="text-xs text-ink-500 mt-1">Koreksimu: “{w.correction_note}”. Petugas akan memperbaiki dan mengirim ulang.</p>}
                {w.status === "menunggu_konfirmasi" && (koreksi?.id === w.id ? (
                  <div className="mt-3">
                    <label htmlFor={`k${w.id}`} className="text-xs text-ink-500">Bagian mana yang perlu dikoreksi?</label>
                    <textarea id={`k${w.id}`} rows={2} maxLength={500} value={koreksi.note} onChange={(e) => setKoreksi({ id: w.id, note: e.target.value })} className="w-full mt-1 rounded-xl border border-canopy-800/15 px-3 py-2 text-sm" />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setKoreksi(null)} className="flex-1 border border-canopy-800/15 rounded-xl py-2.5 text-sm">Batal</button>
                      <button disabled={busy === w.id || !koreksi.note.trim()} onClick={() => act(w.id, () => requestCorrection(w.id, koreksi.note.trim()))} className="flex-1 bg-canopy-700 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">Kirim koreksi</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setKoreksi({ id: w.id, note: "" })} className="flex-1 border border-canopy-700 text-canopy-700 rounded-xl py-2.5 text-sm font-medium">Minta koreksi</button>
                    <button disabled={busy === w.id} onClick={() => act(w.id, () => confirmWaste(w.id))} className="flex-1 bg-canopy-700 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">Sesuai, ambil poin</button>
                  </div>
                ))}
              </article>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
