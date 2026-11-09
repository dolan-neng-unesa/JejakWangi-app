import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import BaseTileLayer from "../components/map/BaseTileLayer";
import FitBounds from "../components/map/FitBounds";
import EcoCoach from "../components/global/EcoCoach";
import { fetchLeaderboard, syncJourney } from "../services/journeySync";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { formatCo2, formatDurasi, formatKm, formatRupiah, MODA } from "../lib/journey";
import { getActivity, monthKm, tierStatuses, useJourney } from "../services/journeyStore";
import { tierBerikutnya } from "../lib/journey";

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-data text-2xl text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}

export default function ActivityResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const journey = useJourney();
  const act = getActivity(id);
  const [rank, setRank] = useState(null);

  // Kirim aktivitas ke server (bila login), tarik kupon & poin resmi, lalu ambil peringkat.
  useEffect(() => {
    let off = false;
    syncJourney().then(() => fetchLeaderboard()).then((lb) => {
      if (!off) setRank(lb?.rows.find((r) => r.is_me) ?? lb?.me ?? null);
    });
    return () => { off = true; };
  }, [id]);
  const tiers = tierStatuses(journey);
  const siapKlaim = tiers.filter((t) => t.status === "bisa_diklaim");
  const next = tierBerikutnya(tiers);

  if (!act) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-sand-50 px-6 text-center">
        <p className="text-sm text-ink-500">Aktivitas tidak ditemukan.</p>
        <button onClick={() => navigate("/misi")} className="text-canopy-700 font-medium text-sm underline">Ke halaman Misi</button>
      </div>
    );
  }

  const pembanding = MODA[act.pembanding]?.label ?? "motor";

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-ink-900">Aktivitas selesai</h1>
          <button onClick={() => navigate("/misi")} aria-label="Tutup" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mt-6">
          <span className="h-20 w-20 rounded-full bg-ochre-100 text-ochre-600 flex items-center justify-center">
            <Icon name="checkCircle" size={40} />
          </span>
          <h2 className="font-display font-bold text-3xl text-ink-900 mt-4">Kerja bagus!</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-[18rem]">Langkahmu hari ini baik untuk dirimu dan lingkungan.</p>
        </div>

        {act.path?.length > 1 && (
          <div className="mt-5 h-44 rounded-2xl overflow-hidden border border-canopy-800/10">
            <MapContainer center={act.path[0]} zoom={16} zoomControl={false} dragging={false} scrollWheelZoom={false} className="h-full w-full">
              <BaseTileLayer />
              <FitBounds points={act.path} padding={[20, 20]} />
              <Polyline positions={act.path} pathOptions={{ color: "#2c4a30", weight: 5 }} />
            </MapContainer>
          </div>
        )}
        {act.verified && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-canopy-700 bg-canopy-100 rounded-full px-3 py-1"><Icon name="checkCircle" size={14} /> Terverifikasi di titik akhir koridor</p>
        )}

        <div className="mt-4 bg-white border border-canopy-800/10 rounded-2xl p-4 grid grid-cols-2 gap-4">
          <Stat label="Jarak tempuh" value={`${formatKm(act.distanceM)} km`} />
          <Stat label="Durasi aktivitas" value={formatDurasi(act.durationSec)} />
        </div>

        <div className="mt-3 bg-white border border-canopy-800/10 rounded-2xl p-4 flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-canopy-100 text-canopy-700 flex items-center justify-center shrink-0"><Icon name="leaf" size={20} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink-900">{formatCo2(act.co2Kg)} terhindar</p>
            <p className="text-xs text-ink-500">≈ {formatRupiah(act.rupiah)} hemat BBM · {act.poin} poin hijau</p>
          </div>
        </div>
        <p className="text-[0.7rem] text-ink-500 mt-2 leading-snug">
          Estimasi dibanding perjalanan {pembanding.toLowerCase()} sejauh {formatKm(act.distanceM)} km (rata-rata konsumsi BBM, harga Rp10.000/liter). Bukan pengukuran emisi langsung.
          {act.simulasi && " Aktivitas ini dari mode simulasi."}
        </p>

        {rank && (
          <div className="mt-3 bg-white border border-canopy-800/10 rounded-2xl p-3.5 flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-ochre-100 text-ochre-600 flex items-center justify-center"><Icon name="trophy" size={18} /></span>
            <p className="text-sm text-ink-900">Peringkat bulan ini <b>#{rank.rank}</b> · {rank.km.toLocaleString("id-ID")} km</p>
          </div>
        )}

        <EcoCoach page="hasil" progressKm={monthKm(journey)} tier={next} className="mt-3" />

        {siapKlaim.length > 0 && !act.simulasi && (
          <div className="mt-4 rounded-2xl bg-ochre-100/70 border border-ochre-500/30 p-4 flex items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-white text-ochre-600 flex items-center justify-center shrink-0"><Icon name="ticket" size={22} /></span>
            <div>
              <p className="text-[0.6rem] font-semibold tracking-widest uppercase text-ochre-600">Hadiah menunggumu</p>
              <p className="font-semibold text-ink-900">{siapKlaim.length} kupon bisa diklaim</p>
              <p className="text-xs text-ink-500">{siapKlaim.map((t) => t.nama).join(", ")}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5 mt-5">
          <Link to="/misi" className="w-full text-center bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium">{siapKlaim.length > 0 ? "Klaim kupon di Misi" : "Lihat misi & leaderboard"}</Link>
          <Link to="/mood" className="w-full text-center border border-canopy-700 text-canopy-700 rounded-2xl py-3.5 font-medium">Bagaimana perasaanmu? Isi mood</Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
