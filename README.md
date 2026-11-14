# JEJAK WANGI — Panduan Instalasi Lokal

Proyek terdiri dari **tiga bagian** yang dijalankan bersamaan di komputer lokal:

| Bagian | Folder | Teknologi | Alamat lokal |
|---|---|---|---|
| Backend (API) | `backend/` | Laravel 13 (PHP ≥ 8.3) + SQLite + Sanctum | http://localhost:8000 |
| Frontend user (PWA warga) | `frontend-user/` | React 19 + Vite + Tailwind 4 | http://localhost:5173 |
| Dashboard admin | `dashboard-admin/` | React 19 + Vite + Tailwind 4 | http://localhost:5174 |

Opsional: perangkat **ESP32 + DHT11 + OLED** yang mengirim suhu & kelembapan ke backend (lihat bagian 5).

> Urutan wajib: **backend dulu**, baru kedua frontend. Kedua frontend hanya mengambil data dari API backend.

---

## 1. Prasyarat

Pasang dulu di komputer:

- **PHP 8.3 atau lebih baru**, dengan ekstensi: `sqlite3`, `pdo_sqlite`, `mbstring`, `openssl`, `curl`, `fileinfo`, `tokenizer`, `xml`, `ctype`, `bcmath`
- **Composer** 2.x — https://getcomposer.org
- **Node.js 20+** dan **npm** — https://nodejs.org
- **Git** (opsional)

Cek versi:

```bash
php -v
composer -V
node -v
npm -v
php -m | grep -i sqlite     # Windows PowerShell: php -m | findstr /i sqlite
```

> **Windows (Laragon/XAMPP):** pastikan `extension=pdo_sqlite` dan `extension=sqlite3` tidak diberi tanda `;` di `php.ini`.

---

## 2. Backend (Laravel)

```bash
cd backend
```

> Jika hasil ekstrak ZIP membuat folder bertingkat (mis. `backend/New folder`), masuklah ke folder yang berisi file `artisan` dan `composer.json`.

### 2.1 Pasang dependensi

```bash
composer install
```

### 2.2 Siapkan `.env`

```bash
cp .env.example .env            # Windows CMD: copy .env.example .env
php artisan key:generate
```

Pengaturan penting di `.env` (nilai bawaan sudah cocok untuk lokal):

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Domain frontend yang boleh memanggil API (pisahkan dengan koma)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

DB_CONNECTION=sqlite

# Akun admin untuk login dashboard (opsional; bawaan lokal: admin@jejakwangi.id / jejakwangi123)
# ADMIN_SEED_EMAIL=admin@jejakwangi.id
# ADMIN_SEED_PASSWORD=jejakwangi123

# Sumber ISPU/suhu cadangan dari Open-Meteo (gratis, tanpa API key)
#   off       = hanya sensor ESP32
#   auto      = ESP32 diutamakan, Open-Meteo hanya cadangan (disarankan)
#   openmeteo = selalu Open-Meteo, KECUALI jenis data yang sedang dikirim ESP32 aktif
OPENMETEO_MODE=auto
# true  = Open-Meteo boleh melengkapi data yang tidak diukur ESP32 (mis. PM2.5/PM10 untuk ISPU)
# false = Open-Meteo tidak dipakai sama sekali selama ESP32 aktif
OPENMETEO_LENGKAPI_SAAT_ESP=true

# Eco-Coach (AI) — kosongkan LLM_PROVIDER bila tidak dipakai, sistem memakai template cadangan
LLM_PROVIDER=
```

> Login Google/Facebook bersifat opsional. Kosongkan `GOOGLE_CLIENT_ID` / `FACEBOOK_APP_ID` jika tidak dipakai — tombolnya otomatis hilang di frontend.

### 2.3 Siapkan database SQLite, migrasi, dan seeder

```bash
# buat file database kosong
touch database/database.sqlite        # Windows PowerShell: New-Item database/database.sqlite -ItemType File

