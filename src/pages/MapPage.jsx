import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PageShell from "../components/layout/PageShell";
import { getGreenSpaces } from "../services/koridorService";
import { getKoridorList } from "../services/koridorService";
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from "../lib/mapTiles";

export default function MapPage() {
  const [spaces, setSpaces] = useState([]);
  const [koridor, setKoridor] = useState(null);

  useEffect(() => {
    getGreenSpaces().then(setSpaces);
    getKoridorList().then((list) => setKoridor(list.find((k) => k.status === "pilot")));
  }, []);

  const center = [-8.2185, 114.3686];
  const line =
    koridor?.start_latitude != null
      ? [
          [koridor.start_latitude, koridor.start_longitude],
          [koridor.end_latitude, koridor.end_longitude],
        ]
      : [];

  return (
    <PageShell title="Peta Koridor" hideNav={false}>
      <div className="rounded-2xl overflow-hidden border border-canopy-800/10 h-[60vh]">
        <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution={MAP_TILE_ATTRIBUTION}
            url={MAP_TILE_URL}
          />
          {spaces.map((s) => (
            <Marker key={s.id} position={[s.latitude, s.longitude]}>
              <Popup>{s.name}</Popup>
            </Marker>
          ))}
          {line.length > 0 && <Polyline positions={line} pathOptions={{ color: "#2b6339", weight: 5 }} />}
        </MapContainer>
      </div>
      <p className="text-xs text-ink-500 mt-3">
        Peta dasar: OpenStreetMap (Leaflet.js). Garis hijau menandai koridor pilot Sritanjung–Blambangan.
      </p>
    </PageShell>
  );
}
