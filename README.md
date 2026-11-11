# SVARGA App (Frontend)

Progressive Web App untuk warga/pejalan kaki — bagian dari proyek **SVARGA: Digital
Twin & Wellness Corridor** (SMK Negeri 1 Banyuwangi, tim Happy Fun Angkasa).

SVARGA mengubah koridor trotoar penghubung Taman Sritanjung–Taman Blambangan
menjadi "Restorative Green-Wellness Corridor": data lingkungan real-time dari
sensor IoT (ESP32) divisualisasikan lewat aplikasi ini, lengkap dengan navigasi
rute hijau, terapi audio (soundscape), pencatat suasana hati, dan notifikasi
berbasis lokasi (geofencing).

## Tech stack

- React 19 + Vite + React Router
- Tailwind CSS 4
- Firebase (Firestore) — data lingkungan, koridor, mood, geofencing
- Laravel API (lihat `../svarga-backend`) — khusus UMKM, Festival (BWI-Fest),
  dan uji coba sensor suhu/kualitas udara
- Leaflet.js + React-Leaflet + OpenStreetMap — peta koridor & rute

## Menjalankan

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build produksi ke dist/
npm run lint      # oxlint
```

## Konfigurasi environment (`.env.local`)

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Backend Laravel — UMKM, Festival, dan uji coba sensor. Kosongkan untuk
# memakai data mock/Firestore saja.
VITE_LARAVEL_API_URL=http://localhost:8000/api
```

Semua nilai di atas opsional secara individual: setiap `services/*.js` memilih
sumber data secara otomatis dan berjenjang, jadi halaman tidak pernah blank
walau salah satu backend belum aktif:

1. **Laravel API** (kalau `VITE_LARAVEL_API_URL` diisi dan servernya menyala) —
   dipakai untuk UMKM, Festival/BWI-Fest, sensor suhu/kualitas udara, Auth,
   Mood Tracker, Geofencing/Soundscape, **dan koridor/green space**.
2. **Firestore** (kalau kredensial Firebase diisi) — fallback kalau Laravel
   tidak dikonfigurasi/gagal. **Catatan:** koleksi `koridor`/`green_space`
   di project Firebase belum pernah diisi data sungguhan — kalau kredensial
   Firebase terisi tapi Laravel tidak jalan, gambar koridor tidak akan
   muncul karena koleksi ini kosong. Isi `VITE_LARAVEL_API_URL` dan jalankan
   `svarga-backend` untuk menghindari ini.
3. **Data mock lokal** (`src/data/*.js`) — fallback terakhir.

## Struktur folder

```
src/
├── pages/        Satu file per halaman (Home, Koridor, Map, SmartGreenRoute,
│                 RouteDetail, Navigation, MoodTracker, MoodHistory,
│                 SoundscapeTherapy, Geofencing, BwiFest, Umkm, dst.)
├── components/   Komponen UI (global/, layout/, geofencing/)
├── services/     Satu file per domain data; menjembatani halaman ke
│                 Laravel API / Firestore / mock (lihat urutan fallback di atas)
├── hooks/        useGeofence, useSensorReading
├── context/      GeofenceContext (state zona aktif lintas halaman)
├── data/         Data mock (dipakai selama backend belum tersedia)
└── db/schema.sql Skema relasional acuan (versi PostgreSQL dari ERD proposal)
```

## Uji coba: konsumsi sensor suhu & kualitas udara (BE Laravel)

Sesuai arahan mentor (7 Sep 2026), FE mengonsumsi dua endpoint sensor dari
`svarga-backend` lewat hook `src/hooks/useSensorReading.js`:

- `GET /api/sensors/live` — data "langsung" dari sensor, dianggap valid kalau
  umurnya **< 5 menit**.
- `GET /api/sensors/latest` — fallback: baris terakhir yang tersimpan di DB,
  berapa pun umurnya.

