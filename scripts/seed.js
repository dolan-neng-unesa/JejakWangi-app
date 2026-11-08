// SVARGA — Script seed data awal ke Firestore
//
// Menulis data contoh (mock) yang selama ini dipakai di src/data/*.js ke
// Firestore project asli, supaya begitu USE_MOCK mati, halaman tidak kosong.
//
// PENTING: script ini HARUS disamakan setiap kali struktur data mock di
// src/data/*.js berubah — kalau tidak, Firestore akan berisi data versi
// lama (medan yang hilang, dsb) walau tampilan mock di layar sudah benar.
// (Versi sebelumnya sempat ketinggalan setelah Pekan 3 & 6 menambah field
// baru — itu sebabnya jika Anda sudah pernah seed sebelum pembaruan ini,
// jalankan ulang skrip ini supaya field seperti welcome_title/welcome_desc
// pada geofences ikut terisi.)
//
// Cara pakai:
//   1. Pastikan .env.local sudah terisi kredensial Firebase.
//   2. Pastikan Firestore Rules masih "test mode" (izinkan write) —
//      atau jalankan seed ini SEBELUM menerapkan firestore.rules yang ketat.
//   3. Jalankan:  node scripts/seed.js
//
// Script ini memakai Firebase Client SDK (bukan Admin SDK) supaya tidak
// perlu service account key — cukup kredensial web yang sama dengan aplikasi.
//
// CATATAN: field gambar (thumbnail, hero_image, background_image, image)
// TIDAK ikut di-seed di sini karena ini file asset lokal (import Vite),
// bukan URL. Untuk Firestore asli, upload gambar ke Firebase Storage lalu
// isi field-field itu dengan URL hasil upload secara manual atau lewat
// Dashboard Admin nantinya.

import { config } from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// PENTING: dotenv secara default hanya membaca file bernama ".env".
// Project ini memakai ".env.local" (konvensi Vite), jadi path-nya
// harus disebutkan eksplisit di sini.
config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("✗ .env.local belum terisi kredensial Firebase. Lihat README bagian 'Menyambungkan backend asli'.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedCollection(name, rows, idKey = "id") {
  for (const row of rows) {
    const { [idKey]: id, ...rest } = row;
    await setDoc(doc(db, name, String(id)), rest);
  }
  console.log(`✓ ${name}: ${rows.length} dokumen ditulis`);
}

