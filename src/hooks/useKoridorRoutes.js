import { useEffect, useMemo, useState } from "react";
import { getKoridorList } from "../services/koridorService";
import { loadPathOverrides } from "../lib/koridorPathOverrides";
import { isValidPath } from "../lib/roadSnap";
import { estimateMinutes } from "../lib/geo";
import { useSnappedPaths } from "./useSnappedPaths";

// Smart Green Route = koridor. Setiap koridor (dari API/mock `koridors`) adalah satu rute:
// nama, label rute, jalur (`path`), UMKM, skor hijau, dan sensornya semua berasal dari
// data koridor — tidak ada lagi daftar rute terpisah. Koridor yang belum punya `path`
// tetap muncul dengan hasPath=false (jalurnya belum disurvei), bukan disembunyikan.

const LEVEL_LABEL = {
  paling_hijau: "Paling hijau",
  agak_hijau: "Agak hijau",
  setengah_hijau: "Setengah hijau",
  tidak_hijau: "Tidak hijau",
};

const GOOD_AIR = ["Sehat", "Baik"];

function airTone(status) {
  if (!status) return "text-ink-500";
  return GOOD_AIR.includes(status) ? "text-canopy-700" : status === "Sedang" ? "text-ochre-600" : "text-alert-600";
}

function describe(k) {
  const s = k.sensor ?? {};
  const out = [];
  if (LEVEL_LABEL[k.hijau_level]) out.push(`Tingkat kehijauan: ${LEVEL_LABEL[k.hijau_level]}`);
  if (k.shade_score != null) out.push(`Skor keteduhan ${k.shade_score}/100`);
  if (s.pm25 != null) out.push(`Kualitas udara ${s.pm25_status ?? ""} (PM2.5 ${s.pm25})`.replace("  ", " "));
  if (s.suhu != null) out.push(`Suhu ${s.suhu}°C${s.suhu_status ? ` · ${s.suhu_status}` : ""}`);
  if (k.umkm_count) out.push(`${k.umkm_count} UMKM kuliner di sekitar koridor`);
  return out;
}

/**
 * Daftar rute turunan koridor.
 * @returns {{ loading: boolean, list: Route[], routes: Record<string, Route> }}
 * Route: { id, koridorId, koridor, label, routeLabel, destName, status, hasPath, path, distanceMeters,
 *          minutes, snapped, airQuality, airQualityTone, features }
 */
export function useKoridorRoutes() {
  const [koridors, setKoridors] = useState(null);
  const [overrides] = useState(loadPathOverrides); // jalur gambar tim (mode edit /map?edit=1) mengalahkan `path` API

  useEffect(() => {
    let cancelled = false;
    getKoridorList()
      .then((l) => !cancelled && setKoridors(Array.isArray(l) ? l : []))
      .catch(() => !cancelled && setKoridors([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo(
    () =>
      (koridors ?? [])
        .map((k) => ({ id: k.id, path: isValidPath(overrides[k.id]) ? overrides[k.id] : k.path }))
        .filter((e) => isValidPath(e.path)),
    [koridors, overrides]
  );
  const snapped = useSnappedPaths(entries);

  return useMemo(() => {
    const list = (koridors ?? []).map((k) => {
      const s = snapped[k.id];
      const distanceMeters = s ? s.distanceMeters : null;
      const parts = String(k.route_label ?? "").split(" - ");
      return {
        id: String(k.id),
        koridorId: k.id,
        koridor: k,
        label: k.formal_name,
        routeLabel: k.route_label,
        destName: parts.length > 1 ? parts[parts.length - 1] : k.short_name ?? k.formal_name,
        status: k.status,
        hasPath: Boolean(s),
        path: s?.path ?? null,
        distanceMeters,
        minutes: s ? estimateMinutes(distanceMeters) : null,
        snapped: Boolean(s?.snapped),
        airQuality: k.sensor?.pm25_status ?? "–",
        airQualityTone: airTone(k.sensor?.pm25_status),
        features: describe(k),
      };
    });
    return { loading: koridors === null, list, routes: Object.fromEntries(list.map((r) => [r.id, r])) };
  }, [koridors, snapped]);
}
