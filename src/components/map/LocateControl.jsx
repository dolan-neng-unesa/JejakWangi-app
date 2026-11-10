import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";

const MESSAGES = {
  denied: "Izin lokasi ditolak. Aktifkan lewat pengaturan browser.",
  unavailable: "Lokasi tidak tersedia saat ini.",
  unsupported: "Browser ini tidak mendukung geolokasi.",
};

/**
 * Tombol "lokasi saya" + penanda posisi pengguna di peta. Izin lokasi baru
 * diminta saat tombol diketuk (bukan otomatis saat halaman dibuka).
 */
export default function LocateControl({ offsetBottom = 28 }) {
  const map = useMap();
  const boxRef = useRef(null);
  const watchRef = useRef(null);
  const flownRef = useRef(false);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (boxRef.current) L.DomEvent.disableClickPropagation(boxRef.current);
    return () => {
      if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!navigator.geolocation) {
      setError(MESSAGES.unsupported);
      return;
    }
    setError(null);
    if (watchRef.current != null) {
      if (position) map.flyTo(position.latlng, Math.max(map.getZoom(), 17));
      return;
    }
    setLocating(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        setPosition({ latlng, accuracy: pos.coords.accuracy });
        setLocating(false);
        if (!flownRef.current) {
          flownRef.current = true;
          map.flyTo(latlng, Math.max(map.getZoom(), 17));
        }
      },
      (err) => {
        setLocating(false);
        if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
        setError(err.code === 1 ? MESSAGES.denied : MESSAGES.unavailable);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, [map, position]);

  return (
    <>
      {position && (
        <>
          <Circle
            center={position.latlng}
            radius={Math.min(position.accuracy, 200)}
            pathOptions={{ color: "#2b6bd6", weight: 1, fillColor: "#2b6bd6", fillOpacity: 0.12 }}
          />
          <CircleMarker
            center={position.latlng}
            radius={7}
            pathOptions={{ color: "#fff", weight: 2.5, fillColor: "#2b6bd6", fillOpacity: 1 }}
          />
        </>
      )}
      <div className="leaflet-bottom leaflet-right" ref={boxRef}>
        <div className="leaflet-control flex flex-col items-end gap-1.5" style={{ marginBottom: offsetBottom }}>
          {error && (
            <span className="max-w-[12rem] rounded-lg bg-white/95 px-2.5 py-1.5 text-[0.65rem] text-ink-700 shadow">
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={handleClick}
            aria-label="Tampilkan lokasi saya"
            className="h-10 w-10 rounded-full bg-white shadow flex items-center justify-center text-canopy-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r={locating ? 3 : 4} />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
