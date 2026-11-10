// SVARGA — Konfigurasi peta bersama, dipakai di semua halaman yang menampilkan
// Leaflet (MapPage, SmartGreenRoutePage, RouteDetailPage, NavigationPage,
// GeofencingPage) supaya gaya & titik awal peta konsisten di seluruh app.
//
// Tile dimuat lewat <BaseTileLayer> (components/map/BaseTileLayer.jsx) yang
// otomatis pindah ke penyedia berikutnya di daftar ini kalau tile gagal
// dimuat (diblokir, kena rate limit, offline sebagian), supaya peta dasar
// tidak pernah kosong. Untuk produksi isi VITE_MAP_TILE_URL (dan
// VITE_MAP_TILE_URL_DARK) dengan penyedia sendiri (MapTiler, Stadia,
// self-host, dst.) — penyedia itu otomatis jadi pilihan pertama.

import "./leafletIcons";

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTO_ATTRIBUTION = `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`;

export const MAP_TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || CARTO_ATTRIBUTION;

const custom = (url, attribution) => (url ? [{ id: "custom", url, attribution: attribution || MAP_TILE_ATTRIBUTION }] : []);

// Urutan = prioritas. OSM standar tidak punya varian gelap, jadi untuk mode
// gelap fallback-nya tetap tile terang (lebih baik daripada peta kosong).
export const TILE_PROVIDERS = [
  ...custom(import.meta.env.VITE_MAP_TILE_URL, import.meta.env.VITE_MAP_TILE_ATTRIBUTION),
  { id: "carto-light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: CARTO_ATTRIBUTION },
  { id: "osm", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: OSM_ATTRIBUTION },
];

export const TILE_PROVIDERS_DARK = [
  ...custom(import.meta.env.VITE_MAP_TILE_URL_DARK, import.meta.env.VITE_MAP_TILE_ATTRIBUTION),
  { id: "carto-dark", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: CARTO_ATTRIBUTION },
  ...TILE_PROVIDERS.filter((p) => p.id !== "custom"),
];

// Tetap diekspor supaya kode lama yang mengimpor konstanta ini tidak pecah.
export const MAP_TILE_URL = TILE_PROVIDERS[0].url;
export const MAP_TILE_URL_DARK = TILE_PROVIDERS_DARK[0].url;

// Pusat kota Banyuwangi (antara Taman Sritanjung & Taman Blambangan).
export const MAP_CENTER = [-8.2185, 114.3686];
export const MAP_DEFAULT_ZOOM = 16;
