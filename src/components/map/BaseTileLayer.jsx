import { useCallback, useEffect, useRef, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { TILE_PROVIDERS, TILE_PROVIDERS_DARK } from "../../lib/mapTiles";

// Berapa tile gagal berturut-turut (tanpa satu pun berhasil) sebelum pindah penyedia.
const ERRORS_BEFORE_SWITCH = 4;

/**
 * Pengganti <TileLayer>: (1) pindah otomatis ke penyedia tile berikutnya kalau
 * yang sekarang gagal, dan (2) memanggil map.invalidateSize() saat ukuran
 * kontainer berubah — penyebab umum tile "tidak kelihatan" (abu-abu/terpotong)
 * adalah Leaflet diinisialisasi saat kontainer belum punya ukuran final
 * (mis. tinggi dari flex/vh, atau transisi halaman).
 */
export default function BaseTileLayer({ dark = false }) {
  const map = useMap();
  const providers = dark ? TILE_PROVIDERS_DARK : TILE_PROVIDERS;
  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const errors = useRef(0);
  const provider = providers[Math.min(index, providers.length - 1)];

  // --- Ukuran kontainer ---
  useEffect(() => {
    const container = map.getContainer();
    const refresh = () => map.invalidateSize({ animate: false });
    const t1 = setTimeout(refresh, 0);
    const t2 = setTimeout(refresh, 350);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(refresh);
      ro.observe(container);
    }
    window.addEventListener("resize", refresh);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro?.disconnect();
      window.removeEventListener("resize", refresh);
    };
  }, [map]);

  // --- Fallback penyedia ---
  const handleError = useCallback(() => {
    errors.current += 1;
    if (errors.current < ERRORS_BEFORE_SWITCH) return;
    errors.current = 0;
    if (index < providers.length - 1) setIndex(index + 1);
    else setExhausted(true);
  }, [index, providers.length]);

  const handleLoad = useCallback(() => {
    errors.current = 0;
    setExhausted(false);
  }, []);

  return (
    <>
      <TileLayer
        key={provider.id}
        url={provider.url}
        attribution={provider.attribution}
        maxZoom={19}
        eventHandlers={{ tileerror: handleError, tileload: handleLoad }}
      />
      {exhausted && (
        <div className="leaflet-bottom leaflet-left" style={{ pointerEvents: "none" }}>
          <div className="leaflet-control" style={{ background: "#fff", padding: "4px 8px", borderRadius: 8, fontSize: 11, margin: 8 }}>
            Peta dasar gagal dimuat — periksa koneksi internet.
          </div>
        </div>
      )}
    </>
  );
}
