import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/global/Icon";
import Skeleton from "../components/global/Skeleton";
import BottomNav from "../components/layout/BottomNav";
import { getKoridorList } from "../services/koridorService";
import { useSensorSnapshot } from "../hooks/useSensorSnapshot";
import { useActiveKoridor } from "../hooks/useActiveKoridor";
import { POLLUTANTS, calcIspu } from "../lib/ispu";

import route1 from "../assets/pages/home/route1.png";
import route2 from "../assets/pages/home/route2.png";
import food1 from "../assets/pages/home/food1.png";
import food2 from "../assets/pages/home/food2.png";

const menuItems = [
  { to: "/route", icon: "compass", label: "Navigasi Route" },
  { to: "/geofencing", icon: "pin", label: "Geofencing" },
  { to: "/koridor", icon: "route", label: "Peta Koridor" },
  { to: "/mood", icon: "mood", label: "Mood Tracker" },
  { to: "/bfest", icon: "calendar", label: "Kalender BKM" },
  { to: "/umkm", icon: "cutlery", label: "Kuliner & UMKM" },
];

// Konten rekomendasi & kuliner masih statis (belum ada tabel khusus di skema
// database untuk "rating"/"persentase hijau") — mengikuti mockup UI apa adanya,
// menyusul nanti begitu tabel pendukungnya ditambahkan di schema.sql.
const greenRoutes = [
  { image: route1, name: "Green Corridor Kemiren", distance: "4.2 km", minutes: "25 min", hijau: "92%", rating: 4.9 },
  { image: route2, name: "Marina Boom Corridor", distance: "6.8 km", minutes: "45 min", hijau: "85%", rating: 4.8 },
];

const culinary = [
  { image: food1, name: "Sego Tempong", desc: "Sayur segar bebas pestisida", price: "Rp 15k", rating: 4.9 },
  { image: food2, name: "Kopi Osing", desc: "Biji kopi lokal Kemiren", price: "Rp 12k", rating: 4.7 },
];

