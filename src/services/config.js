// SVARGA — konfigurasi layanan.
//
// Seluruh data & autentikasi berasal dari backend Laravel (svarga-backend).
// Alamat API diisi lewat VITE_LARAVEL_API_URL (mis. https://api.svarga.id/api).
// Kalau kosong (mis. saat mengembangkan UI tanpa menjalankan backend), services/*
// memakai data mock lokal — lihat pola try/catch di contentService.js dll.

// Simulasi latensi jaringan supaya UI loading state (skeleton/spinner)
// bisa diuji senyata mungkin saat memakai data mock.
export const MOCK_DELAY_MS = 350;

export function delay(ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const LARAVEL_API_BASE = (import.meta.env.VITE_LARAVEL_API_URL ?? "").replace(/\/+$/, "");
export const USE_LARAVEL_API = Boolean(LARAVEL_API_BASE);