async function main() {
  const greenSpaces = [
    {
      id: 1,
      name: "Taman Sritanjung",
      location_type: "taman",
      description: "Pusat aktivitas sosial aktif di jantung Kabupaten Banyuwangi.",
      latitude: -8.21944,
      longitude: 114.36972,
      address: "Jl. Jaksa Agung Suprapto, Banyuwangi",
      shade_score: 62,
      is_active: true,
    },
    {
      id: 2,
      name: "Taman Blambangan",
      location_type: "taman",
      description: "Kawasan olahraga dan panggung festival pariwisata daerah.",
      latitude: -8.2175,
      longitude: 114.3675,
      address: "Jl. Ahmad Yani, Banyuwangi",
      shade_score: 58,
      is_active: true,
    },
  ];

  // 6 koridor — disamakan dengan src/data/mockGreenSpaces.js (Pekan 3).
  // Field thumbnail/hero_image sengaja tidak ikut (lihat catatan di atas).
  const koridors = [
    {
      id: 1,
      short_name: "RTH Sritanjung",
      formal_name: "Koridor 1: Sritanjung",
      route_label: "Taman Sritanjung - Kampung Melayu",
      desc: "Taman Sritanjung asri dan kuliner",
      hijau_level: "paling_hijau",
      hijau_score: 5,
      umkm_count: 5,
      status: "pilot",
      distance_meter: 400,
      estimate_minutes: 6,
      shade_score: 82,
      condition_title: "Kondisi Koridor Terpilih",
      condition_desc:
        "Koridor ini memiliki cakupan pohon yang rimbun dan kualitas udara paling bersih di pusat kota. Dilengkapi infrastruktur pedestrian teduh.",
    },
    {
      id: 2,
      short_name: "Corridor 1 Kalilo",
      formal_name: "Koridor 2: Kalilo",
      route_label: "Kalilo - Jembatan Merah",
      desc: "Kawasan sungai dan spot foto",
      hijau_level: "agak_hijau",
      hijau_score: 4,
      umkm_count: 8,
      status: "rencana",
      distance_meter: 620,
      estimate_minutes: 9,
      shade_score: 64,
      condition_title: "Kondisi Koridor Terpilih",
      condition_desc:
        "Koridor menyusuri tepi sungai dengan pepohonan sedang. Ramai dikunjungi sore hari untuk berfoto dan bersantai.",
    },
    {
      id: 3,
      short_name: "Corridor 2 Perliman",
      formal_name: "Koridor 3: Perliman",
      route_label: "Simpang Lima - Terminal",
      desc: "Kawasan padat lalu lintas perkotaan",
      hijau_level: "setengah_hijau",
      hijau_score: 3,
      umkm_count: 3,
      status: "rencana",
      distance_meter: 510,
      estimate_minutes: 8,
      shade_score: 41,
      condition_title: "Kondisi Koridor Terpilih",
      condition_desc:
        "Koridor padat lalu lintas dengan pohon peneduh terbatas. Disarankan berjalan pada jam bukan puncak.",
    },
    {
      id: 4,
      short_name: "Koridor 3 Blambangan",
      formal_name: "Koridor 4: Blambangan",
      route_label: "Taman Blambangan - GOR",
      desc: "Kawasan hijau dan pusat kuliner",
      hijau_level: "paling_hijau",
      hijau_score: 5,
      umkm_count: 6,
      status: "rencana",
      distance_meter: 350,
      estimate_minutes: 5,
      shade_score: 79,
      condition_title: "Kondisi Koridor Terpilih",
      condition_desc:
        "Kawasan taman kota dengan kanopi pohon luas dan banyak pilihan kuliner di sekelilingnya.",
    },
    {
      id: 5,
      short_name: "Corridor 4 Pecinan",
      formal_name: "Koridor 5: Pecinan",
      route_label: "Klenteng - Pasar Lama",
      desc: "Kawasan padat industri dan permukiman",
      hijau_level: "tidak_hijau",
      hijau_score: 1,
      umkm_count: 4,
      status: "rencana",
      distance_meter: 480,
      estimate_minutes: 7,
      shade_score: 22,
      condition_title: "Kondisi Koridor Terpilih",
      condition_desc:
        "Kawasan padat bangunan dengan sedikit vegetasi. Kualitas udara perlu dipantau lebih ketat pada jam sibuk.",
    },
    {
      id: 6,
      short_name: "Corridor 5 Marina Boom",
      formal_name: "Koridor 6: Marina Boom",
      route_label: "Pelabuhan - Pantai Boom",
      desc: "Kawasan padat industri dan permukiman",
      hijau_level: "agak_hijau",
      hijau_score: 4,
      umkm_count: 4,
      status: "rencana",
      distance_meter: 610,
      estimate_minutes: 9,
      shade_score: 60,
      condition_title: "Kondisi Koridor Terpilih",
      condition_desc:
        "Koridor pesisir dengan angin laut sejuk. Vegetasi peneduh sedang, cocok untuk jalan sore.",
    },
  ];

  const sensorDevices = [
    { id: 1, green_space_id: 1, device_code: "ESP32-SRT-01", device_type: "esp32_node", is_active: true },
    { id: 2, green_space_id: 2, device_code: "ESP32-BLB-01", device_type: "esp32_node", is_active: true },
    { id: 3, green_space_id: 1, device_code: "ESP32-KOR1-DIORAMA", device_type: "esp32_node", is_active: true },
  ];

  // sensor_latest — doc id = koridorId (lihat sensorService.getLatestReading).
  // Disamakan dengan field `sensor` yang ada di tiap koridor mock (Pekan 3).
  const sensorLatest = [
    { id: 1, pm25: 12, pm25_status: "Sehat", suhu: 26.4, suhu_status: "Sejuk", kelembaban: 65, kelembaban_status: "Nyaman", kebisingan: 52, kebisingan_status: "Tenang", uv_index: 2.1, uv_status: "Rendah", sensor_status: "online", recorded_at: new Date().toISOString() },
    { id: 2, pm25: 24, pm25_status: "Sedang", suhu: 28.1, suhu_status: "Hangat", kelembaban: 58, kelembaban_status: "Nyaman", kebisingan: 61, kebisingan_status: "Ramai", uv_index: 4.3, uv_status: "Sedang", sensor_status: "online", recorded_at: new Date().toISOString() },
    { id: 3, pm25: 38, pm25_status: "Sedang", suhu: 30.2, suhu_status: "Panas", kelembaban: 52, kelembaban_status: "Kering", kebisingan: 74, kebisingan_status: "Bising", uv_index: 6.8, uv_status: "Tinggi", sensor_status: "online", recorded_at: new Date().toISOString() },
    { id: 4, pm25: 15, pm25_status: "Sehat", suhu: 27.0, suhu_status: "Sejuk", kelembaban: 63, kelembaban_status: "Nyaman", kebisingan: 55, kebisingan_status: "Tenang", uv_index: 2.8, uv_status: "Rendah", sensor_status: "online", recorded_at: new Date().toISOString() },
    { id: 5, pm25: 52, pm25_status: "Tidak Sehat", suhu: 31.5, suhu_status: "Panas", kelembaban: 48, kelembaban_status: "Kering", kebisingan: 79, kebisingan_status: "Bising", uv_index: 7.5, uv_status: "Tinggi", sensor_status: "online", recorded_at: new Date().toISOString() },
    { id: 6, pm25: 20, pm25_status: "Sehat", suhu: 28.6, suhu_status: "Hangat", kelembaban: 70, kelembaban_status: "Lembab", kebisingan: 58, kebisingan_status: "Tenang", uv_index: 5.1, uv_status: "Sedang", sensor_status: "online", recorded_at: new Date().toISOString() },
  ];

  // Disamakan dengan src/data/mockContent.js (Pekan 6) — tambah field `duration`.
  const soundscapes = [
    { id: 1, title: "Gending Using Sore Hari", category: "gamelan_using", duration: "05:10", audio_url: "/audio/gending-using-sore.mp3", is_active: true },
    { id: 2, title: "Angklung Paglak", category: "gamelan_using", duration: "03:45", audio_url: "/audio/angklung-paglak.mp3", is_active: true },
    { id: 3, title: "Alam yang Tenang", category: "alam", duration: "04:20", audio_url: "/audio/alam-yang-tenang.mp3", is_active: true },
  ];

  // Disamakan dengan src/data/mockContent.js (Pekan 6) — tambah welcome_title,
  // welcome_desc, koridor_id (dipakai GeofenceAlert.jsx & tombol "Lihat
  // Informasi Lokasi"). Field ini SEBELUMNYA TIDAK ADA di versi seed lama —
  // itulah kenapa judul & subjudul notifikasi kosong kalau baru seed versi lama.
  const geofences = [
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
    },
  ];

  // Disamakan dengan src/data/mockContent.js (Pekan 3) — tambah distance_m & rating.
  const umkms = [
    { id: 1, green_space_id: 1, koridor_id: 1, business_name: "Warung Bu Sari", business_type: "Makanan", address: "Sekitar Taman Sritanjung", distance_m: 120, rating: 4.8, is_active: true },
    { id: 2, green_space_id: 1, koridor_id: 1, business_name: "Es Dawet Mbak Tini", business_type: "Minuman Tradisional", address: "Sekitar Taman Sritanjung", distance_m: 200, rating: 4.6, is_active: true },
    { id: 3, green_space_id: 2, koridor_id: 4, business_name: "Rujak Soto Bu Ida", business_type: "Makanan", address: "Sekitar Taman Blambangan", distance_m: 150, rating: 4.7, is_active: true },
    { id: 4, green_space_id: 1, koridor_id: 1, business_name: "Batik Gajah Oling Corner", business_type: "Kerajinan", address: "Koridor 1", distance_m: 90, rating: 4.5, is_active: true },
  ];

  const bfest = [
    { id: 1, green_space_id: 2, bfest_name: "Banyuwangi Ethno Carnival", location_type: "panggung", date: "2026-09-12" },
    { id: 2, green_space_id: 2, bfest_name: "Festival Kuwung", location_type: "panggung", date: "2026-10-03" },
  ];

  console.log(`Menulis data awal ke project Firestore: ${firebaseConfig.projectId}\n`);

  await seedCollection("green_space", greenSpaces);
  await seedCollection("koridor", koridors);
  await seedCollection("sensor_devices", sensorDevices);
  await seedCollection("sensor_latest", sensorLatest);
  await seedCollection("soundscapes", soundscapes);
  await seedCollection("geofences", geofences);
  await seedCollection("umkms", umkms);
  await seedCollection("bfest", bfest);

  console.log("\n✓ Seed selesai. mood_logs sengaja tidak diseed (diisi organik lewat Mood Tracker).");
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Seed gagal:", err.message);
  process.exit(1);
});
