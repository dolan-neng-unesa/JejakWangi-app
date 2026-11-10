import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { formatKm, levelDariPoin, MODA } from "../lib/journey";
import BadgeChip from "../components/global/BadgeChip";
import { readSession } from "../services/sessionStore";
import { totalCo2, totalKm, totalPoin, useJourney, voucherStatus } from "../services/journeyStore";

export default function ProfilePage() {
  const navigate = useNavigate();
  const j = useJourney();
  const user = readSession()?.user;
  const poin = totalPoin(j);
  const lv = levelDariPoin(poin);
  const aktif = j.vouchers.filter((v) => voucherStatus(v) === "tersedia").length;
  const name = user?.name ?? user?.displayName ?? "Tamu";

  const menu = [
    { to: "/misi", icon: "activity", label: "Riwayat aktivitas" },
    { to: "/kupon", icon: "ticket", label: "Kupon saya", badge: aktif ? `${aktif} aktif` : null },
    { to: "/mood/riwayat", icon: "mood", label: "Riwayat mood" },
    { to: "/geofencing", icon: "pin", label: "Zona geofencing" },
    { to: "/charger", icon: "bolt", label: "Charger station surya" },
    { to: "/info", icon: "info", label: "Info & panduan" },
    { to: "/scan", icon: "qr", label: "Scan QR koridor" },
    { to: "/scan/tempat-sendiri", icon: "leaf", label: "Scan QR tempat sendiri" },
    ...(user?.umkm_id ? [{ to: "/kasir", icon: "store", label: "Mode kasir UMKM" }] : []),
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <h1 className="font-semibold text-ink-900">Profil</h1>
        <div className="flex items-center gap-4 mt-5">
          <span className="h-16 w-16 rounded-full bg-canopy-100 text-canopy-700 flex items-center justify-center font-display font-bold text-2xl">{name.slice(0, 1).toUpperCase()}</span>
          <div>
            <p className="font-display font-bold text-xl text-ink-900">{name}</p>
            <p className="text-xs font-semibold text-canopy-700">Level {lv.level} · {lv.nama}</p>
            {j.server?.badge && (
              <p className="mt-1 flex items-center gap-1.5">
                <BadgeChip badge={j.server.badge} />
                <span className="text-[0.7rem] text-ink-500">bulan ini · peringkat #{j.server.rank}</span>
              </p>
            )}
            {j.transport && <p className="text-xs text-ink-500">Biasanya ke koridor: {MODA[j.transport].label.toLowerCase()}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 bg-white border border-canopy-800/10 rounded-2xl mt-5 py-4 text-center">
          <div><p className="font-data text-lg">{formatKm(totalKm(j) * 1000)} km</p><p className="text-xs text-ink-500">Total jarak</p></div>
          <div><p className="font-data text-lg text-canopy-700">{totalCo2(j).toFixed(1)} kg</p><p className="text-xs text-ink-500">Est. CO₂ terhindar</p></div>
          <div><p className="font-data text-lg">{poin.toLocaleString("id-ID")}</p><p className="text-xs text-ink-500">Poin hijau</p></div>
        </div>

        <div className="mt-3 bg-canopy-100/60 border border-canopy-800/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-ink-900">Langkah kecil, dampak berarti.</p>
          <div className="h-2 rounded-full bg-white mt-2 overflow-hidden"><div className="h-full bg-canopy-700" style={{ width: `${((250 - lv.sisa) / 250) * 100}%` }} /></div>
          <p className="text-xs text-ink-500 mt-1.5">{lv.sisa} poin lagi menuju Level {lv.level + 1}</p>
        </div>

        <h2 className="text-sm font-semibold text-ink-900 mt-6 mb-2">Akun saya</h2>
        <div className="bg-white border border-canopy-800/10 rounded-2xl divide-y divide-canopy-800/10">
          {menu.map((m) => (
            <Link key={m.to} to={m.to} className="flex items-center gap-3 px-4 py-3.5 text-sm text-ink-900">
              <Icon name={m.icon} size={18} className="text-canopy-700" />
              <span className="flex-1">{m.label}</span>
              {m.badge && <span className="text-xs text-ink-500">{m.badge}</span>}
              <Icon name="chevronLeft" size={15} className="rotate-180 text-ink-500" />
            </Link>
          ))}
        </div>
        {!user && <button onClick={() => navigate("/login")} className="w-full mt-4 border border-canopy-700 text-canopy-700 rounded-2xl py-3 font-medium">Masuk untuk menyimpan progresmu</button>}
      </div>
      <BottomNav />
    </div>
  );
}
