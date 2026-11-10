import { useMemo } from "react";
import { ROUTE_LIST } from "../lib/demoRoute";
import { estimateMinutes } from "../lib/geo";
import { useSnappedPaths } from "./useSnappedPaths";

const ENTRIES = ROUTE_LIST.map((r) => ({ id: r.id, path: r.path }));

/**
 * Tiga rute Smart Green Route dengan jalur yang sudah dicocokkan ke jalan
 * nyata. Jarak & menit dihitung ulang dari jalur hasil snapping, jadi tetap
 * konsisten di halaman pilih rute, detail, dan navigasi.
 * Mengembalikan { routes: {id: route}, list: [route], snapped: boolean }.
 */
export function useSnappedRoutes() {
  const snapped = useSnappedPaths(ENTRIES);

  return useMemo(() => {
    const routes = {};
    for (const r of ROUTE_LIST) {
      const s = snapped[r.id];
      const distanceMeters = s?.snapped ? s.distanceMeters : r.distanceMeters;
      routes[r.id] = {
        ...r,
        path: s?.snapped ? s.path : r.path,
        distanceMeters,
        minutes: estimateMinutes(distanceMeters),
        snapped: Boolean(s?.snapped),
      };
    }
    return { routes, list: ROUTE_LIST.map((r) => routes[r.id]), snapped: Object.values(routes).every((r) => r.snapped) };
  }, [snapped]);
}
