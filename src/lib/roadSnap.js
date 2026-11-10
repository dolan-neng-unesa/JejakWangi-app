// Mencocokkan titik-titik jalur (waypoint) ke JALAN NYATA di peta OpenStreetMap
// supaya garis koridor/rute mengikuti bentuk jalan, bukan garis lurus antar titik.
//
// Memakai layanan routing pejalan kaki komunitas OSM (routing.openstreetmap.de,
// profil `foot`). Hasil di-cache (memori + localStorage) per kumpulan waypoint,
// jadi tiap jalur hanya diminta sekali per perangkat. Kalau layanan tidak
// terjangkau, fungsi TIDAK melempar galat: mengembalikan waypoint apa adanya
// (snapped: false) dan menahan percobaan ulang sebentar agar konsol tidak
// dipenuhi request gagal.
//
// Override: VITE_ROUTING_URL (mis. OSRM/Valhalla-compatible sendiri), format
// sama: `${URL}/{lng,lat;lng,lat...}?overview=full&geometries=geojson`.

import { pathLengthMeters } from "./geo";

const ROUTER_URL = import.meta.env.VITE_ROUTING_URL || "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const CACHE_KEY = "svarga:road-snap:v1";
const RETRY_AFTER_MS = 60 * 1000;
const TIMEOUT_MS = 8000;
// Hasil routing yang >2,5x lebih panjang dari garis lurus antar waypoint dianggap
// salah tempel (mis. titik jatuh di sisi sungai/jalan satu arah) dan ditolak.
const MAX_DETOUR_RATIO = 2.5;

const memory = new Map();
const inflight = new Map();
let failedAt = 0;

const keyOf = (waypoints) => waypoints.map(([la, ln]) => `${la.toFixed(5)},${ln.toFixed(5)}`).join("|");

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeStore(key, value) {
  try {
    const store = readStore();
    store[key] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    /* kuota penuh / storage diblokir — cukup cache memori */
  }
}

function fallback(waypoints) {
  return { path: waypoints, distanceMeters: pathLengthMeters(waypoints), snapped: false };
}

/** Waypoint [[lat,lng],...] valid (>= 2 titik, semua angka)? */
export function isValidPath(p) {
  return (
    Array.isArray(p) &&
    p.length >= 2 &&
    p.every((pt) => Array.isArray(pt) && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])))
  );
}

/**
 * @param {number[][]} waypoints  [[lat,lng],...] berurutan
 * @returns {Promise<{path:number[][], distanceMeters:number, snapped:boolean}>}
 */
export async function snapToRoads(waypoints) {
  if (!isValidPath(waypoints)) return fallback([]);
  const wp = waypoints.map(([la, ln]) => [Number(la), Number(ln)]);
  const key = keyOf(wp);

  if (memory.has(key)) return memory.get(key);
  const stored = readStore()[key];
  if (stored?.path?.length > 1) {
    const hit = { path: stored.path, distanceMeters: stored.distanceMeters, snapped: true };
    memory.set(key, hit);
    return hit;
  }

  if (Date.now() - failedAt < RETRY_AFTER_MS) return fallback(wp);
  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    try {
      const coords = wp.map(([la, ln]) => `${ln},${la}`).join(";");
      const res = await fetch(`${ROUTER_URL}/${coords}?overview=full&geometries=geojson&steps=false`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`routing ${res.status}`);
      const json = await res.json();
      const route = json.routes?.[0];
      const line = route?.geometry?.coordinates;
      if (json.code !== "Ok" || !Array.isArray(line) || line.length < 2) throw new Error("routing kosong");

      const path = line.map(([ln, la]) => [la, ln]); // GeoJSON [lng,lat] -> Leaflet [lat,lng]
      const distanceMeters = Number.isFinite(route.distance) ? route.distance : pathLengthMeters(path);
      if (distanceMeters > pathLengthMeters(wp) * MAX_DETOUR_RATIO + 50) throw new Error("jalur memutar terlalu jauh");

      const result = { path, distanceMeters, snapped: true };
      memory.set(key, result);
      writeStore(key, { path, distanceMeters });
      return result;
    } catch {
      failedAt = Date.now();
      return fallback(wp);
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, job);
  return job;
}