php artisan migrate
php artisan db:seed
```

`db:seed` mengisi data awal: koridor, UMKM, festival, geofence, perangkat/bacaan sensor contoh, akun admin, dan **data demo satu siklus penuh** (`DemoCycleSeeder`) sehingga semua halaman langsung terisi walau belum ada sensor sungguhan.

> Jika muncul galat *database not found*, isi `DB_DATABASE` di `.env` dengan **path absolut** ke file tersebut, mis. `DB_DATABASE=C:/proyek/backend/database/database.sqlite`.

### 2.4 Jalankan server

```bash
php artisan serve
```

Backend aktif di **http://localhost:8000**. Cek cepat: buka http://localhost:8000/api/koridors di browser — harus muncul JSON.

### 2.5 (Opsional) Scheduler & uji satu siklus

Beberapa proses berjalan terjadwal (database per jam, monitor sensor offline). Untuk lokal, jalankan di terminal terpisah:

```bash
php artisan schedule:work
```

Perintah berguna:

```bash
php artisan engine:hourly                 # tarik Open-Meteo + hitung database per jam (jam lalu)
php artisan engine:hourly --dari=2026-11-10 --sampai=2026-11-14 --tanpa-api   # hitung ulang rentang
php artisan jejakwangi:cycle-check        # cek satu siklus penuh (input → hitung → tampil)
php artisan jejakwangi:cycle-check --seed # isi ulang data seder 48 jam lalu cek
php artisan jejakwangi:monitor            # cek sensor offline & AQI tinggi
php artisan devices:register ESP32-KOR1 --koridor=1   # daftarkan perangkat (alternatif lewat Admin)
```

### 2.6 Jalankan tes backend

```bash
php artisan test
# atau hanya satu berkas:
php artisan test --filter=OpenMeteoAirTest
```

---

## 3. Dashboard Admin

Buka terminal **baru**:

```bash
cd dashboard-admin       # masuk ke folder yang berisi package.json
cp .env.example .env     # isi: VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

Buka **http://localhost:5174**, lalu login:

- Email: `admin@jejakwangi.id`
- Kata sandi: `jejakwangi123` (atau nilai `ADMIN_SEED_PASSWORD` jika Anda mengaturnya)

Hanya akun dengan `is_admin = true` yang bisa masuk.

**Tanpa backend (hanya lihat tampilan):**

```bash
npm run mock      # terminal 1 — mock API
npm run dev       # terminal 2
```

> Folder `dashboard-admin` pada ZIP juga membawa salinan sebagian kode Laravel (`app/`, `routes/`, dll). **Abaikan** — backend yang dipakai adalah folder `backend/`.

Tes: `npm test`

---

## 4. Frontend User (PWA warga)

Buka terminal **baru**:

```bash
cd frontend-user         # masuk ke folder yang berisi package.json
cp .env.example .env.local
```

Isi `.env.local`:

```env
# Wajib agar memakai data dari backend (kosong = data mock lokal)
VITE_LARAVEL_API_URL=http://localhost:8000/api

# Opsional — peta, routing, dan Firebase; biarkan kosong jika tidak punya
# VITE_MAPTILER_API_KEY=
# VITE_ROUTING_URL=
```

Jalankan:

```bash
npm install
npm run dev
```

Buka **http://localhost:5173**.

Perintah lain: `npm run build` (build produksi ke `dist/`), `npm run lint`, `npm test`.

> Mengakses dari HP di jaringan yang sama: Vite sudah memakai `host: true`. Buka `http://IP-LAPTOP:5173`, ganti `VITE_LARAVEL_API_URL` menjadi `http://IP-LAPTOP:8000/api`, dan jalankan backend dengan `php artisan serve --host=0.0.0.0`.

---

## 5. Menghubungkan ESP32 (opsional)

