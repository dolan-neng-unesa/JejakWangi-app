import { USE_MOCK, delay, USE_LARAVEL_API } from "./config";
import { loadFirestore } from "./firebaseClient";
import { sensorDevices, latestReadingsByKoridor } from "../data/mockSensorReadings";

/**
 * Struktur Firestore yang diasumsikan:
 *   sensor_devices/{deviceId}      — status perangkat ESP32 (sama seperti tabel sensor_devices)
 *   sensor_latest/{koridorId}      — snapshot pembacaan terbaru per koridor, ditulis oleh
 *                                     Cloud Function/ESP32 setiap kali data baru masuk, supaya
 *                                     dashboard tidak perlu query ulang seluruh time series
 *                                     `sensor_readings` (yang tetap disimpan untuk riwayat/admin).
 */

/** Status perangkat sensor IoT (ESP32) per green space/koridor. */
export async function getSensorDevices() {
  if (USE_MOCK) {
    await delay();
    return sensorDevices;
  }
  const { db, getDocs, collection } = await loadFirestore();
  const snap = await getDocs(collection(db, "sensor_devices"));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

/** Pembacaan lingkungan terbaru untuk satu koridor (suhu, UV, bising, dst). */
export async function getLatestReading(koridorId) {
  if (USE_MOCK) {
    await delay(200);
    return latestReadingsByKoridor[koridorId] ?? null;
  }
  const { db, getDoc, doc } = await loadFirestore();
  const snap = await getDoc(doc(db, "sensor_latest", String(koridorId)));
  return snap.exists() ? snap.data() : null;
}

/**
 * Alur baca sensor ESP32 -> Laravel -> FE memakai dua endpoint publik:
 *   - GET /api/sensors/snapshot?koridor_id=N  semua jenis sensor satu koridor, 1 request
 *   - GET /api/sensors/active                 wilayah yang sedang ON di perangkat
 *
 * Endpoint /sensors/live dan /sensors/latest yang pernah dipakai di sini TIDAK ADA di
 * backend (hanya snapshot/active/history yang terdaftar), jadi tiap panggilannya 404.
 * Logika "data segar < 5 menit, kalau tidak tandai sebagai data lama dari DB" sekarang
 * ada di backend: setiap bacaan membawa `is_stale`, dan hook useSensorReading
 * menerjemahkannya jadi source 'live' | 'db'.
 *
 * Request sensor sengaja TIDAK lewat pemutus sirkuit (breaker:false): alur ESP32 dipantau
 * hook polling yang sudah punya backoff sendiri, dan data sensor tidak punya fallback mock.
 */
import { apiRequest } from "./laravelClient";

// Beberapa komponen (kartu polutan, halaman beranda) bisa meminta snapshot koridor yang sama
// dalam hitungan detik. Cache singkat menggabungkannya jadi satu request; server sendiri
// meng-cache 15 dtk, jadi TTL sependek ini tidak menambah kebasian yang terlihat.
const SNAPSHOT_TTL_MS = 3000;
const snapshotCache = new Map();

/**
 * Snapshot semua jenis sensor satu koridor dalam satu request.
 * Balasan: { koridor_id, updated_at, is_stale, readings: { pm25: { value, unit, recorded_at, is_stale }, ... } }
 * null kalau backend Laravel tidak dikonfigurasi.
 */
export function getSensorSnapshot(koridorId) {
  if (!USE_LARAVEL_API) return Promise.resolve(null);

  const key = koridorId == null ? "all" : String(koridorId);
  const hit = snapshotCache.get(key);
  if (hit && Date.now() - hit.at < SNAPSHOT_TTL_MS) return hit.promise;

  const query = koridorId == null ? "" : `?koridor_id=${encodeURIComponent(koridorId)}`;
  const promise = apiRequest(`/sensors/snapshot${query}`, { breaker: false });
  snapshotCache.set(key, { at: Date.now(), promise });
  promise.catch(() => {
    if (snapshotCache.get(key)?.promise === promise) snapshotCache.delete(key); // galat tidak boleh di-cache
  });
  return promise;
}

/**
 * Wilayah (koridor) yang sedang ON di perangkat ESP32 — hanya satu wilayah yang bisa aktif.
 * Balasan: { koridor_id: "2" | null, updated_at, is_stale }. null kalau backend Laravel tidak dikonfigurasi.
 */
export function getActiveKoridor() {
  if (!USE_LARAVEL_API) return Promise.resolve(null);
  return apiRequest("/sensors/active", { breaker: false });
}
