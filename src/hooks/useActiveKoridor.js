import { useEffect, useState } from "react";
import { getActiveKoridor } from "../services/sensorService";

const POLL_INTERVAL_MS = 5 * 1000; // ESP32 langsung kirim saat wilayah di-ON/OFF

/**
 * Polling wilayah yang sedang aktif (LED ON) di ESP32.
 * state: { koridorId: number | null, loading, error }
 */
export function useActiveKoridor(pollIntervalMs = POLL_INTERVAL_MS) {
  const [state, setState] = useState({ koridorId: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await getActiveKoridor();
        if (cancelled) return;
        const id = res?.koridor_id != null ? Number(res.koridor_id) : null;
        setState({ koridorId: id, loading: false, error: null });
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
  }, [pollIntervalMs]);

  return state;
}
