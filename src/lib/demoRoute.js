// Rute contoh Smart Green Route. Belum ada tabel/API rute di backend, jadi
// tiga alternatif ini berupa jalur contoh antara Taman Sritanjung dan Taman
// Blambangan (koordinat taman diambil dari data green_spaces). Jarak & waktu
// DIHITUNG dari geometri jalurnya (bukan angka karangan), sehingga selalu
// konsisten di halaman pilih rute, detail, dan navigasi.
//
// TODO: ganti `path` dengan hasil survei / routing engine (OSRM, GraphHopper)
// begitu data rute nyata tersedia.

import { estimateMinutes, pathLengthMeters } from "./geo";

export const ROUTE_START_NAME = "Taman Sritanjung";
export const ROUTE_DEST_NAME = "Taman Blambangan";

const RAW_ROUTES = [
  {
    id: "tercepat",
    label: "Rute Tercepat",
    title: "Rute Tercepat",
    airQuality: "Sedang",
    airQualityTone: "text-ochre-600",
    trend: [22, 28, 34, 30, 26, 24],
    features: ["Jalur terpendek ke tujuan", "Melewati jalan utama", "Sedikit area teduh", "Berpotensi ramai kendaraan"],
    path: [
      [-8.21944, 114.36972],
      [-8.21886, 114.36905],
      [-8.21808, 114.36817],
      [-8.2175, 114.3675],
    ],
  },
  {
    id: "terhijau",
    label: "Rute Terhijau (Disarankan)",
    title: "Rute Terhijau",
    tag: "Udara Bersih",
    recommended: true,
    airQuality: "Baik",
    airQualityTone: "text-canopy-700",
    trend: [18, 14, 16, 15, 13, 14],
    features: ["Kualitas udara sangat baik", "Banyak pepohonan pelindung", "Tingkat kebisingan rendah", "Lebih banyak area teduh"],
    path: [
      [-8.21944, 114.36972],
      [-8.21833, 114.36951],
      [-8.21748, 114.36869],
      [-8.2175, 114.3675],
    ],
  },
  {
    id: "teduh",
    label: "Rute Paling Teduh",
    title: "Rute Paling Teduh",
    airQuality: "Baik",
    airQualityTone: "text-canopy-700",
    trend: [20, 16, 15, 17, 16, 15],
    features: ["Cakupan kanopi pohon tertinggi", "Terlindung dari sinar matahari", "Nyaman untuk siang hari", "Sedikit lebih jauh dari tercepat"],
    path: [
      [-8.21944, 114.36972],
      [-8.21923, 114.36872],
      [-8.21853, 114.36777],
      [-8.2175, 114.3675],
    ],
  },
];

export const ROUTES = Object.fromEntries(
  RAW_ROUTES.map((r) => {
    const distanceMeters = pathLengthMeters(r.path);
    return [r.id, { ...r, distanceMeters, minutes: estimateMinutes(distanceMeters) }];
  })
);

export const ROUTE_LIST = Object.values(ROUTES);
export const DEFAULT_ROUTE_ID = "terhijau";

/** Ambil rute berdasarkan id; id tak dikenal jatuh ke rute default. */
export function getRoute(id) {
  return ROUTES[id] ?? ROUTES[DEFAULT_ROUTE_ID];
}
