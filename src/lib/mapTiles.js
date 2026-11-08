// SVARGA — Konfigurasi tile peta bersama, dipakai di semua halaman yang
// menampilkan Leaflet (SmartGreenRoutePage, RouteDetailPage, NavigationPage,
// MapPage) supaya gaya peta konsisten di seluruh app.
//
// Memakai CartoDB Positron (tile gratis, atribusi tetap OpenStreetMap) —
// warnanya lebih muted/netral dibanding tile OSM standar yang ramai warna,
// jadi lebih selaras dengan palet hijau-krem SVARGA dan lebih dekat ke
// nuansa peta bergaya minimal pada mockup UI.

export const MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Varian gelap — dipakai di NavigationPage (mode navigasi aktif, latar gelap).
export const MAP_TILE_URL_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
