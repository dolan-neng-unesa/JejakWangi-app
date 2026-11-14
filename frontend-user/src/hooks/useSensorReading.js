import { useMemo } from "react";
import { useSensorSnapshot } from "./useSensorSnapshot";

/**
 * Bacaan satu jenis sensor/polutan ('temperature', 'pm25', 'pm10', 'so2', 'co', 'o3', 'no2', ...)
 * untuk satu koridor, diambil dari snapshot (1 request untuk semua jenis).
 *
 * Arahan mentor (7 Sep 2026): data "langsung" jika segar (< 5 menit), jika tidak tampilkan
 * data terakhir dari DB dan tandai sebagai data lama. Penentuan segar/tidaknya dilakukan
 * backend per bacaan (`is_stale`, jendela 5 menit = SensorReadingModel::FRESHNESS_WINDOW_MINUTES),
 * jadi tidak perlu lagi dua endpoint terpisah (/live & /latest — keduanya memang tidak ada di
 * backend dan selalu 404) maupun penghitung 5 menit di FE.
 *
 * Return: { data, source, isStale, loading, error }
 *   data   — { sensor_type, value, unit, recorded_at } atau null
 *   source — 'live' (segar) | 'db' (data lama) | null (belum ada bacaan / backend tidak aktif)
 *   origin — asal nilai: 'sensor' (ESP32) | 'open-meteo' (cadangan saat tak ada ESP32 aktif) | null
 *
 * Banyak kartu polutan di satu halaman memanggil hook ini dengan koridor yang sama; request
 * snapshot-nya digabung oleh cache singkat di sensorService, bukan satu request per kartu.
 */
const POLL_INTERVAL_MS = 30 * 1000;

export function useSensorReading(sensorType, koridorId, options = {}) {
  const snap = useSensorSnapshot(koridorId, options.pollIntervalMs ?? POLL_INTERVAL_MS);
  const reading = snap.readings[sensorType] ?? null;

  return useMemo(
    () => ({
      data: reading,
      source: reading ? (reading.is_stale ? "db" : "live") : null,
      origin: reading ? (reading.source === "open-meteo" ? "open-meteo" : "sensor") : null,
      isStale: reading ? Boolean(reading.is_stale) : false,
      loading: snap.loading,
      error: snap.error,
    }),
    [reading, snap.loading, snap.error]
  );
}
