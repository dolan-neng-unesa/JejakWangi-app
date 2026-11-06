import { useEffect, useRef } from "react";

const MAX_BACKOFF_MS = 60 * 1000;

/**
 * Polling yang ramah baterai & server, dipakai semua hook data langsung:
 *  - TIDAK menumpuk request: tick berikutnya dijadwalkan setelah tick sebelumnya selesai
 *    (setInterval + request lambat = beberapa request menggantung bersamaan).
 *  - Berhenti selama tab/aplikasi tersembunyi (document.hidden) dan langsung menyegarkan
 *    saat kembali terlihat — PWA di saku tidak perlu menembak server tiap 5 detik.
 *  - Backoff eksponensial saat `task` melempar galat (maks. 60 dtk), kembali normal begitu sukses.
 *
 * @param {(ctx: {isCancelled: () => boolean}) => Promise<void>|void} task dipanggil tiap tick; lempar galat untuk memicu backoff
 * @param {number} intervalMs jeda normal antar tick
 * @param {boolean} [enabled=true] false = tidak ada polling sama sekali
 * @param {unknown} [resetKey] berubah = polling dimulai ulang dari awal (tick langsung) dan hasil
 *   request yang masih berjalan dianggap batal — pakai untuk parameter seperti id koridor.
 */
export function usePolling(task, intervalMs, enabled = true, resetKey = undefined) {
  const taskRef = useRef(task);
  useEffect(() => {
    taskRef.current = task; // selalu pakai closure terbaru tanpa memulai ulang polling
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let running = false;
    let failures = 0;
    let timer = null;

    const schedule = () => {
      if (cancelled) return;
      timer = setTimeout(run, Math.min(intervalMs * 2 ** failures, MAX_BACKOFF_MS));
    };

    async function run() {
      timer = null;
      if (cancelled || running) return;
      if (document.hidden) return; // dilanjutkan oleh onVisibility
      running = true;
      try {
        await taskRef.current({ isCancelled: () => cancelled });
        failures = 0;
      } catch {
        failures = Math.min(failures + 1, 6);
      } finally {
        running = false;
      }
      schedule();
    }

    const onVisibility = () => {
      if (document.hidden || running || cancelled) return;
      clearTimeout(timer);
      run();
    };

    document.addEventListener("visibilitychange", onVisibility);
    run();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled, resetKey]);
}
