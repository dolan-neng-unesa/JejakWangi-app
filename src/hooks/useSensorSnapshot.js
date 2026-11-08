import { useEffect, useState } from "react";
import { getSensorSnapshot } from "../services/sensorService";
import { usePolling } from "./usePolling";

const POLL_INTERVAL_MS = 10 * 1000; // ESP32 kirim tiap 10 dtk; cache server 15 dtk

const EMPTY = { readings: {}, updatedAt: null, isStale: true, loading: false, error: null };

/**
 * Polling snapshot sensor satu koridor (data dari ESP32 lewat Laravel).
 * koridorId null/undefined = tidak ada koridor yang dipantau (tidak ada request).
 * state: { readings: { pm25: {value,...} }, updatedAt, isStale, loading, error }
 *
 * Polling berhenti saat tab tersembunyi dan mundur otomatis saat server bermasalah (usePolling).
 */
export function useSensorSnapshot(koridorId, pollIntervalMs = POLL_INTERVAL_MS) {
  const [state, setState] = useState({ ...EMPTY, loading: true });
  const enabled = koridorId != null;

  // Ganti koridor / berhenti dipantau: buang data koridor sebelumnya supaya tidak tampil di koridor yang salah.
  useEffect(() => {
    setState(enabled ? { ...EMPTY, loading: true } : EMPTY);
  }, [koridorId, enabled]);

  usePolling(
    async ({ isCancelled }) => {
      try {
        const snap = await getSensorSnapshot(koridorId);
        if (isCancelled()) return;
        if (!snap) {
          // Backend Laravel tidak dikonfigurasi: tidak ada data, tapi jangan "memuat" selamanya.
          setState({ ...EMPTY });
          return;
        }
        setState({
          readings: snap.readings ?? {},
          updatedAt: snap.updated_at,
          isStale: Boolean(snap.is_stale),
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!isCancelled()) setState((prev) => ({ ...prev, loading: false, error: err.message }));
        throw err; // memicu backoff di usePolling
      }
    },
    pollIntervalMs,
    enabled,
    koridorId
  );

  return state;
}
