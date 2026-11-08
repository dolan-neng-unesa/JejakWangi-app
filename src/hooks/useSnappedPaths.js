import { useEffect, useMemo, useState } from "react";
import { isValidPath, snapToRoads } from "../lib/roadSnap";
import { pathLengthMeters } from "../lib/geo";

const DEBOUNCE_MS = 500;

/**
 * Cocokkan banyak jalur ke jalan nyata (lihat lib/roadSnap.js).
 * entries: [{ id, path: [[lat,lng],...] }]
 * Mengembalikan { [id]: { path, distanceMeters, snapped } }. Hasil langsung
 * tersedia dalam bentuk waypoint mentah (snapped:false), lalu diganti jalur
 * hasil snapping begitu siap — peta tidak perlu menunggu.
 */
export function useSnappedPaths(entries) {
  const signature = useMemo(() => JSON.stringify(entries.map((e) => [e.id, e.path])), [entries]);
  const [snapped, setSnapped] = useState({});

  useEffect(() => {
    let cancelled = false;
    const list = JSON.parse(signature).filter(([, path]) => isValidPath(path));

    const timer = setTimeout(async () => {
      // Berurutan (bukan paralel) supaya sopan terhadap layanan routing gratis.
      for (const [id, path] of list) {
        const result = await snapToRoads(path);
        if (cancelled) return;
        setSnapped((prev) => ({ ...prev, [`${id}:${JSON.stringify(path)}`]: result }));
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signature]);

  return useMemo(() => {
    const out = {};
    for (const { id, path } of entries) {
      if (!isValidPath(path)) continue;
      out[id] =
        snapped[`${id}:${JSON.stringify(path)}`] ?? { path, distanceMeters: pathLengthMeters(path), snapped: false };
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, snapped]);
}
