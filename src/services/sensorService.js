import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { USE_MOCK, delay, USE_LARAVEL_API, LARAVEL_API_BASE } from "./config";
import { db } from "./firebaseClient";
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
  const snap = await getDocs(collection(db, "sensor_devices"));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

/** Pembacaan lingkungan terbaru untuk satu koridor (suhu, UV, bising, dst). */
export async function getLatestReading(koridorId) {
  if (USE_MOCK) {
    await delay(200);
    return latestReadingsByKoridor[koridorId] ?? null;
  }
  const snap = await getDoc(doc(db, "sensor_latest", String(koridorId)));
  return snap.exists() ? snap.data() : null;
}

/**
 * Uji coba input sensor BE Laravel (arahan mentor, 7 Sep 2026): suhu &
 * kualitas udara. Alur baca di sisi FE mengikuti dua endpoint BE:
 *
 *   - GET /api/sensors/live    → data "langsung" (< 5 menit), dipakai untuk
 *                                 polling normal. { data, is_stale }
 *   - GET /api/sensors/latest  → fallback: baris terakhir di DB berapa pun
 *                                 umurnya, dipakai kalau /live tidak punya
 *                                 data segar dalam 5 menit. { data, is_stale }
 *
 * Kondisi "5 menit lalu fallback ke DB" secara penuh (termasuk polling &
 * penentuan kapan harus pindah sumber) ada di hook useSensorReading.js —
 * dua fungsi di bawah ini hanya pembungkus fetch tipis, supaya hook bisa
 * memanggil endpoint yang tepat tanpa tahu detail URL/format Laravel.
 *
 * Jenis sensor yang didukung sejauh ini: 'temperature', 'air_quality'.
 */
async function fetchSensorEndpoint(path, sensorType, koridorId) {
  const params = new URLSearchParams({ sensor_type: sensorType });
  if (koridorId != null) params.set("koridor_id", String(koridorId));
  const res = await fetch(`${LARAVEL_API_BASE}${path}?${params.toString()}`);
  if (!res.ok) throw new Error(`Sensor API ${path} merespons ${res.status}`);
  return res.json(); // { data, is_stale, ... }
}

/** Data sensor "langsung" (< 5 menit). null kalau backend Laravel tidak dikonfigurasi. */
export async function getLiveSensorReading(sensorType, koridorId) {
  if (!USE_LARAVEL_API) return null;
  return fetchSensorEndpoint("/sensors/live", sensorType, koridorId);
}

/** Fallback: bacaan terakhir yang tersimpan di DB, berapa pun umurnya. */
export async function getLastSensorReadingFromDb(sensorType, koridorId) {
  if (!USE_LARAVEL_API) return null;
  return fetchSensorEndpoint("/sensors/latest", sensorType, koridorId);
}
