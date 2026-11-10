import { hasFirebaseCredentials } from "./firebaseClient";

// Selama Pekan 1 (setup awal), belum ada kredensial Firebase/DB asli —
// seluruh services/* memakai data mock secara otomatis.
// Begitu .env.local diisi kredensial asli, USE_MOCK otomatis bernilai false
// tanpa perlu mengubah kode pemanggil (halaman tetap memanggil fungsi yang sama).
export const USE_MOCK = !hasFirebaseCredentials;

// Simulasi latensi jaringan supaya UI loading state (skeleton/spinner)
// bisa diuji senyata mungkin sejak awal.
export const MOCK_DELAY_MS = 350;

export function delay(ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Backend Laravel (UMKM & Festival) ---
// Sesuai arahan mentor: FE tetap React, BE untuk dua fitur ini pakai
// Laravel (lihat svarga-backend/). Aktif otomatis begitu VITE_LARAVEL_API_URL
// diisi; kalau kosong ATAU request ke Laravel gagal (belum dijalankan,
// salah alamat, dll), contentService.js otomatis jatuh balik ke
// Firestore/mock — lihat LARAVEL_API_BASE dan pola try/catch di contentService.js.
export const LARAVEL_API_BASE = import.meta.env.VITE_LARAVEL_API_URL ?? "";
export const USE_LARAVEL_API = Boolean(LARAVEL_API_BASE);

// Fallback Firestore untuk data yang sekarang disajikan Laravel (koridor, green
// space, UMKM, festival, geofence, soundscape). DEFAULT MATI: koleksi-koleksi itu
// tidak diisi di Firebase, dan kalau rules menolak baca, SDK Firestore melempar
// "Missing or insufficient permissions" lewat promise internalnya sendiri —
// galat yang tidak bisa ditangkap try/catch dan muncul di konsol. Urutan sumber
// data jadi: Laravel -> mock. Set VITE_USE_FIRESTORE_FALLBACK=true di .env.local
// hanya jika koleksinya memang sudah diisi & rules-nya sudah dideploy.
export const USE_FIRESTORE_FALLBACK = import.meta.env.VITE_USE_FIRESTORE_FALLBACK === "true";
