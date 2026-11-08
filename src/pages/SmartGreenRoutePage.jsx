import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { getGreenSpaces } from "../services/koridorService";
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from "../lib/mapTiles";

// Titik jalur hijau & UMKM di sekitarnya — koordinat perkiraan mengelilingi
// Taman Sritanjung & Taman Blambangan, dipakai untuk menggambar rute pada peta.
const routePath = [
  [-8.2194, 114.3697],
  [-8.219, 114.3691],
  [-8.2182, 114.3685],
  [-8.2178, 114.368],
  [-8.2175, 114.3675],
];

const umkmMarkers = [
  { id: 1, name: "Warung Bu Sari", lat: -8.219, lng: 114.3702 },
  { id: 2, name: "Kedai Kopi Osing", lat: -8.2185, lng: 114.3679 },
  { id: 3, name: "Es Dawet Mbak Tini", lat: -8.2178, lng: 114.3688 },
];

const routeOptions = [
  { id: "tercepat", label: "Rute Tercepat", minutes: 28, km: "6.5 km" },
  { id: "terhijau", label: "Rute Terhijau (Disarankan)", minutes: 32, km: "6.8 km", tag: "Udara Bersih", recommended: true },
  { id: "teduh", label: "Rute Paling Teduh", minutes: 30, km: "6.7 km" },
];

export default function SmartGreenRoutePage() {
  const navigate = useNavigate();
  const [greenSpaces, setGreenSpaces] = useState([]);
  const [selected, setSelected] = useState("terhijau");

  useEffect(() => {
    getGreenSpaces().then(setGreenSpaces);
  }, []);

  const center = [-8.2185, 114.3686];

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-sand-50">
      {/* Peta — tinggi tetap (bukan flex-1) supaya tata letak di bawahnya selalu bisa diprediksi */}
      <div className="relative shrink-0" style={{ height: "42vh" }}>
        <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution={MAP_TILE_ATTRIBUTION}
            url={MAP_TILE_URL}
          />

          {greenSpaces.map((s) => (
            <CircleMarker
              key={s.id}
              center={[s.latitude, s.longitude]}
              radius={9}
              pathOptions={{ color: "#3f6e45", fillColor: "#3f6e45", fillOpacity: 0.25, weight: 2 }}
            >
              <Tooltip direction="top">{s.name}</Tooltip>
            </CircleMarker>
          ))}

          <Polyline positions={routePath} pathOptions={{ color: "#3f6e45", weight: 5, opacity: 0.85 }} />
          {routePath.map((pos, i) => (
            <CircleMarker key={i} center={pos} radius={4} pathOptions={{ color: "#3f6e45", fillColor: "#3f6e45", fillOpacity: 1 }} />
          ))}

          {umkmMarkers.map((u) => (
            <CircleMarker
              key={u.id}
              center={[u.lat, u.lng]}
              radius={7}
              pathOptions={{ color: "#d4a039", fillColor: "#d4a039", fillOpacity: 0.9, weight: 2 }}
            >
              <Tooltip direction="top">{u.name}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Header mengambang di atas peta */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] z-[500] pointer-events-none">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white shadow flex items-center justify-center pointer-events-auto"
          >
            <Icon name="chevronLeft" size={19} className="text-ink-900" />
          </button>
          <h1 className="font-display font-semibold text-ink-900 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-sm">
            Smart Green Route
          </h1>
          <button
            aria-label="Filter rute"
            className="h-9 w-9 rounded-full bg-white shadow flex items-center justify-center pointer-events-auto"
          >
            <Icon name="sliders" size={17} className="text-ink-900" />
          </button>
        </div>

        {/* Legenda mengambang */}
        <div className="absolute top-16 left-4 bg-white/95 rounded-xl shadow px-3 py-2 z-[500] text-xs text-ink-700 flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-canopy-700" /> Titik hijau = Rute Hijau
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ochre-500" /> Titik oranye = UMKM Kuliner
          </span>
        </div>
      </div>

      {/* Panel pemilihan rute — sisa tinggi layar, scroll internal jika perlu */}
      <div className="relative flex-1 min-h-0 overflow-y-auto bg-white rounded-t-[1.75rem] -mt-5 z-[400] px-4 pt-5 pb-5">
        <h2 className="font-display font-bold text-lg text-ink-900 mb-3">Pilih Rute</h2>
        <div className="flex flex-col gap-2.5">
          {routeOptions.map((r) => {
            const isSelected = selected === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`w-full text-left rounded-2xl border p-3.5 flex items-center gap-3 transition-colors ${
                  isSelected ? "bg-canopy-100 border-canopy-700" : "bg-white border-canopy-800/10"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-canopy-700" : "border-canopy-800/25"
                  }`}
                >
                  {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-canopy-700" />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-ink-900">{r.label}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {r.minutes} menit • {r.km}
                    {r.tag && ` • ${r.tag}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate(`/route/${selected}`)}
          className="w-full mt-4 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium"
        >
          Tampilkan Rute
        </button>
      </div>

      <BottomNav fixed={false} />
    </div>
  );
}
