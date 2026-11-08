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
import { useActiveKoridor } from "../hooks/useActiveKoridor";
import { useSensorSnapshot } from "../hooks/useSensorSnapshot";
import { calcIspu } from "../lib/ispu";
import { saranIspu } from "../lib/journey";
import EcoCoach from "../components/global/EcoCoach";
import { getChargers } from "../services/chargerService";
import { MAP_CENTER } from "../lib/mapTiles";
import { useKoridorRoutes } from "../hooks/useKoridorRoutes";
import { formatDistance, toLatLng } from "../lib/geo";

export default function SmartGreenRoutePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [greenSpaces, setGreenSpaces] = useState([]);
  // ?koridor=ID dari daftar rute / detail koridor: koridor itu sudah terpilih duluan.
  const [picked, setPicked] = useState(null);
  const [umkms, setUmkms] = useState([]);
  const [chargers, setChargers] = useState([]);
  // Alur sistem: cek ISPU dulu; kalau tidak sehat, beri saran rute/waktu lain (tidak memblokir).
  const active = useActiveKoridor();
  const snap = useSensorSnapshot(active.koridorId);
  const ispu = calcIspu(Object.fromEntries(Object.entries(snap.readings).map(([k, r]) => [k, r.value])));
  const saran = saranIspu(ispu);

  useEffect(() => {
    getGreenSpaces().then(setGreenSpaces).catch(() => setGreenSpaces([]));
    getUmkmList().then(setUmkms).catch(() => setUmkms([]));
    getChargers().then(setChargers).catch(() => setChargers([]));
  }, []);

  const umkmMarkers = useMemo(
    () => umkms.map((u) => ({ id: u.id, name: u.business_name, pos: toLatLng(u.latitude, u.longitude) })).filter((u) => u.pos),
    [umkms]
  );
  // Rute = koridor yang sudah punya jalur; jalur dicocokkan ke jalan nyata, jarak & menit ikut dihitung ulang.
  const { loading, list } = useKoridorRoutes();
  const routeList = useMemo(() => list.filter((r) => r.hasPath), [list]);
  const wanted = searchParams.get("koridor");
  const selected = picked ?? (routeList.some((r) => r.id === wanted) ? wanted : routeList[0]?.id ?? null);
  const selectedRoute = routeList.find((r) => r.id === selected) ?? null;
  const allRoutePoints = useMemo(() => routeList.flatMap((r) => r.path), [routeList]);

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
          {selectedRoute && (
            <>
              <Polyline key={selected} positions={selectedRoute.path} pathOptions={{ color: "#3f6e45", weight: 6, opacity: 0.9 }} />
              <CircleMarker center={selectedRoute.path[0]} radius={6} pathOptions={{ color: "#3f6e45", fillColor: "#fff", fillOpacity: 1, weight: 3 }} />
              <CircleMarker center={selectedRoute.path[selectedRoute.path.length - 1]} radius={6} pathOptions={{ color: "#3f6e45", fillColor: "#3f6e45", fillOpacity: 1, weight: 3 }} />
            </>
          )}

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
          {chargers.map((c) => (
            <CircleMarker
              key={`ch-${c.id}`}
              center={[c.latitude, c.longitude]}
              radius={7}
              eventHandlers={{ click: () => navigate(`/charger/${c.id}`) }}
              pathOptions={{ color: "#fff", fillColor: "#1d3f8f", fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top">{c.name} · {c.ports_available}/{c.ports_total} port</Tooltip>
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
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-info-600" /> Titik biru = Charger station surya
          </span>
          <span className="text-[0.65rem] text-ink-500">Jalur koridor mengikuti jalan pada peta</span>
        </div>
      </div>

      {/* Panel pemilihan rute — sisa tinggi layar, scroll internal jika perlu */}
      <div className="relative flex-1 min-h-0 overflow-y-auto bg-white rounded-t-[1.75rem] -mt-5 z-[400] px-4 pt-5 pb-5">
        {saran.pesan && (
          <p role="status" className={`mb-3 rounded-xl px-3 py-2 text-xs leading-snug ${saran.sehat ? "bg-canopy-100 text-canopy-800" : "bg-ochre-100 text-ochre-600"}`}>
            ISPU {ispu.value}: {saran.pesan}
          </p>
        )}
        <EcoCoach page="rute" ispu={ispu} className="mb-3" />
        <h2 className="font-display font-bold text-lg text-ink-900 mb-3">Pilih Koridor</h2>
        {loading && <p className="text-sm text-ink-500">Memuat koridor…</p>}
        {!loading && routeList.length === 0 && (
          <p className="text-sm text-ink-500">Belum ada koridor dengan jalur yang tersedia.</p>
        )}
        <div className="flex flex-col gap-2.5">
          {routeList.map((r) => {
            const isSelected = selected === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setPicked(r.id)}
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
                  <p className="text-xs text-ink-500 mt-0.5">{r.routeLabel}</p>
                  <p className="text-xs text-ink-500">
                    {r.minutes} menit • {formatDistance(r.distanceMeters)}
                    {r.status === "rencana" ? " • Rencana" : r.status === "pilot" ? " • Pilot" : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate(`/route/detail/${selected}`)}
          disabled={!selectedRoute}
          className="w-full mt-4 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium disabled:opacity-50"
        >
          Tampilkan Rute
        </button>
      </div>

      <BottomNav fixed={false} />
    </div>
  );
}
