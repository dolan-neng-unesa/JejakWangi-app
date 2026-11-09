import { useEffect, useRef, useState } from "react";
import { getLiveSensorReading, getLastSensorReadingFromDb } from "../services/sensorService";

/**
 * Uji coba konsumsi 2 API sensor di FE (arahan mentor ke Radhi, 7 Sep 2026):
 *
 *   "tambahin kondisi untuk konsumsi 2 api, jeda load api yang dikonsum
 *    sama BE itu 5 menit, jika FE tidak konsumsi api dari sensor langsung
 *    dalam 5 menit itu ada opsi buat ngambil last data dari DB"
 *
 * Cara kerja hook ini:
 *   1. Poll GET /api/sensors/live setiap POLL_INTERVAL_MS (default 30 detik).
 *   2. Simpan kapan terakhir kali dapat data "segar" (is_stale: false).
 *   3. Kalau sudah FRESHNESS_WINDOW_MS (5 menit) berlalu sejak data segar
 *      terakhir — artinya FE gagal "konsumsi API dari sensor langsung"
 *      dalam jendela waktu itu — hook otomatis memanggil
 *      GET /api/sensors/latest sebagai fallback dan menandai `source: 'db'`
 *      + `isStale: true`, supaya UI bisa menampilkan indikator "data lama".
 *   4. Begitu /live kembali memberi data segar, sumber otomatis balik ke
 *      'live' lagi tanpa perlu reload halaman.
 *
 * Dipakai untuk 2 jenis sensor uji coba: 'temperature' dan 'air_quality'.
 * Kalau backend Laravel belum dikonfigurasi (VITE_LARAVEL_API_URL kosong),
 * hook ini tidak melakukan apa-apa (source tetap null) supaya halaman bisa
 * fallback ke sumber data lain (mis. mock/Firestore) tanpa error.
 */

const FRESHNESS_WINDOW_MS = 5 * 60 * 1000; // 5 menit, samakan dengan BE (SensorReadingController::FRESHNESS_WINDOW_MINUTES)
const POLL_INTERVAL_MS = 30 * 1000; // seberapa sering FE mencoba /live

export function useSensorReading(sensorType, koridorId, options = {}) {
  const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;

  const [state, setState] = useState({
    data: null, // { id, device_code, sensor_type, value, unit, recorded_at }
    source: null, // 'live' | 'db' | null (belum ada data sama sekali)
    isStale: false,
    loading: true,
    error: null,
  });

  // Kapan terakhir kali FE benar-benar berhasil "konsumsi API dari sensor
  // langsung" (live, bukan fallback DB). Dipakai untuk menghitung jendela 5 menit.
  const lastFreshAtRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timerId;

    async function tick() {
      try {
        const live = await getLiveSensorReading(sensorType, koridorId);

        if (cancelled) return;

        if (live && !live.is_stale && live.data) {
          // Kondisi 1: berhasil konsumsi API langsung dalam jendela 5 menit.
          lastFreshAtRef.current = Date.now();
          setState({ data: live.data, source: "live", isStale: false, loading: false, error: null });
          return;
        }

        // /live tidak punya data segar. Cek sudah berapa lama sejak terakhir fresh.
        const elapsedSinceFresh = lastFreshAtRef.current ? Date.now() - lastFreshAtRef.current : Infinity;

        if (elapsedSinceFresh < FRESHNESS_WINDOW_MS) {
          // Belum genap 5 menit sejak data segar terakhir — cukup tunggu polling
          // berikutnya, tidak perlu fallback dulu (hindari flicker ke data lama).
          return;
        }

        // Kondisi 2: FE tidak berhasil konsumsi API sensor langsung selama
        // 5 menit -> ambil last data dari DB sebagai fallback.
        const fallback = await getLastSensorReadingFromDb(sensorType, koridorId);
        if (cancelled) return;

        if (fallback?.data) {
          setState({ data: fallback.data, source: "db", isStale: true, loading: false, error: null });
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    }

    tick();
    timerId = setInterval(tick, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorType, koridorId, pollIntervalMs]);

  return state;
}
