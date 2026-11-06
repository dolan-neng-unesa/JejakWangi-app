import { useState } from "react";
import { getActiveKoridor } from "../services/sensorService";
import { usePolling } from "./usePolling";

const POLL_INTERVAL_MS = 5 * 1000; // ESP32 langsung kirim saat wilayah di-ON/OFF

/**
 * Polling wilayah yang sedang aktif (LED ON) di ESP32.
 * state: { koridorId: number | null, loading, error }
 */
export function useActiveKoridor(pollIntervalMs = POLL_INTERVAL_MS) {
  const [state, setState] = useState({ koridorId: null, loading: true, error: null });

  usePolling(async ({ isCancelled }) => {
    try {
      const res = await getActiveKoridor();
      if (isCancelled()) return;
      const id = res?.koridor_id != null ? Number(res.koridor_id) : null;
      setState({ koridorId: Number.isFinite(id) ? id : null, loading: false, error: null });
    } catch (err) {
      if (!isCancelled()) setState((prev) => ({ ...prev, loading: false, error: err.message }));
      throw err;
    }
  }, pollIntervalMs);

  return state;
}
