import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { getGreenSpaces } from "../services/koridorService";
import BaseTileLayer from "../components/map/BaseTileLayer";
import FitBounds from "../components/map/FitBounds";
import LocateControl from "../components/map/LocateControl";
import { getUmkmList } from "../services/contentService";
import { MAP_CENTER } from "../lib/mapTiles";
import { DEFAULT_ROUTE_ID, ROUTES } from "../lib/demoRoute";
import { useSnappedRoutes } from "../hooks/useSnappedRoutes";
import { formatDistance, toLatLng } from "../lib/geo";

export default function SmartGreenRoutePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [greenSpaces, setGreenSpaces] = useState([]);
  // Kalau datang dari daftar Route A-E, preset dikirim lewat ?preset=... supaya
  // opsi yang paling relevan sudah terpilih duluan (lihat RouteListPage.jsx).
  const [selected, setSelected] = useState(() => {
    const preset = searchParams.get("preset");
    return preset && ROUTES[preset] ? preset : DEFAULT_ROUTE_ID;
  });
  const [umkms, setUmkms] = useState([]);

  useEffect(() => {
    getGreenSpaces().then(setGreenSpaces).catch(() => setGreenSpaces([]));
    getUmkmList().then(setUmkms).catch(() => setUmkms([]));
  }, []);

  const umkmMarkers = useMemo(
    () => umkms.map((u) => ({ id: u.id, name: u.business_name, pos: toLatLng(u.latitude, u.longitude) })).filter((u) => u.pos),
    [umkms]
  );
  // Jalur dicocokkan ke jalan nyata; jarak & menit ikut dihitung ulang.
  const { routes, list: routeList } = useSnappedRoutes();
  const allRoutePoints = useMemo(() => routeList.flatMap((r) => r.path), [routeList]);
  const selectedRoute = routes[selected];

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-sand-50">
      {/* Peta — tinggi tetap (bukan flex-1) supaya tata letak di bawahnya selalu bisa diprediksi */}
      <div className="relative shrink-0" style={{ height: "42vh" }}>
        <MapContainer center={MAP_CENTER} zoom={15} scrollWheelZoom className="h-full w-full">
          <BaseTileLayer />

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

          <FitBounds points={allRoutePoints} padding={[40, 40]} />

          {/* Alternatif yang tidak dipilih: samar. Yang dipilih: tebal di atasnya. */}
          {routeList.filter((r) => r.id !== selected).map((r) => (
            <Polyline key={r.id} positions={r.path} pathOptions={{ color: "#7a8a7e", weight: 4, opacity: 0.5, dashArray: "6 8" }} />
          ))}
          <Polyline key={selected} positions={selectedRoute.path} pathOptions={{ color: "#3f6e45", weight: 6, opacity: 0.9 }} />
          <CircleMarker center={selectedRoute.path[0]} radius={6} pathOptions={{ color: "#3f6e45", fillColor: "#fff", fillOpacity: 1, weight: 3 }} />
          <CircleMarker center={selectedRoute.path[selectedRoute.path.length - 1]} radius={6} pathOptions={{ color: "#3f6e45", fillColor: "#3f6e45", fillOpacity: 1, weight: 3 }} />

          {umkmMarkers.map((u) => (
            <CircleMarker
              key={u.id}
              center={u.pos}
              radius={7}
              pathOptions={{ color: "#d4a039", fillColor: "#d4a039", fillOpacity: 0.9, weight: 2 }}
            >
              <Tooltip direction="top">{u.name}</Tooltip>
            </CircleMarker>
          ))}
          <LocateControl offsetBottom={44} />
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
          <span className="text-[0.65rem] text-ink-500">Jalur mengikuti jalan pada peta (titik singgah masih contoh)</span>
        </div>
      </div>

      {/* Panel pemilihan rute — sisa tinggi layar, scroll internal jika perlu */}
      <div className="relative flex-1 min-h-0 overflow-y-auto bg-white rounded-t-[1.75rem] -mt-5 z-[400] px-4 pt-5 pb-5">
        <h2 className="font-display font-bold text-lg text-ink-900 mb-3">Pilih Rute</h2>
        <div className="flex flex-col gap-2.5">
          {routeList.map((r) => {
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
                    {r.minutes} menit • {formatDistance(r.distanceMeters)}
                    {r.tag && ` • ${r.tag}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate(`/route/detail/${selected}`)}
          className="w-full mt-4 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium"
        >
          Tampilkan Rute
        </button>
      </div>

      <BottomNav fixed={false} />
    </div>
  );
}
