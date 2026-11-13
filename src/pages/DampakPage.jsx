import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { getToken } from "../services/sessionStore";
import { fetchImpact, fetchRewards, redeemReward } from "../services/engineService";

const fmt = (n) => String(Math.round(Number(n) * 100) / 100).replace(".", ",");

/** Kartu Dampak dan SDGs → poin → tukar voucher lapak atau bibit (flowchart). */
export default function DampakPage() {
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [r, setR] = useState(null);
  const [msg, setMsg] = useState(null);
  const loggedIn = Boolean(getToken());

  const load = useCallback(async () => {
    if (!loggedIn) return;
    try { const [a, b] = await Promise.all([fetchImpact(), fetchRewards()]); setD(a.data); setR(b); } catch (e) { setMsg({ ok: false, text: e.friendlyMessage || e.message }); }
  }, [loggedIn]);
  useEffect(() => { load(); }, [load]);

  async function tukar(kode) {
    try { const x = await redeemReward(kode); setMsg({ ok: true, text: `Berhasil! Kode: ${x.data.kode}` }); await load(); } catch (e) { setMsg({ ok: false, text: e.friendlyMessage || e.message }); }
  }
  if (!loggedIn) return <PageShell title="Kartu Dampak" showBack><button onClick={() => navigate("/login")} className="w-full mt-5 bg-canopy-700 text-white rounded-2xl py-3 font-medium">Masuk untuk melihat dampakmu</button></PageShell>;

  return (
    <PageShell title="Kartu Dampak" showBack>
      {!d ? <p className="text-sm text-ink-500">Memuat…</p> : (
        <>
          <div className="rounded-3xl bg-canopy-700 text-white p-5">
            <p className="text-xs uppercase tracking-wide opacity-80">Dampakmu</p>
            <p className="font-display font-bold text-4xl mt-1">{fmt(d.co2_terhindar_kg)} <span className="text-lg">kg CO₂</span></p>
            <p className="text-sm opacity-90 mt-1">{fmt(d.jalan_km)} km jalan kaki · {d.plastik_terhindar} kantong plastik terhindar · {fmt(d.sampah_terpilah_kg)} kg sampah terpilah</p>
          </div>
          <h3 className="font-semibold text-ink-900 mt-5">Kontribusi SDGs</h3>
          <ul className="mt-2 space-y-2">
            {d.sdgs.map((s) => (
              <li key={s.nomor} className="bg-white border border-canopy-800/10 rounded-2xl p-3.5 flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-canopy-100 text-canopy-800 font-bold flex items-center justify-center">{s.nomor}</span>
                <div className="min-w-0"><p className="text-sm font-semibold text-ink-900 leading-snug">{s.nama}</p><p className="text-xs text-ink-500">{fmt(s.nilai)} {s.satuan}</p></div>
              </li>
            ))}
          </ul>
          <h3 className="font-semibold text-ink-900 mt-5">Poin & hadiah</h3>
          <p className="text-sm text-ink-500">Poin tersedia: <b className="text-ink-900">{d.poin_tersedia}</b></p>
          <ul className="mt-2 space-y-2">
            {(r?.data ?? []).map((h) => (
              <li key={h.kode} className="bg-white border border-canopy-800/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div><p className="text-sm font-semibold text-ink-900">{h.nama}</p><p className="text-xs text-ink-500">{h.poin} poin</p></div>
                <button disabled={d.poin_tersedia < h.poin} onClick={() => tukar(h.kode)} className="bg-canopy-700 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:bg-canopy-200 disabled:text-canopy-500">Tukar</button>
              </li>
            ))}
          </ul>
          {msg && <p role="status" className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm ${msg.ok ? "bg-canopy-100 text-canopy-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
          <button onClick={() => navigate("/eco-coach")} className="w-full mt-4 bg-white border border-canopy-800/15 rounded-2xl py-3 text-sm font-medium text-ink-900">Minta saran personal dari Eco-Coach</button>
        </>
      )}
    </PageShell>
  );
}
