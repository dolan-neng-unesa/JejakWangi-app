import { useNavigate } from "react-router-dom";
import { MapContainer, Circle, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import FitBounds from "../components/map/FitBounds";
import { useGeofence } from "../hooks/useGeofence";
import BaseTileLayer from "../components/map/BaseTileLayer";
import { MAP_CENTER } from "../lib/mapTiles";
import { toLatLng } from "../lib/geo";

export default function GeofencingPage() {
  const navigate = useNavigate();
  const { zones, watching, startWatching, simulateZone } = useGeofence();
  const mapZones = zones
    .map((z) => ({ zone: z, pos: toLatLng(z.latitude, z.longitude) }))
    .filter((x) => x.pos);

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"
          >
            <Icon name="chevronLeft" size={19} className="text-ink-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-ink-900">Geofencing</h1>
        </div>

        <div className="rounded-2xl overflow-hidden border border-canopy-800/10 h-52 mt-4">
          <MapContainer center={MAP_CENTER} zoom={15} scrollWheelZoom={false} className="h-full w-full">
            <BaseTileLayer />
            <FitBounds points={mapZones.map((x) => x.pos)} maxZoom={16} />
            {mapZones.map(({ zone, pos }) => (
              <Circle
                key={zone.id}
                center={pos}
                radius={zone.radius_meter ?? 60}
                pathOptions={{ color: "#3f6e45", fillColor: "#3f6e45", fillOpacity: 0.2, weight: 2 }}
                eventHandlers={{ click: () => simulateZone(zone) }}
              >
                <Tooltip direction="top">
                  {zone.name} · radius {zone.radius_meter ?? 60} m
                </Tooltip>
              </Circle>
            ))}
            {mapZones.map(({ zone, pos }) => (
              <CircleMarker key={`dot-${zone.id}`} center={pos} radius={4} pathOptions={{ color: "#3f6e45", fillColor: "#3f6e45", fillOpacity: 1 }} />
            ))}
          </MapContainer>
        </div>

        <h2 className="font-semibold text-ink-900 mt-5">Zona Aktifmu</h2>
        <p className="text-sm text-ink-500 mt-1">Svarga otomatis aktif saat kamu memasuki kawasan ini.</p>

        <div className="flex flex-col gap-2.5 mt-3">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => simulateZone(z)}
              className="bg-white rounded-2xl border border-canopy-800/10 p-3.5 flex items-center gap-3 text-left"
            >
              <span className="h-10 w-10 rounded-full bg-canopy-100 text-canopy-700 flex items-center justify-center shrink-0">
                <Icon name="pin" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-ink-900">{z.name}</p>
                <p className="text-xs text-ink-500">Audio & Info Aktif</p>
              </div>
              <span className="text-[0.65rem] font-medium text-canopy-700 bg-canopy-100 rounded-full px-2.5 py-1 shrink-0">
                Aktif
              </span>
            </button>
          ))}
        </div>

        <button className="w-full mt-3 border border-canopy-700 text-canopy-700 rounded-2xl py-3 font-medium flex items-center justify-center gap-1.5">
          <Icon name="plus" size={16} />
          Tambah Zona Baru
        </button>

        <div className="bg-ochre-100 border border-ochre-500/30 rounded-2xl p-3.5 mt-4 flex items-start gap-2.5">
          <Icon name="info" size={16} className="text-ochre-600 shrink-0 mt-0.5" />
          <p className="text-xs text-ochre-600 leading-relaxed">
            Masuk ke zona untuk mendapat pengalaman khusus sesuai lokasi.
          </p>
        </div>

        <button
          onClick={startWatching}
          disabled={watching}
          className="w-full mt-5 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium disabled:opacity-60"
        >
          {watching ? "Memantau lokasi Anda di seluruh app…" : "Aktifkan Pemantauan Lokasi Asli"}
        </button>
        <p className="text-[0.7rem] text-ink-500 text-center mt-2">
          Sekali diaktifkan, notifikasi akan tetap muncul walau berpindah halaman.
          Atau ketuk salah satu zona di atas untuk mensimulasikannya.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
