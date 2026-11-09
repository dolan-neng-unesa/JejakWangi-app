import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, Polyline, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/global/Icon";
import Skeleton from "../components/global/Skeleton";
import BottomNav from "../components/layout/BottomNav";
import BaseTileLayer from "../components/map/BaseTileLayer";
import FitBounds from "../components/map/FitBounds";
import { useKoridorRoutes } from "../hooks/useKoridorRoutes";
import { formatDistance } from "../lib/geo";

function Message({ children, onBack }) {
  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"
        >
          <Icon name="chevronLeft" size={19} className="text-ink-900" />
        </button>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

// Detail rute = detail koridor yang dipilih (id rute = id koridor).
export default function RouteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, routes } = useKoridorRoutes();
  const route = routes[id];

  if (loading) {
    return (
      <Message onBack={() => navigate(-1)}>
        <Skeleton className="h-52 w-full mt-4" />
      </Message>
    );
  }
  if (!route || !route.hasPath) {
    return (
      <Message onBack={() => navigate(-1)}>
        <p className="text-sm text-ink-500 mt-6">
          {route ? "Jalur koridor ini belum tersedia." : "Koridor tidak ditemukan."}
        </p>
      </Message>
    );
  }

  const routePath = route.path;
  const center = routePath[Math.floor(routePath.length / 2)];
  const k = route.koridor;

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="relative h-52 shrink-0">
        <MapContainer center={center} zoom={16} zoomControl={false} dragging={false} scrollWheelZoom={false} className="h-full w-full">
          <FitBounds points={routePath} padding={[24, 24]} />
          <BaseTileLayer />
          <Polyline positions={routePath} pathOptions={{ color: "#3f6e45", weight: 6, opacity: 0.9 }} />
          <CircleMarker center={routePath[0]} radius={6} pathOptions={{ color: "#3f6e45", fillColor: "#fff", fillOpacity: 1, weight: 3 }} />
          <CircleMarker center={routePath[routePath.length - 1]} radius={6} pathOptions={{ color: "#3f6e45", fillColor: "#3f6e45", fillOpacity: 1, weight: 3 }} />
        </MapContainer>

        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] z-[500]">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white/90 shadow flex items-center justify-center">
            <Icon name="chevronLeft" size={19} className="text-ink-900" />
          </button>
          <h1 className="font-display font-semibold text-sm text-white drop-shadow">{route.label}</h1>
          <button aria-label="Bagikan rute" className="h-9 w-9 rounded-full bg-white/90 shadow flex items-center justify-center">
            <Icon name="share" size={16} className="text-ink-900" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-28 max-w-md mx-auto w-full">
        <p className="text-xs text-ink-500 mb-3">{route.routeLabel}</p>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-canopy-100 rounded-2xl p-3 text-center">
            <p className="font-display font-bold text-lg text-canopy-700">{route.minutes} mnt</p>
            <p className="text-[0.65rem] text-ink-500 mt-0.5">Waktu Tempuh</p>
          </div>
          <div className="bg-sand-100 rounded-2xl p-3 text-center">
            <p className="font-display font-bold text-lg text-ink-900">{formatDistance(route.distanceMeters)}</p>
            <p className="text-[0.65rem] text-ink-500 mt-0.5">Jarak</p>
          </div>
          <div className="bg-canopy-100 rounded-2xl p-3 text-center">
            <p className={`font-display font-bold text-lg ${route.airQualityTone}`}>{route.airQuality}</p>
            <p className="text-[0.65rem] text-ink-500 mt-0.5">Kualitas Udara</p>
          </div>
        </div>

        {k.condition_desc && (
          <>
            <h2 className="font-semibold text-ink-900 mt-6 mb-2">{k.condition_title ?? "Kondisi Koridor"}</h2>
            <p className="text-sm text-ink-500 leading-relaxed">{k.condition_desc}</p>
          </>
        )}

        <h2 className="font-semibold text-ink-900 mt-6 mb-2">Fitur Rute</h2>
        <ul className="flex flex-col gap-2">
          {route.features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-ink-700">
              <span className="h-5 w-5 rounded-full bg-canopy-100 text-canopy-700 flex items-center justify-center shrink-0">
                <Icon name="check" size={12} strokeWidth={2.4} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <p className="text-[0.7rem] text-ink-500 mt-4">
          Jalur mengikuti data koridor (koordinat perkiraan, belum hasil survei lapangan).
        </p>

        <button
          onClick={() => navigate(`/route/detail/${route.id}/navigasi`)}
          className="w-full mt-6 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium"
        >
          Mulai Navigasi
        </button>
        <button
          onClick={() => navigate(`/aktivitas?koridor=${route.id}`)}
          className="w-full mt-2.5 bg-canopy-100 text-canopy-800 rounded-2xl py-3 font-medium"
        >
          Rekam Jejak Jalan (seperti Strava)
        </button>
        <button
          onClick={() => navigate(`/koridor/${route.koridorId}`)}
          className="w-full mt-2.5 bg-transparent text-canopy-700 border border-canopy-700/25 rounded-2xl py-3 font-medium"
        >
          Lihat Detail Koridor
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
