import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { USE_MOCK, delay, USE_LARAVEL_API, LARAVEL_API_BASE } from "./config";
import { db } from "./firebaseClient";
import { geofences, soundscapes } from "../data/mockContent";

/**
 * Geofencing & Soundscape Therapy — sesuai arahan mentor, backend dipindah
 * ke Laravel (lihat GeofenceController & SoundscapeController). Urutan
 * sumber data sama seperti fitur lain: Laravel -> Firestore -> mock.
 * Pendeteksian zona (Haversine, findActiveZone di bawah) TETAP berjalan
 * client-side sesuai Batasan 4.1 proposal — hanya daftar zona yang
 * sumbernya berpindah.
 */
async function fetchLaravel(path) {
  const res = await fetch(`${LARAVEL_API_BASE}${path}`);
  if (!res.ok) throw new Error(`Laravel API ${path} merespons ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

/** Ambil seluruh zona geofencing yang aktif. */
export async function getActiveGeofences() {
  if (USE_LARAVEL_API) {
    try {
      return await fetchLaravel("/geofences");
    } catch (err) {
      console.warn("Laravel API (geofences) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay();
    return geofences.filter((g) => g.is_active);
  }
  const snap = await getDocs(query(collection(db, "geofences"), where("is_active", "==", true)));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

export async function getSoundscape(soundscapeId) {
  if (USE_LARAVEL_API) {
    try {
      return await fetchLaravel(`/soundscapes/${soundscapeId}`);
    } catch (err) {
      console.warn("Laravel API (soundscapes) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay(150);
    return soundscapes.find((s) => s.id === soundscapeId) ?? null;
  }
  const snap = await getDoc(doc(db, "soundscapes", String(soundscapeId)));
  return snap.exists() ? { id: Number(snap.id), ...snap.data() } : null;
}

/**
 * Haversine formula — jarak antara dua titik koordinat dalam meter.
 * Dipakai murni di client (lihat Batasan 4.1: geofencing berjalan client-side,
 * hanya aktif saat halaman PWA foreground). Tidak bergantung pada Firestore.
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
