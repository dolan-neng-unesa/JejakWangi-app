import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { USE_MOCK, delay } from "./config";
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
