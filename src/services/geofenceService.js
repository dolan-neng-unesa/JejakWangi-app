import { delay } from "./config";
import { fetchLaravel, isLaravelAvailable } from "./laravelClient";
import { geofences, soundscapes } from "../data/mockContent";

/**
 * Geofencing & Soundscape Therapy — data dari backend Laravel (lihat
 * GeofenceController & SoundscapeController). Urutan sumber data:
 * Laravel -> mock. Pendeteksian zona (Haversine, findActiveZone di bawah)
 * TETAP berjalan client-side sesuai Batasan 4.1 proposal — hanya daftar
 * zona yang diambil dari server.
 */
/** Ambil seluruh zona geofencing yang aktif. */
export async function getActiveGeofences() {
  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel("/geofences");
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  await delay();
  return geofences.filter((g) => g.is_active);
}

export async function getSoundscape(soundscapeId) {
  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel(`/soundscapes/${soundscapeId}`);
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  await delay(150);
  return soundscapes.find((s) => s.id === soundscapeId) ?? null;
}

/**
 * Haversine formula — jarak antara dua titik koordinat dalam meter.
 * Dipakai murni di client (lihat Batasan 4.1: geofencing berjalan client-side,
 * hanya aktif saat halaman PWA foreground). Tidak bergantung pada backend.
 */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Cek apakah suatu titik pengguna sedang berada di dalam salah satu zona geofence. */
export function findActiveZone(userLat, userLon, zones) {
  return (
    zones.find(
      (zone) => distanceMeters(userLat, userLon, zone.latitude, zone.longitude) <= zone.radius_meter
    ) ?? null
  );
}
