// Util geometri kecil untuk peta (tanpa dependensi).

const EARTH_RADIUS_M = 6371000;
// Kecepatan jalan kaki rata-rata ±4,8 km/jam.
export const WALK_SPEED_M_PER_MIN = 80;

/** Jarak dua titik [lat, lng] dalam meter (Haversine). */
export function haversineMeters(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Panjang polyline [[lat,lng], ...] dalam meter. */
export function pathLengthMeters(path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) total += haversineMeters(path[i], path[i + 1]);
  return total;
}

/** Titik pada polyline setelah menempuh `distance` meter dari titik awal. */
export function pointAlong(path, distance) {
  if (distance <= 0) return path[0];
  let travelled = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = haversineMeters(path[i], path[i + 1]);
    if (travelled + seg >= distance) {
      const t = seg === 0 ? 0 : (distance - travelled) / seg;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * t, path[i][1] + (path[i + 1][1] - path[i][1]) * t];
    }
    travelled += seg;
  }
  return path[path.length - 1];
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.max(0, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function estimateMinutes(meters) {
  return Math.max(1, Math.round(meters / WALK_SPEED_M_PER_MIN));
}

/** Kembalikan [lat, lng] valid atau null (koordinat bisa null dari API). */
export function toLatLng(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  return lat == null || lng == null || Number.isNaN(la) || Number.isNaN(ln) ? null : [la, ln];
}
