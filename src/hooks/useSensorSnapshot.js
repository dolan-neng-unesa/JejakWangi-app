import { useEffect, useState } from "react";
import { getSensorSnapshot } from "../services/sensorService";

const POLL_INTERVAL_MS = 10 * 1000; // ESP32 kirim tiap 10 dtk; cache server 15 dtk

/**
 * Polling snapshot sensor satu koridor (data dari ESP32 lewat Laravel).
 * koridorId null/undefined = tidak ada koridor yang dipantau (tidak ada request).
 * state: { readings: { pm25: {value,...} }, updatedAt, isStale, loading, error }
 */
export function useSensorSnapshot(koridorId, pollIntervalMs = POLL_INTERVAL_MS) {
  const [state, setState] = useState({ readings: {}, updatedAt: null, isStale: true, loading: true, error: null });

  useEffect(() => {
    // Tanpa koridor (mis. tidak ada wilayah aktif) jangan polling — kosongkan data.
    if (koridorId == null) {
      setState({ readings: {}, updatedAt: null, isStale: true, loading: false, error: null });
      return undefined;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    async function tick() {
      try {
        const snap = await getSensorSnapshot(koridorId);
        if (cancelled || !snap) return;
        setState({
          readings: snap.readings ?? {},
          updatedAt: snap.updated_at,
          isStale: Boolean(snap.is_stale),
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    }

    tick();
    const id = setInterval(tick, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [koridorId, pollIntervalMs]);

  return state;
}
