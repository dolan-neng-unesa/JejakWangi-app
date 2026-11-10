import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Menyesuaikan tampilan peta agar seluruh `points` ([lat,lng]) terlihat.
 * Hanya dijalankan ulang bila isi points/padding/maxZoom benar-benar berubah
 * (bukan sekadar array baru di setiap render), supaya tidak menimpa geseran
 * peta oleh pengguna.
 */
export default function FitBounds({ points, padding = [32, 32], maxZoom = 17 }) {
  const map = useMap();
  const key = JSON.stringify([points ?? [], padding, maxZoom]);

  useEffect(() => {
    const [pts, pad, zoom] = JSON.parse(key);
    if (!pts.length) return;
    map.fitBounds(L.latLngBounds(pts), { padding: pad, maxZoom: zoom });
  }, [key, map]);

  return null;
}
