// SVARGA — Konfigurasi peta bersama, dipakai di semua halaman yang menampilkan
// Leaflet (MapPage, SmartGreenRoutePage, RouteDetailPage, NavigationPage,
// GeofencingPage) supaya gaya & titik awal peta konsisten di seluruh app.
//
// Tile dimuat lewat <BaseTileLayer> (components/map/BaseTileLayer.jsx) yang
// otomatis pindah ke penyedia berikutnya di daftar ini kalau tile gagal
// dimuat (diblokir, kena rate limit, offline sebagian), supaya peta dasar
// tidak pernah kosong. Pakai VITE_MAPTILER_API_KEY (paling mudah), atau
// VITE_MAP_TILE_URL / VITE_MAP_TILE_URL_DARK untuk penyedia lain (Stadia,
// self-host, dst.) — keduanya otomatis jadi pilihan pertama.

import "./leafletIcons";

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTO_ATTRIBUTION = `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`;

export const MAP_TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || CARTO_ATTRIBUTION;

const custom = (url, attribution) => (url ? [{ id: "custom", url, attribution: attribution || MAP_TILE_ATTRIBUTION }] : []);

// API key penyedia tile (BUKAN key Leaflet — Leaflet hanya library, tidak punya
// key). Isi VITE_MAPTILER_API_KEY di .env.local (daftar gratis di maptiler.com,
// lalu restart `npm run dev`). Kalau key terisi, MapTiler jadi pilihan pertama.
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const MAPTILER_ATTRIBUTION = `&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> ${OSM_ATTRIBUTION}`;
const maptiler = (style) =>
  MAPTILER_KEY
    ? [{ id: `maptiler-${style}`, url: `https://api.maptiler.com/maps/${style}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, attribution: MAPTILER_ATTRIBUTION }]
    : [];

// Urutan = prioritas. Tanpa API key, OSM standar (tanpa key) didahulukan karena
// tile CARTO bisa membalas gambar "API key required" — gambar itu dianggap
// sukses oleh browser sehingga fallback otomatis tidak terpicu.
// OSM standar tidak punya varian gelap: mode gelap tanpa key memakai tile terang.
const OSM = { id: "osm", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: OSM_ATTRIBUTION };
const CARTO_LIGHT = { id: "carto-light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: CARTO_ATTRIBUTION };
const CARTO_DARK = { id: "carto-dark", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: CARTO_ATTRIBUTION };

export const TILE_PROVIDERS = [
  ...custom(import.meta.env.VITE_MAP_TILE_URL, import.meta.env.VITE_MAP_TILE_ATTRIBUTION),
  ...maptiler("streets-v2"),
  OSM,
  CARTO_LIGHT,
];

export const TILE_PROVIDERS_DARK = [
  ...custom(import.meta.env.VITE_MAP_TILE_URL_DARK, import.meta.env.VITE_MAP_TILE_ATTRIBUTION),
  ...maptiler("streets-v2-dark"),
  OSM,
  CARTO_DARK,
];

// Tetap diekspor supaya kode lama yang mengimpor konstanta ini tidak pecah.
export const MAP_TILE_URL = TILE_PROVIDERS[0].url;
export const MAP_TILE_URL_DARK = TILE_PROVIDERS_DARK[0].url;

// Pusat kota Banyuwangi (antara Taman Sritanjung & Taman Blambangan).
export const MAP_CENTER = [-8.2185, 114.3686];
export const MAP_DEFAULT_ZOOM = 16;
