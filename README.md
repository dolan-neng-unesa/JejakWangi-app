# JEJAK WANGI App (Frontend)

Progressive Web App untuk warga/pejalan kaki — bagian dari proyek **JEJAKWANGI: Digital
Twin & Wellness Corridor** (SMK Negeri 1 Banyuwangi, tim Happy Fun Angkasa).

JEJAK WANGI mengubah koridor trotoar penghubung Taman Sritanjung–Taman Blambangan
menjadi "Restorative Green-Wellness Corridor": data lingkungan real-time dari
sensor IoT (ESP32) divisualisasikan lewat aplikasi ini, lengkap dengan navigasi
rute hijau, terapi audio (soundscape), pencatat suasana hati, dan notifikasi
berbasis lokasi (geofencing).

## Tech stack

- React 19 + Vite + React Router
- Tailwind CSS 4
- Laravel API (lihat `../jejak-wangi-backend`) — satu-satunya backend: auth (Sanctum),
  koridor/green space, UMKM, Festival (BWI-Fest), sensor, mood, geofencing,
  soundscape. Database-nya hanya ada di backend (`jejak_wangi_be_db`).
- Leaflet.js + React-Leaflet + OpenStreetMap — peta koridor & rute

## Menjalankan

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build produksi ke dist/
npm run lint      # oxlint
```

## Konfigurasi environment (`.env.local`)

Salin `.env.example` menjadi `.env.local`:

```env
# Alamat API Laravel (jejak-wangi-backend). Production: URL API publik, mis.
# https://api.jejakwangi.id/api — nilai ini tertanam saat `npm run build`.
# Kosongkan hanya untuk mengembangkan UI tanpa backend (data mock lokal).
VITE_LARAVEL_API_URL=http://localhost:8000/api
```

Setiap `services/*.js` memilih sumber data berjenjang, jadi halaman tidak pernah
blank walau backend belum aktif:

1. **Laravel API** (kalau `VITE_LARAVEL_API_URL` diisi dan servernya menyala).
2. **Data mock lokal** (`src/data/*.js`) — fallback bila Laravel tidak
   dikonfigurasi atau tidak terjangkau.

Login memakai email/kata sandi lewat Laravel Sanctum. Tanpa
`VITE_LARAVEL_API_URL`, login memakai sesi mock di `localStorage`.

## Struktur folder

```
src/
├── pages/        Satu file per halaman (Home, Koridor, Map, SmartGreenRoute,
│                 RouteDetail, Navigation, MoodTracker, MoodHistory,
│                 SoundscapeTherapy, Geofencing, BwiFest, Umkm, dst.)
├── components/   Komponen UI (global/, layout/, geofencing/)
├── services/     Satu file per domain data; menjembatani halaman ke
│                 Laravel API / mock (lihat urutan fallback di atas)
├── hooks/        useGeofence, useSensorReading
├── context/      GeofenceContext (state zona aktif lintas halaman)
└── data/         Data mock (dipakai selama backend belum tersedia)
```

## Uji coba: konsumsi sensor suhu & kualitas udara (BE Laravel)

Sesuai arahan mentor (7 Sep 2026), FE mengonsumsi dua endpoint sensor dari
`jejak-wangi-backend` lewat hook `src/hooks/useSensorReading.js`:

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

Untuk mencoba alur ini end-to-end, jalankan `jejak-wangi-backend` (`php artisan
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
  `jejak-wangi-backend/database/seeders/KoridorSeeder.php` (kolom `path`, format
  `[[lat, lng], ...]`) dan `src/data/mockGreenSpaces.js`, lalu
  `php artisan migrate --seed` di backend.
- **Sumber data**: Laravel → mock.
- Galat `ERR_CONNECTION_REFUSED` ke `localhost:8000` di konsol berarti server Laravel
  belum jalan (`php artisan serve` di `jejak-wangi-backend`). Itu log jaringan bawaan browser;
  app tetap jalan dengan data mock dan hanya memicunya sekali per muat halaman.

### API key tile peta

Leaflet tidak memerlukan API key; yang meminta key adalah penyedia tile. Kalau tile
menampilkan tulisan "API key required", isi di `.env.local` (lalu restart `npm run dev`):

```
VITE_MAPTILER_API_KEY=isi_key_dari_maptiler_cloud
```

Daftar gratis di maptiler.com → Account → API keys. Jangan commit key ke repo publik
(batasi domain key di dashboard MapTiler). Tanpa key, peta memakai OpenStreetMap standar.

## Alur Jejak Wangi (sesuai dokumen ALUR JEJAK WANGI & Alur Sistem)

| Langkah | Halaman | Catatan |
|---|---|---|
| Scan QR titik awal + "naik apa?" | `/scan`, `/q/:koridorId` | Kamera memakai `BarcodeDetector` (Chrome/Android); cadangan: kode manual. Isi QR: `https://…/q/3`, `jejakwangi:koridor:3`, atau `3`. |
| Beranda | `/home` | Kartu ISPU, Eco-Coach, menu. |
| Detail koridor | `/koridor/:id` | Oksigen, contoh emisi (motor/mobil/AC toko), kalkulator CO₂, sensor IoT, UMKM. |
| Smart Green Route | `/route` → `/route/detail/:id` | Cek ISPU dulu; titik hijau (rute), oranye (UMKM), biru (charger surya). |
| Rekam perjalanan | `/aktivitas` | GPS ala Strava + suara ambient; mode simulasi bila GPS tidak ada. |
| Scan QR titik akhir | `/scan/akhir/:id` | Verifikasi; boleh dilewati. |
| Hasil (emisi terhindar & rupiah) | `/aktivitas/selesai/:id` | Peta jejak, peringkat leaderboard, Eco-Coach. |
| Kupon bertingkat, leaderboard bulanan | `/misi`, `/kupon` | 3 kupon (1/3/5 km) diklaim manual, cooldown 30 hari per kupon. Leaderboard Top 100 jarak terjauh bulan ini; Top 1/3/5/10 mendapat badge di profil. Progres & leaderboard reset otomatis tiap awal bulan (WIB). |
| Zero-waste: bawa tempat sendiri | `/kasir` (kasir), `/scan/tempat-sendiri` (pelanggan) | Kasir menekan "Customer membawa tempat sendiri" → QR sekali pakai (5 menit). Pelanggan memindai → cooldown tiap kupon yang sedang cooldown berkurang 1 hari. Butuh login + server. |
| Mood (feedback akhir) | `/mood` | |
| Charger station surya | `/charger`, `/charger/:id`, `/charger/:id/isi`, `/info` | Progres pengisian masih **simulasi** (belum dibaca dari sensor stasiun). |

**Local-first:** semua data perjalanan disimpan di perangkat (`services/journeyStore.js`). Bila pengguna login dan
backend terjangkau, `services/journeySync.js` mengirim aktivitas ke `POST /activities`; **server menghitung ulang**
dampak & poin, memberi kupon resmi, lalu app menarik `/vouchers` dan `/me/summary` sebagai sumber kebenaran.

**Eco-Coach** (`lib/ecoCoach.js`) berbasis aturan (udara, suhu, jam, moda, progres misi) — bukan model bahasa.
Bentuk input/outputnya sengaja sederhana agar bisa diganti layanan AI nanti.

Asumsi hitung (ubah di `lib/journey.js` DAN `jejak-wangi-backend/config/jejakwangi.php`, harus sama):
BBM Rp10.000/L, 70 kkal/km, 30 poin/km, faktor emisi dari `carbonBalance.js`.
#   J e j a k W a n g i - a p p  
 