**Kondisi yang diterapkan di hook:** FE polling `/live` setiap 30 detik. Kalau
sudah **5 menit** berlalu sejak FE terakhir berhasil mendapat data segar dari
`/live` (mis. karena ESP32 mati atau jaringan putus), hook otomatis memanggil
`/latest` sebagai fallback dan menandai data itu sebagai "data lama"
(`isStale: true`) di UI — lihat kartu **Suhu** dan **Udara** di halaman Home.

```js
const temperature = useSensorReading("temperature", koridorId);
// temperature.data       → { value, unit, recorded_at, ... }
// temperature.source     → "live" | "db" | null (null = Laravel belum dikonfigurasi)
// temperature.isStale    → true kalau sumbernya fallback DB
```

Untuk mencoba alur ini end-to-end, jalankan `svarga-backend` (`php artisan
serve`) lalu lihat README-nya untuk cara mengirim data sensor simulasi.

## Catatan implementasi lain

- Mode tamu didukung penuh: seluruh fitur inti (dashboard lingkungan,
  Soundscape Therapy, Smart Green Route) bisa diakses tanpa login; login hanya
  diperlukan untuk menyimpan riwayat Mood Tracker lintas perangkat
  (`src/services/authService.js`, mode mock disimpan di `localStorage`).
- Geofencing memakai Geolocation API + rumus Haversine di sisi client
  (`src/hooks/useGeofence.js`), hanya aktif selama halaman PWA berada di
  foreground — lihat batasan yang sama di proposal proyek.

## Peta & jalur koridor

- **Tile peta**: semua halaman memakai `components/map/BaseTileLayer.jsx`. Urutan
  penyedia ada di `src/lib/mapTiles.js` (CARTO → OpenStreetMap; atau penyedia sendiri
  lewat `VITE_MAP_TILE_URL`). Kalau tile gagal dimuat, otomatis pindah ke penyedia
  berikutnya; ukuran peta juga disegarkan otomatis saat kontainer berubah.
- **Jalur mengikuti jalan**: titik-titik jalur (`path` di data koridor, atau titik
  singgah di `lib/demoRoute.js`) dicocokkan ke jalan nyata OSM oleh `lib/roadSnap.js`
  (layanan routing pejalan kaki `routing.openstreetmap.de`, atau `VITE_ROUTING_URL`
  sendiri). Hasilnya di-cache di `localStorage`; kalau layanan tidak terjangkau, garis
  jatuh ke titik apa adanya dan ditandai "jalur perkiraan".
- **Menggambar jalur koridor**: buka `/map?edit=1`, pilih koridor, lalu ketuk peta di
  sepanjang jalannya (awal → akhir). Tekan **Salin JSON** dan tempel ke
  `svarga-backend/database/seeders/KoridorSeeder.php` (kolom `path`, format
  `[[lat, lng], ...]`) dan `src/data/mockGreenSpaces.js`, lalu
  `php artisan migrate --seed` di backend.
- **Sumber data**: Laravel → mock. Fallback Firestore untuk koridor/UMKM/festival/
  geofence/soundscape **dimatikan secara default** (koleksinya kosong dan rules bisa
  menolak baca, yang memunculkan galat SDK tak tertangkap di konsol). Aktifkan dengan
  `VITE_USE_FIRESTORE_FALLBACK=true` hanya bila koleksinya sudah terisi.
- Galat `ERR_CONNECTION_REFUSED` ke `localhost:8000` di konsol berarti server Laravel
  belum jalan (`php artisan serve` di `svarga-backend`). Itu log jaringan bawaan browser;
  app tetap jalan dengan data mock dan hanya memicunya sekali per muat halaman.

### API key tile peta

Leaflet tidak memerlukan API key; yang meminta key adalah penyedia tile. Kalau tile
menampilkan tulisan "API key required", isi di `.env.local` (lalu restart `npm run dev`):

```
VITE_MAPTILER_API_KEY=isi_key_dari_maptiler_cloud
```

Daftar gratis di maptiler.com → Account → API keys. Jangan commit key ke repo publik
(batasi domain key di dashboard MapTiler). Tanpa key, peta memakai OpenStreetMap standar.
