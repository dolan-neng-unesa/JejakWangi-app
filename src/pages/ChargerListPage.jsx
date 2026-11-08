import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import BaseTileLayer from "../components/map/BaseTileLayer";
import FitBounds from "../components/map/FitBounds";
import { getChargers } from "../services/chargerService";

export default function ChargerListPage() {
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);

  useEffect(() => {
    getChargers().then(setList).catch(() => setList([]));
  }, []);

  const shown = useMemo(() => (list ?? []).filter((c) => `${c.name} ${c.location ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())), [list, q]);
  const points = shown.map((c) => [c.latitude, c.longitude]);

  return (
    <div className="h-dvh flex flex-col bg-sand-50">
      <div className="relative flex-1 min-h-0">
        <MapContainer center={[-8.2186, 114.3697]} zoom={16} zoomControl={false} className="h-full w-full">
          <BaseTileLayer />
          {points.length > 0 && <FitBounds points={points} padding={[50, 50]} />}
          {shown.map((c) => (
            <CircleMarker
              key={c.id}
              center={[c.latitude, c.longitude]}
              radius={sel === c.id ? 13 : 10}
              eventHandlers={{ click: () => setSel(c.id) }}
              pathOptions={{ color: "#fff", fillColor: "#1d3f8f", fillOpacity: 1, weight: 3 }}
            />
          ))}
        </MapContainer>
        <div className="absolute top-0 inset-x-0 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] z-[500]">
          <p className="text-xs font-semibold tracking-wide text-canopy-900 bg-white/90 rounded-full px-3 py-1 inline-block">JEJAK WANGI · Charger Station Surya</p>
          <div className="mt-2 flex items-center gap-2 bg-white rounded-2xl shadow px-3.5 py-2.5">
            <Icon name="search" size={17} className="text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari stasiun pengisian terdekat" aria-label="Cari stasiun" className="flex-1 text-sm bg-transparent focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-t-[1.75rem] -mt-5 z-[400] px-4 pt-4 pb-2 max-h-[42vh] overflow-y-auto">
        <p className="text-xs text-ink-500 mb-2">Isi daya HP gratis dengan energi matahari.</p>
        {list === null && <p className="text-sm text-ink-500">Memuat stasiun…</p>}
        {list && shown.length === 0 && <p className="text-sm text-ink-500">Stasiun tidak ditemukan.</p>}
        <div className="flex flex-col gap-2.5">
          {shown.map((c) => (
            <Link key={c.id} to={`/charger/${c.id}`} className={`rounded-2xl border p-3 flex items-center gap-3 ${sel === c.id ? "border-canopy-700 bg-canopy-100" : "border-canopy-800/10"}`}>
              <span className="h-11 w-11 rounded-xl bg-[#1d3f8f] text-white flex items-center justify-center shrink-0"><Icon name="bolt" size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-ink-900">{c.name}</p>
                <p className="text-xs text-ink-500 truncate">{c.location}</p>
                <p className={`text-xs font-medium mt-0.5 ${c.ports_available > 0 ? "text-canopy-700" : "text-alert-600"}`}>
                  {c.ports_available > 0 ? "Tersedia" : "Penuh"} · {c.ports_available}/{c.ports_total} port
                </p>
              </div>
              <Icon name="chevronLeft" size={16} className="rotate-180 text-ink-500" />
            </Link>
          ))}
        </div>
        <button onClick={() => navigate("/info")} className="w-full mt-3 mb-2 text-sm text-canopy-700 font-medium">Info & panduan pengisian</button>
      </div>
      <BottomNav fixed={false} />
    </div>
  );
}
