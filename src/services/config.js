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
