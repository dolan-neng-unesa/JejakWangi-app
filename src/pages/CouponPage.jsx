import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { useJourney, markVoucherUsed, voucherStatus } from "../services/journeyStore";
import { redeemOnServer } from "../services/journeySync";

const TABS = [
  { id: "tersedia", label: "Tersedia" },
  { id: "digunakan", label: "Digunakan" },
  { id: "kedaluwarsa", label: "Kedaluwarsa" },
];

export default function CouponPage() {
  const navigate = useNavigate();
  const { vouchers } = useJourney();
  const [tab, setTab] = useState("tersedia");
  const [open, setOpen] = useState(null); // voucher yang kodenya sedang ditampilkan ke kasir

  const grouped = useMemo(() => {
    const g = { tersedia: [], digunakan: [], kedaluwarsa: [] };
    vouchers.forEach((v) => g[voucherStatus(v)].push(v));
    return g;
  }, [vouchers]);
  const list = grouped[tab];

  async function confirmUse() {
    const v = open;
    markVoucherUsed(v.id);
    if (v.serverId != null) await redeemOnServer(v.serverId); // kupon resmi: catat penukaran di server
    setOpen(null);
    setTab("digunakan");
  }

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"><Icon name="chevronLeft" size={19} /></button>
          <h1 className="font-semibold text-ink-900">Kupon Saya</h1>
        </div>
        <h2 className="font-display font-bold text-2xl text-ink-900 mt-5">Langkahmu jadi hadiah.</h2>
        <p className="text-sm text-ink-500 mt-1">Nikmati hasil baikmu di mitra lokal pilihan.</p>

        <button onClick={() => navigate("/scan/tempat-sendiri")} className="w-full mt-4 flex items-center gap-3 rounded-2xl bg-canopy-100/70 border border-canopy-800/10 px-3.5 py-3 text-left">
          <Icon name="leaf" size={20} className="text-canopy-700 shrink-0" />
          <span className="text-xs text-ink-700"><b className="text-ink-900 text-sm block">Bawa tempat makan sendiri?</b>Scan QR kasir untuk memangkas cooldown kupon 1 hari.</span>
        </button>

        <div role="tablist" className="grid grid-cols-3 mt-4 bg-white border border-canopy-800/10 rounded-xl p-1 text-sm">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`py-2 rounded-lg font-medium ${tab === t.id ? "bg-canopy-100 text-canopy-800" : "text-ink-500"}`}>
              {t.label} {grouped[t.id].length > 0 && `(${grouped[t.id].length})`}
            </button>
          ))}
        </div>

        {list.length === 0 && (
          <div className="text-center mt-10 text-sm text-ink-500">
            <Icon name="ticket" size={30} className="mx-auto text-canopy-300" />
            <p className="mt-2">{tab === "tersedia" ? "Belum ada kupon. Selesaikan misi Jejak Wangi untuk mendapatkannya." : "Belum ada kupon di sini."}</p>
            {tab === "tersedia" && <button onClick={() => navigate("/misi")} className="mt-3 text-canopy-700 font-medium underline">Lihat misi</button>}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          {list.map((v) => (
            <div key={v.id} className="rounded-2xl bg-canopy-100/60 border border-canopy-800/10 p-4">
              <p className="text-[0.65rem] font-semibold tracking-widest uppercase text-canopy-700">Kupon {v.tier ?? ""} · tukar di {v.merchant}</p>
              <p className="font-display font-bold text-2xl text-ink-900 mt-1">{v.title}</p>
              <p className="font-semibold text-sm text-ink-900">{v.desc}</p>
              <p className="text-xs text-ink-500 mt-1">Berlaku hingga {new Date(v.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
              {tab === "tersedia" && (
                <button onClick={() => setOpen(v)} className="w-full mt-3 bg-canopy-700 text-sand-50 rounded-xl py-3 font-medium flex items-center justify-center gap-2">
                  <Icon name="qr" size={17} /> Gunakan sekarang
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-500 mt-4 flex items-start gap-1.5"><Icon name="info" size={14} className="shrink-0 mt-0.5" /> Tunjukkan kode kupon ke kasir sebelum membayar.</p>
      </div>

      {open && (
        <div className="fixed inset-0 z-[900] bg-canopy-950/55 flex items-end justify-center px-4 pb-6" role="dialog" aria-modal="true" aria-label="Kode kupon">
          <div className="w-full max-w-md bg-white rounded-[1.75rem] p-5 text-center">
            <p className="text-sm text-ink-500">{open.title} · {open.desc}</p>
            <p className="font-data text-3xl tracking-[0.2em] text-ink-900 mt-3">{open.code}</p>
            <p className="text-xs text-ink-500 mt-2">Tunjukkan kode ini ke kasir, lalu tekan konfirmasi setelah dipakai.</p>
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setOpen(null)} className="flex-1 border border-canopy-700 text-canopy-700 rounded-xl py-3 font-medium">Nanti</button>
              <button onClick={confirmUse} className="flex-1 bg-canopy-700 text-sand-50 rounded-xl py-3 font-medium">Sudah dipakai</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