// Parameter yang ditampilkan sebagai kartu kecil (sesuai field yang dikirim ESP32).
const STAT_FIELDS = [
  { key: "temperature", label: "Suhu", unit: " °C", decimals: 1 },
  { key: "pm25", label: "PM2.5", unit: " µg/m³", decimals: 1 },
  { key: "pm10", label: "PM10", unit: " µg/m³", decimals: 0 },
  { key: "co", label: "CO", unit: " µg/m³", decimals: 0 },
  { key: "co2", label: "CO2", unit: " ppm", decimals: 0 },
  { key: "o2", label: "O2", unit: " %", decimals: 1 },
  { key: "so2", label: "SO2", unit: " µg/m³", decimals: 0 },
  { key: "o3", label: "O3", unit: " µg/m³", decimals: 0 },
  { key: "no2", label: "NO2", unit: " µg/m³", decimals: 0 },
  { key: "air_quality", label: "AQI", unit: "", decimals: 0 },
];

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function EnvStat({ icon, status, value, unit, label }) {
  return (
    <div className="min-w-[112px] bg-white rounded-2xl border border-canopy-800/10 p-3 shrink-0">
      <div className="flex items-center justify-between">
        <span className="h-6 w-6 rounded-full bg-canopy-100 text-canopy-700 flex items-center justify-center">
          <Icon name={icon} size={13} />
        </span>
        <span className="text-[0.6rem] font-medium text-canopy-700 uppercase tracking-wide">{status}</span>
      </div>
      <p className="font-data text-lg text-ink-900 mt-2">
        {value}
        <span className="text-xs text-ink-500">{unit}</span>
      </p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const [koridors, setKoridors] = useState([]);

  useEffect(() => {
    getKoridorList()
      .then(setKoridors)
      .catch(() => setKoridors([]));
  }, []);

  // Hanya satu wilayah yang bisa ON di ESP32; kartu ISPU menampilkan wilayah itu saja.
  const active = useActiveKoridor();
  const koridorId = active.koridorId;
  const activeKoridor = koridors.find((k) => Number(k.id) === koridorId);
  const activeName = activeKoridor?.short_name ?? (koridorId != null ? `Wilayah ${koridorId}` : null);

  const snap = useSensorSnapshot(koridorId);
  const values = Object.fromEntries(Object.entries(snap.readings).map(([k, r]) => [k, r.value]));
  const hasData = Object.keys(values).length > 0;
  const ispu = calcIspu(values);
  const temperature = values.temperature;

  return (
    <div className="min-h-dvh flex flex-col bg-sand-100">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-28">
        <header>
          <h1 className="font-display font-bold text-xl text-canopy-700 tracking-wide">SVARGA</h1>
          <p className="text-[0.65rem] text-ink-500 tracking-wide uppercase mt-0.5">
            Digital Twin &amp; Wellness Corridor
          </p>
        </header>

        <section className="bg-canopy-700 text-sand-50 rounded-[1.75rem] p-5 mt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-xl">Selamat Datang!</h2>
              <p className="text-sm text-sand-100/90 mt-1 max-w-[11rem]">
                Mari rawat kebugaran di bumi Blambangan
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-2 flex items-center gap-2 shrink-0">
              <Icon name="weather" size={20} />
              <div className="text-right leading-tight">
                <p className="font-data text-sm">{temperature != null ? `${temperature.toFixed(1)}°C` : "28°C"}</p>
                <p className="text-[0.6rem] text-sand-100/80">Banyuwangi</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-white/15">
            <Link
              to="/route"
              className="flex-1 flex items-center justify-center gap-1.5 bg-canopy-100 text-canopy-800 rounded-full py-2.5 text-sm font-medium"
            >
              <Icon name="compass" size={16} />
              Mulai Jelajah
            </Link>
            <Link
              to="/bfest"
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 text-sand-50 rounded-full py-2.5 text-sm font-medium"
            >
              <Icon name="calendar" size={16} />
              Kalender BKM
            </Link>
          </div>
        </section>

        <h2 className="font-display font-bold text-lg text-ink-900 mt-6">Kondisi Lingkungan</h2>
        <p className="text-xs text-ink-500 mt-0.5 mb-3">ISPU &amp; parameter kualitas udara koridor hijau</p>

        {koridorId != null && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-canopy-700 text-sand-50 px-3 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-canopy-100" />
            {activeName} aktif
          </div>
        )}

        {koridorId != null && snap.loading && !hasData && <Skeleton className="h-16 mb-3" />}

        {ispu && (
          <div
            className="rounded-2xl p-4 mb-3"
            style={{ backgroundColor: ispu.category.bg, color: ispu.category.fg }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] uppercase tracking-wide opacity-80">ISPU {activeName}</p>
                <p className="font-display font-bold text-2xl">{ispu.value}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{ispu.category.label}</p>
                <p className="text-[0.65rem] opacity-80">
                  Dominan: {POLLUTANTS[ispu.dominant].sym}
                  {POLLUTANTS[ispu.dominant].sub}
                </p>
              </div>
            </div>
            <p className="text-[0.6rem] opacity-80 mt-2">
              {snap.isStale ? "Data lama • " : "Live • "}
              diperbarui {formatTime(snap.updatedAt)}
            </p>
          </div>
        )}

        {koridorId == null && (
          <div className="rounded-2xl p-4 mb-3 bg-white border border-canopy-800/10 text-sm text-ink-500">
            {active.loading
              ? "Memeriksa wilayah aktif..."
              : active.error
                ? "Tidak dapat menghubungi server sensor."
                : "Tidak ada wilayah yang aktif. Nyalakan salah satu wilayah di perangkat ESP32."}
          </div>
        )}

        {koridorId != null && !snap.loading && !ispu && (
          <div className="rounded-2xl p-4 mb-3 bg-white border border-canopy-800/10 text-sm text-ink-500">
            {snap.error
              ? "Tidak dapat menghubungi server sensor."
              : hasData
                ? "Belum ada data polutan untuk menghitung ISPU."
                : "Menunggu data dari sensor ESP32..."}
          </div>
        )}

        <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
          {snap.loading && !hasData && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 min-w-[112px] shrink-0" />)}
          {STAT_FIELDS.filter((f) => values[f.key] != null).map((f) => {
            const sub = ispu?.subs.find((x) => x.key === f.key);
            return (
              <EnvStat
                key={f.key}
                icon="weather"
                status={sub ? `Sub ${sub.sub}` : "-"}
                value={Number(values[f.key]).toLocaleString("id-ID", {
                  minimumFractionDigits: f.decimals,
                  maximumFractionDigits: f.decimals,
                })}
                unit={f.unit}
                label={f.label}
              />
            );
          })}
        </div>

        <h2 className="font-display font-bold text-lg text-ink-900 mt-6 mb-3">Menu Svarga</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {menuItems.map((m) => (
            <Link
              key={m.label}
              to={m.to}
              className="bg-white rounded-2xl border border-canopy-800/10 py-4 flex flex-col items-center gap-2 text-center"
            >
              <span className="h-9 w-9 rounded-full bg-canopy-100 text-canopy-700 flex items-center justify-center">
                <Icon name={m.icon} size={18} />
              </span>
              <span className="text-[0.68rem] text-ink-700 leading-tight px-1">{m.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 mb-3">
          <div>
            <h2 className="font-display font-bold text-lg text-ink-900">Rekomendasi Route Hijau</h2>
            <p className="text-xs text-ink-500 mt-0.5">Rute teregistrasi dengan emisi rendah</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
          {greenRoutes.map((r) => (
            <Link
              key={r.name}
              to="/route"
              className="min-w-[220px] bg-white rounded-2xl border border-canopy-800/10 overflow-hidden shrink-0"
            >
              <img src={r.image} alt={r.name} className="h-24 w-full object-cover" />
              <div className="p-3">
                <p className="font-medium text-sm text-ink-900">{r.name}</p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {r.distance} • {r.minutes}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[0.65rem] bg-canopy-100 text-canopy-800 rounded-full px-2 py-0.5">
                    {r.hijau} Hijau
                  </span>
                  <span className="flex items-center gap-1 text-xs text-ink-700">
                    <Icon name="star" size={12} className="text-ochre-500" />
                    {r.rating}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 mb-3">
          <h2 className="font-display font-bold text-lg text-ink-900">Kuliner &amp; UMKM Sehat</h2>
          <p className="text-xs text-ink-500 mt-0.5">Pilihan makanan rendah karbon &amp; sehat</p>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
          {culinary.map((f) => (
            <Link
              key={f.name}
              to="/umkm"
              className="min-w-[240px] bg-white rounded-2xl border border-canopy-800/10 overflow-hidden shrink-0 flex items-center gap-3 p-2"
            >
              <img src={f.image} alt={f.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm text-ink-900 truncate">{f.name}</p>
                <p className="text-xs text-ink-500 truncate">{f.desc}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-canopy-700">{f.price}</span>
                  <span className="flex items-center gap-0.5 text-xs text-ink-700">
                    <Icon name="star" size={11} className="text-ochre-500" />
                    {f.rating}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
