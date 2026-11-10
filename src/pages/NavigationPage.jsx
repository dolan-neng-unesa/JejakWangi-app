import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { getUmkmList } from "../services/contentService";
import BaseTileLayer from "../components/map/BaseTileLayer";
import { useSnappedRoutes } from "../hooks/useSnappedRoutes";
import { getRoute, ROUTE_DEST_NAME } from "../lib/demoRoute";
import { estimateMinutes, formatDistance, haversineMeters, pointAlong, toLatLng } from "../lib/geo";

const TICKS = 45; // simulasi selesai ±45 detik
const NEARBY_UMKM_RADIUS_M = 80;

function FollowPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.8 });
  }, [map, position]);
  return null;
}

/**
 * Simulasi layar navigasi (bukan GPS sungguhan): posisi "pengguna" bergerak
 * di sepanjang jalur rute yang dipilih. Jarak, ETA, dan instruksi dihitung
 * dari geometri jalur yang sama dengan halaman pilih rute & detail, jadi
 * angkanya selalu konsisten.
 */
export default function NavigationPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { routes } = useSnappedRoutes();
  const route = routes[getRoute(id).id];
  const path = route.path;
  const total = route.distanceMeters;

  const [progress, setProgress] = useState(0);
  const [umkms, setUmkms] = useState([]);

  useEffect(() => {
    getUmkmList().then(setUmkms).catch(() => setUmkms([]));
  }, []);

  useEffect(() => {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(total, p + total / TICKS);
        if (next >= total) clearInterval(timer);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [total, route.id]);

  const position = useMemo(() => pointAlong(path, progress), [path, progress]);
  const remaining = Math.max(0, total - progress);
  const arrived = remaining < 1;

  // UMKM terdekat dari posisi saat ini (hanya yang punya koordinat & dalam radius).
  const nearbyUmkm = useMemo(() => {
    let best = null;
    for (const u of umkms) {
      const pos = toLatLng(u.latitude, u.longitude);
      if (!pos) continue;
      const d = haversineMeters(position, pos);
      if (d <= NEARBY_UMKM_RADIUS_M && (!best || d < best.distance)) best = { name: u.business_name, pos, distance: d };
    }
    return best;
  }, [umkms, position]);

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-canopy-950">
      <div className="relative shrink-0" style={{ height: "44vh" }}>
        <MapContainer center={position} zoom={17} zoomControl={false} scrollWheelZoom={false} className="h-full w-full">
          <BaseTileLayer dark />
          <FollowPosition position={position} />
          <Polyline positions={path} pathOptions={{ color: "#5a9c66", weight: 7, opacity: 0.95 }} />
          <CircleMarker center={path[path.length - 1]} radius={7} pathOptions={{ color: "#d4a039", fillColor: "#d4a039", fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent direction="top" className="!bg-ochre-500 !text-canopy-950 !border-0 !text-[0.65rem] !font-medium">
              Tujuan
            </Tooltip>
          </CircleMarker>
          {nearbyUmkm && (
            <CircleMarker center={nearbyUmkm.pos} radius={6} pathOptions={{ color: "#d4a039", fillColor: "#fff", fillOpacity: 1, weight: 2 }}>
              <Tooltip permanent direction="top" className="!bg-white !text-ink-900 !border-0 !text-[0.65rem] !font-medium">
                {nearbyUmkm.name} · {formatDistance(nearbyUmkm.distance)}
              </Tooltip>
            </CircleMarker>
          )}
          <CircleMarker center={position} radius={8} pathOptions={{ color: "#fff", fillColor: "#2b6bd6", fillOpacity: 1, weight: 3 }} />
        </MapContainer>

        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] z-[500]">
          <span className="h-10 w-10 rounded-full bg-canopy-950/80 border border-sand-50/20 flex items-center justify-center text-sand-50">
            <Icon name="navigation" size={18} />
          </span>
          <span className="text-[0.65rem] font-semibold tracking-widest text-sand-50/80 bg-canopy-950/60 px-3 py-1 rounded-full">
            SIMULASI NAVIGASI
          </span>
          <div className="w-10" />
        </div>

        <div className="absolute bottom-4 left-4 bg-canopy-950/85 border border-sand-50/10 rounded-2xl px-4 py-3 z-[500] text-sand-50">
          <p className="text-[0.6rem] text-sand-100/70 tracking-wide">ETA</p>
          <p className="font-display font-bold text-lg leading-tight">{arrived ? "Tiba" : `${estimateMinutes(remaining)} mnt`}</p>
          <p className="text-[0.6rem] text-sand-100/70 tracking-wide mt-1.5">JARAK</p>
          <p className="font-data text-sm">{formatDistance(total)}</p>
        </div>
      </div>

      <div className="bg-canopy-700 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 text-sand-50">
            <Icon name={arrived ? "check" : "arrowRight"} size={18} className={arrived ? "" : "-rotate-90"} />
          </span>
          <div>
            <p className="text-sand-50 font-medium text-sm">
              {arrived ? `Anda telah tiba di ${ROUTE_DEST_NAME}` : "Ikuti jalur hijau di depan Anda"}
            </p>
            {!arrived && (
              <p className="text-sand-100/80 text-xs mt-0.5">
                Lurus terus sejauh {formatDistance(remaining)} menuju {ROUTE_DEST_NAME}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-sand-50 flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink-900">Sisa {formatDistance(remaining)}</p>
            <p className="text-xs text-ink-500 mt-0.5">
              {arrived ? "Perjalanan simulasi selesai" : `Estimasi tiba dalam ${estimateMinutes(remaining)} menit`}
            </p>
          </div>
          <button
            onClick={() => navigate(`/route/detail/${route.id}`)}
            className="text-alert-600 bg-alert-600/10 text-sm font-medium px-4 py-2 rounded-full"
          >
            Akhiri Navigasi
          </button>
        </div>
        <p className="text-[0.7rem] text-ink-500 mt-3">
          Ini simulasi di jalur contoh, belum memakai GPS. Posisi biru bergerak otomatis di sepanjang rute.
        </p>
      </div>
      <BottomNav fixed={false} />
    </div>
  );
}
