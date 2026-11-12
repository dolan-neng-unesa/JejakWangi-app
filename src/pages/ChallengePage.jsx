import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BadgeChip from "../components/global/BadgeChip";
import EcoCoach from "../components/global/EcoCoach";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { LEADERBOARD_MAKS, formatDurasi, formatKm, resetBulanWIB, tierBerikutnya } from "../lib/journey";
import { fetchLeaderboard, klaimKupon, syncJourney } from "../services/journeySync";
import { monthKm, tierStatuses, totalCo2, totalPoin, useJourney } from "../services/journeyStore";
import { formatCo2 } from "../lib/journey";

const TAMPIL_AWAL = 10;
const tgl = (d) => d.toLocaleDateString("id-ID", { day: "numeric", month: "long", timeZone: "Asia/Jakarta" });

function TierCard({ t, onKlaim, busy }) {
  const pct = Math.round((t.progressKm / t.targetKm) * 100);
  const sisaKm = Math.max(0, t.targetKm - t.progressKm);
  return (
    <div className="bg-white border border-canopy-800/10 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold tracking-widest uppercase text-canopy-700">Kupon {t.tier} · {t.targetKm} km</p>
          <p className="font-display font-bold text-lg text-ink-900 leading-tight">{t.nama}</p>
          <p className="text-sm text-ink-700">{t.hadiah}</p>
          <p className="text-xs text-ink-500 mt-0.5">Berlaku {t.berlakuHari} hari setelah diklaim</p>
        </div>
        <span className="h-10 w-10 rounded-xl bg-ochre-100 text-ochre-600 flex items-center justify-center shrink-0"><Icon name="ticket" size={20} /></span>
      </div>
      <div className="h-2 rounded-full bg-canopy-100 mt-3 overflow-hidden" role="progressbar" aria-label={`Progres ${t.nama}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-canopy-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {t.status === "bisa_diklaim" && (
        <button onClick={() => onKlaim(t.tier)} disabled={busy} className="w-full mt-3 bg-canopy-700 text-sand-50 rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
          {busy ? "Memproses…" : "Klaim kupon"}
        </button>
      )}
      {t.status === "terkunci" && <p className="text-xs text-ink-500 mt-2">Tinggal {formatKm(sisaKm * 1000)} km lagi bulan ini.</p>}
      {t.status === "cooldown" && (
        <p className="mt-3 text-xs rounded-lg bg-sand-100 text-ink-700 px-3 py-2">
          Cooldown <b>{t.sisaHariCooldown} hari</b> lagi · bisa diklaim {tgl(new Date(t.cooldownUntil))}
        </p>
      )}
    </div>
  );
}

export default function ChallengePage() {
  const navigate = useNavigate();
  const j = useJourney();
  const [board, setBoard] = useState(undefined); // undefined=memuat, null=server tidak terjangkau
  const [semua, setSemua] = useState(false);
  const [busy, setBusy] = useState(null);
  const [pesan, setPesan] = useState(null); // { ok, text }

  useEffect(() => {
    let off = false;
    syncJourney().then(() => fetchLeaderboard()).then((r) => !off && setBoard(r));
    return () => { off = true; };
  }, []);

  const km = monthKm(j);
  const tiers = tierStatuses(j);
  const next = tierBerikutnya(tiers);
  const reset = resetBulanWIB();
  const rows = board?.rows ?? [];
  const tampil = semua ? rows : rows.slice(0, TAMPIL_AWAL);

  async function klaim(tier) {
    setBusy(tier);
    setPesan(null);
    const r = await klaimKupon(tier);
    setBusy(null);
    setPesan(r.ok ? { ok: true, text: "Kupon berhasil diklaim dan tersimpan di Kupon Saya." } : { ok: false, text: r.error });
    if (r.ok) fetchLeaderboard().then(setBoard);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <h1 className="font-semibold text-ink-900">Jejak Wangi Challenge</h1>

        <div className="mt-4 rounded-3xl bg-gradient-to-br from-canopy-100 to-sand-100 border border-canopy-800/10 p-5">
          <p className="text-[0.65rem] font-semibold tracking-widest uppercase text-canopy-700">Jalan kakimu bulan ini</p>
          <p className="mt-1"><span className="font-display font-bold text-4xl text-ink-900">{formatKm(km * 1000)}</span><span className="text-ink-500"> km</span></p>
          <p className="text-xs text-ink-500 mt-2">Progres & leaderboard reset otomatis {tgl(reset)}.</p>
        </div>

        <h2 className="font-semibold text-ink-900 text-sm mt-5 mb-2">Kupon UMKM</h2>
        <div className="flex flex-col gap-3">
          {tiers.map((t) => <TierCard key={t.tier} t={t} onKlaim={klaim} busy={busy === t.tier} />)}
        </div>
        {pesan && (
          <p role="status" className={`mt-3 text-sm rounded-xl px-3 py-2 ${pesan.ok ? "bg-canopy-100 text-canopy-800" : "bg-ochre-100 text-ochre-600"}`}>
            {pesan.text} {pesan.ok && <Link to="/kupon" className="underline font-medium">Lihat kupon</Link>}
          </p>
        )}
        <p className="text-xs text-ink-500 mt-2">Tiap kupon punya cooldown 30 hari sejak diklaim.</p>

        <Link to="/scan/tempat-sendiri" className="mt-3 flex items-center gap-3 rounded-2xl bg-canopy-100/70 border border-canopy-800/10 p-3.5">
          <span className="h-10 w-10 rounded-xl bg-white text-canopy-700 flex items-center justify-center shrink-0"><Icon name="leaf" size={20} /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900">Bawa tempat makan sendiri?</p>
            <p className="text-xs text-ink-700">Scan QR dari kasir: cooldown kuponmu berkurang 1 hari per transaksi.</p>
          </div>
          <Icon name="chevronLeft" size={16} className="rotate-180 text-ink-500" />
        </Link>

        <EcoCoach page="misi" progressKm={km} tier={next} className="mt-3" />

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white border border-canopy-800/10 rounded-2xl p-3.5"><p className="text-xs text-ink-500">Poin hijau</p><p className="font-data text-xl">{totalPoin(j).toLocaleString("id-ID")}</p></div>
          <div className="bg-white border border-canopy-800/10 rounded-2xl p-3.5"><p className="text-xs text-ink-500">Emisi terhindar</p><p className="font-data text-xl">{formatCo2(totalCo2(j))}</p></div>
        </div>

        <h2 className="font-semibold text-ink-900 text-sm mt-6 mb-1 flex items-center gap-1.5"><Icon name="trophy" size={15} className="text-ochre-600" /> Leaderboard bulan ini · Top {LEADERBOARD_MAKS}</h2>
        <p className="text-xs text-ink-500 mb-2">Jarak jalan kaki terjauh. Top 10 mendapat badge di profil; badge ikut reset tiap awal bulan.</p>
        {board === undefined && <p className="text-sm text-ink-500">Memuat leaderboard…</p>}
        {board === null && <p className="text-sm text-ink-500">Leaderboard tampil saat kamu masuk dan terhubung ke server.</p>}
        {board && rows.length === 0 && <p className="text-sm text-ink-500">Belum ada peserta bulan ini. Jadilah yang pertama!</p>}
        {rows.length > 0 && (
          <>
            <ol className="bg-white border border-canopy-800/10 rounded-2xl divide-y divide-canopy-800/10 max-h-[26rem] overflow-y-auto">
              {tampil.map((r) => (
                <li key={r.rank} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${r.is_me ? "bg-canopy-100/70" : ""}`}>
                  <span className="w-7 font-data text-ink-500">{r.rank}</span>
                  <span className="flex-1 min-w-0 flex items-center gap-2 text-ink-900"><span className="truncate">{r.name}{r.is_me && " (kamu)"}</span><BadgeChip badge={r.badge} /></span>
                  <span className="font-data text-ink-700">{r.km.toLocaleString("id-ID")} km</span>
                </li>
              ))}
            </ol>
            {rows.length > TAMPIL_AWAL && (
              <button onClick={() => setSemua(!semua)} className="w-full mt-2 text-sm text-canopy-700 font-medium">
                {semua ? "Ringkas" : `Tampilkan semua (${rows.length})`}
              </button>
            )}
          </>
        )}
        {board?.me && (
          <p className="mt-2 text-sm rounded-xl bg-white border border-canopy-800/10 px-4 py-2.5">
            Posisimu: <b>#{board.me.rank}</b> · {board.me.km.toLocaleString("id-ID")} km
          </p>
        )}

        <h3 className="font-semibold text-ink-900 text-sm mt-6 mb-2">Aktivitas terakhir</h3>
        {j.activities.length === 0 && <p className="text-sm text-ink-500">Belum ada aktivitas. Mulai jalan pertamamu!</p>}
        <div className="flex flex-col gap-2">
          {j.activities.slice(0, 3).map((a) => (
            <Link key={a.id} to={`/aktivitas/selesai/${a.id}`} className="bg-white border border-canopy-800/10 rounded-2xl p-3.5 flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-canopy-100 text-canopy-700 flex items-center justify-center"><Icon name="footprints" size={17} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900">Jalan {formatKm(a.distanceM)} km</p>
                <p className="text-xs text-ink-500">{formatDurasi(a.durationSec)} · {new Date(a.startedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}{a.simulasi ? " · simulasi (tidak dihitung)" : ""}</p>
              </div>
              <Icon name="chevronLeft" size={16} className="rotate-180 text-ink-500" />
            </Link>
          ))}
        </div>

        <button onClick={() => navigate("/aktivitas")} className="w-full mt-5 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2">
          <Icon name="play" size={16} /> Mulai aktivitas
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
