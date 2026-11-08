import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { MAP_TILE_URL_DARK, MAP_TILE_ATTRIBUTION } from "../lib/mapTiles";

const routePath = [
  [-8.2194, 114.3697],
  [-8.219, 114.3691],
  [-8.2182, 114.3685],
  [-8.2178, 114.368],
  [-8.2175, 114.3675],
];

const nearbyUmkm = { name: "Warung Bu Sari", distance: "50m", position: routePath[2] };

/**
 * Simulasi layar navigasi langsung — versi 2D fungsional dari mockup
 * (mockup memakai peta perspektif 3D bergaya Mapbox/Google Maps yang
 * di luar cakupan Leaflet+OSM; di sini info yang sama tetap disampaikan:
 * highlight jalur, instruksi belok, ETA & sisa jarak).
 */
export default function NavigationPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-canopy-950">
      <div className="relative shrink-0" style={{ height: "44vh" }}>
        <MapContainer center={routePath[2]} zoom={17} zoomControl={false} className="h-full w-full">
          <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL_DARK} />
          <Polyline positions={routePath} pathOptions={{ color: "#5a9c66", weight: 7, opacity: 0.95 }} />
          <CircleMarker center={routePath[0]} radius={5} pathOptions={{ color: "#5a9c66", fillColor: "#0f1f16", fillOpacity: 1, weight: 3 }} />
          <CircleMarker center={routePath[routePath.length - 1]} radius={7} pathOptions={{ color: "#d4a039", fillColor: "#d4a039", fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent direction="top" className="!bg-ochre-500 !text-canopy-950 !border-0 !text-[0.65rem] !font-medium">
              Tujuan
            </Tooltip>
          </CircleMarker>
          <CircleMarker center={nearbyUmkm.position} radius={6} pathOptions={{ color: "#d4a039", fillColor: "#fff", fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent direction="top" className="!bg-white !text-ink-900 !border-0 !text-[0.65rem] !font-medium">
              {nearbyUmkm.name} · {nearbyUmkm.distance}
            </Tooltip>
          </CircleMarker>
        </MapContainer>

        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] z-[500]">
          <button
            aria-label="Kompas"
            className="h-10 w-10 rounded-full bg-canopy-950/80 border border-sand-50/20 flex items-center justify-center text-sand-50"
          >
            <Icon name="navigation" size={18} />
          </button>
          <span className="text-[0.65rem] font-semibold tracking-widest text-sand-50/80 bg-canopy-950/60 px-3 py-1 rounded-full">
            NAVIGASI AKTIF
          </span>
          <div className="w-10" />
        </div>

        <div className="absolute bottom-4 left-4 bg-canopy-950/85 border border-sand-50/10 rounded-2xl px-4 py-3 z-[500] text-sand-50">
          <p className="text-[0.6rem] text-sand-100/70 tracking-wide">ETA</p>
          <p className="font-display font-bold text-lg leading-tight">10 mnt</p>
          <p className="text-[0.6rem] text-sand-100/70 tracking-wide mt-1.5">JARAK</p>
          <p className="font-data text-sm">2.5 km</p>
        </div>
      </div>

      <div className="bg-canopy-700 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 text-sand-50">
            <Icon name="arrowRight" size={18} className="-rotate-90" />
          </span>
          <div>
            <p className="text-sand-50 font-medium text-sm">Ikuti jalur hijau di depan Anda</p>
            <p className="text-sand-100/80 text-xs mt-0.5">Lurus terus sejauh 150 meter menuju dr. Sutomo</p>
          </div>
        </div>
      </div>

      <div className="bg-sand-50 flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink-900">Sisa 850m</p>
            <p className="text-xs text-ink-500 mt-0.5">Estimasi tiba dalam 9 menit</p>
          </div>
          <button
            onClick={() => navigate(`/route/${id}`)}
            className="text-alert-600 bg-alert-600/10 text-sm font-medium px-4 py-2 rounded-full"
          >
            Akhiri Navigasi
          </button>
        </div>
      </div>
      <BottomNav fixed={false} />
    </div>
  );
}
