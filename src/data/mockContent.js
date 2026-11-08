// Data contoh (mock) — soundscapes, geofences, umkm, events, bfest

import umkmWarungBuSari from "../assets/pages/koridor/umkm-warungbusari.png";
import umkmEsDawet from "../assets/pages/koridor/umkm-esdawet.png";
import zoneBgBlambangan from "../assets/pages/geofencing/zone-bg-blambangan.png";

export const soundscapes = [
  { id: 1, title: "Gending Using Sore Hari", category: "gamelan_using", duration: "05:10", audio_url: "/audio/gending-using-sore.mp3", is_active: true },
  { id: 2, title: "Angklung Paglak", category: "gamelan_using", duration: "03:45", audio_url: "/audio/angklung-paglak.mp3", is_active: true },
  { id: 3, title: "Alam yang Tenang", category: "alam", duration: "04:20", audio_url: "/audio/alam-yang-tenang.mp3", is_active: true },
];

// Zona geofencing — dipantau client-side (Haversine, lihat geofenceService.js)
// sesuai Batasan 4.1: aktif hanya saat PWA berada di foreground.
export const geofences = [
  {
    id: 1,
    name: "Taman Blambangan",
    latitude: -8.2175,
    longitude: 114.3675,
    radius_meter: 60,
    is_active: true,
    soundscape_id: 3,
    welcome_title: "Selamat datang di Taman Blambangan!",
    welcome_desc: "Nikmati suasana hijau dan musik relaksasi untuk membantu fokusmu.",
    koridor_id: 4,
    background_image: zoneBgBlambangan,
  },
  {
    id: 2,
    name: "Kawasan Pantai Boom",
    latitude: -8.2298,
    longitude: 114.3822,
    radius_meter: 80,
    is_active: true,
    soundscape_id: 3,
    welcome_title: "Selamat datang di Kawasan Pantai Boom!",
    welcome_desc: "Angin laut sejuk dan suara ombak menemani langkahmu di sini.",
    koridor_id: 6,
    // Belum ada ilustrasi khusus dari desainer untuk zona ini — overlay
    // jatuh ke gradasi hijau default (lihat GeofenceAlert.jsx).
    background_image: null,
  },
  {
    id: 3,
    name: "Alun-Alun Banyuwangi",
    latitude: -8.2145,
    longitude: 114.3691,
    radius_meter: 70,
    is_active: true,
    soundscape_id: 1,
    welcome_title: "Selamat datang di Alun-Alun Banyuwangi!",
    welcome_desc: "Dengarkan gending Using sambil bersantai di pusat kota.",
    koridor_id: null,
    background_image: null,
  },
];

// business_type dipakai juga sebagai label kategori ("Makanan"/"Minuman Tradisional").
// distance_m & rating khusus ditampilkan di kartu Rekomendasi UMKM Sekitar (Detail Koridor) —
// belum ada kolom setara di schema.sql, lihat catatan TODO di README.
export const umkms = [
  { id: 1, green_space_id: 1, koridor_id: 1, business_name: "Warung Bu Sari", business_type: "Makanan", address: "Sekitar Taman Sritanjung", distance_m: 120, rating: 4.8, image: umkmWarungBuSari, is_active: true },
  { id: 2, green_space_id: 1, koridor_id: 1, business_name: "Es Dawet Mbak Tini", business_type: "Minuman Tradisional", address: "Sekitar Taman Sritanjung", distance_m: 200, rating: 4.6, image: umkmEsDawet, is_active: true },
  { id: 3, green_space_id: 2, koridor_id: 4, business_name: "Rujak Soto Bu Ida", business_type: "Makanan", address: "Sekitar Taman Blambangan", distance_m: 150, rating: 4.7, image: umkmWarungBuSari, is_active: true },
  { id: 4, green_space_id: 1, koridor_id: 1, business_name: "Batik Gajah Oling Corner", business_type: "Kerajinan", address: "Koridor 1", distance_m: 90, rating: 4.5, image: umkmEsDawet, is_active: true },
];

export const bfestEvents = [
  { id: 1, green_space_id: 2, bfest_name: "Banyuwangi Ethno Carnival", location_type: "panggung", location_name: "Taman Blambangan", date: "2026-09-12" },
  { id: 2, green_space_id: 2, bfest_name: "Festival Gandrung Sewu", location_type: "panggung", location_name: "Pantai Boom", date: "2026-09-24" },
  { id: 3, green_space_id: 2, bfest_name: "Festival Kuwung", location_type: "panggung", location_name: "Taman Blambangan", date: "2026-10-03" },
];