1. Login Admin → **Sensor IoT → Tambah Sensor**. Pilih **koridor** tempat perangkat dipasang. Salin **kunci perangkat** (`svg_...`) — hanya tampil **sekali**.
2. Buka sketch Arduino, isi bagian konfigurasi:

   ```cpp
   const char* WIFI_SSID  = "NAMA_WIFI";
   const char* WIFI_PASS  = "PASSWORD_WIFI";
   const char* SERVER_URL = "http://192.168.1.10:8000";   // IP laptop, BUKAN localhost
   const char* DEVICE_KEY = "svg_...";                    // kunci dari langkah 1
   ```

3. Cari IP laptop: `ipconfig` (Windows) atau `ip a` / `ifconfig` (Linux/Mac). Laptop dan ESP32 harus di **WiFi yang sama**.
4. Jalankan backend agar bisa diakses dari jaringan:

   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

   Izinkan port 8000 di firewall Windows jika ESP32 gagal terhubung.
5. Pasang library lewat Library Manager: **Adafruit GFX**, **Adafruit SSD1306**, **DHT sensor library**, **Adafruit Unified Sensor**. Upload ke board **ESP32 Dev Module**.
6. Wiring: OLED `SDA→GPIO21`, `SCL→GPIO22` · DHT11 `DATA→GPIO4`.

Indikator di OLED pojok kanan bawah: `W` = WiFi tersambung, `S:OK` = server menerima data, `S:ERR` = gagal.

**Perilaku sumber data:** selama ESP32 mengirim data (bacaan < 5 menit), suhu & kelembapan **selalu dari ESP32**, bukan Open-Meteo. Open-Meteo hanya dipakai bila tidak ada ESP32 aktif.

Kode HTTP di Serial Monitor (115200 baud):

| Kode | Arti |
|---|---|
| `201` | Berhasil |
| `401` | Kunci salah / perangkat dinonaktifkan |
| `422` | Format data tidak valid |
| `429` | Terlalu sering mengirim (maks 20×/menit) — perbesar `KIRIM_MS` |
| `-1` | Tidak bisa terhubung — periksa IP, WiFi, firewall |

---

## 6. Ringkasan: menjalankan semuanya

Tiga terminal (plus satu opsional):

```bash
# Terminal 1 — backend
cd backend && php artisan serve

# Terminal 2 — dashboard admin
cd dashboard-admin && npm run dev      # http://localhost:5174

# Terminal 3 — frontend user
cd frontend-user && npm run dev        # http://localhost:5173

# Terminal 4 (opsional) — scheduler
cd backend && php artisan schedule:work
```

## 7. Pemecahan masalah

| Masalah | Solusi |
|---|---|
| `could not find driver` | Aktifkan `pdo_sqlite` & `sqlite3` di `php.ini`, lalu `php -m` untuk memastikan |
| `Database file ... does not exist` | Buat `database/database.sqlite`, atau isi `DB_DATABASE` dengan path absolut |
| `No application encryption key` | Jalankan `php artisan key:generate` |
| Frontend: *CORS error* / *Network Error* | Pastikan backend jalan & `CORS_ALLOWED_ORIGINS` memuat port frontend, lalu `php artisan config:clear` |
| Frontend user tampil data mock | `VITE_LARAVEL_API_URL` kosong — isi, lalu **restart** `npm run dev` |
| Login admin ditolak | Jalankan `php artisan db:seed`; pastikan akun `is_admin = true` |
| Data kosong di dashboard | Jalankan `php artisan db:seed` atau `php artisan jejakwangi:cycle-check --seed` |
| Data cuaca/ISPU tidak muncul | Butuh internet untuk Open-Meteo; atau set `OPENMETEO_MODE=off` |
| Setelah ubah `.env` tidak berpengaruh | `php artisan config:clear` (backend) atau restart `npm run dev` (frontend) |
| Reset total database | `php artisan migrate:fresh --seed` (**menghapus semua data**) |