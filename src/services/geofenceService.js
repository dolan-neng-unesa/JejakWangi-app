import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { USE_MOCK, delay } from "./config";
import { db } from "./firebaseClient";
import { geofences, soundscapes } from "../data/mockContent";

/** Ambil seluruh zona geofencing yang aktif. */
export async function getActiveGeofences() {
  if (USE_MOCK) {
    await delay();
    return geofences.filter((g) => g.is_active);
  }
  const snap = await getDocs(query(collection(db, "geofences"), where("is_active", "==", true)));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

export async function getSoundscape(soundscapeId) {
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
