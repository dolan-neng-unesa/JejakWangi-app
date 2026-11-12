import { delay } from "./config";
import { fetchLaravel, isLaravelAvailable } from "./laravelClient";
import { umkms, bfestEvents } from "../data/mockContent";

/**
 * UMKM & Festival — data dari backend Laravel (lihat svarga-backend/).
 * Urutan sumber data:
 *   1. Laravel API (kalau VITE_LARAVEL_API_URL diisi dan server terjangkau)
 *   2. Data mock lokal (fallback bila Laravel tidak dikonfigurasi / gagal)
 * Fallback otomatis supaya halaman tidak blank/error kalau backend sedang tidak aktif.
 */

/** Seluruh UMKM aktif (dipakai peta untuk menampilkan marker; field latitude/longitude bisa null). */
export async function getUmkmList() {
  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel("/umkm?per_page=100");
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  await delay();
  return umkms.filter((u) => u.is_active);
}

export async function getUmkmByKoridor(koridorId) {
  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel(`/umkm?koridor_id=${encodeURIComponent(koridorId)}&per_page=100`);
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  await delay();
  return umkms.filter((u) => u.koridor_id === Number(koridorId));
}

export async function getBfestCalendar() {
  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel("/festivals?upcoming=1");
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  await delay();
  return bfestEvents;
}

/**
 * Ambil event festival untuk satu bulan kalender (bukan cuma yang akan
 * datang — event yang sudah lewat di bulan itu tetap perlu ditampilkan
 * sebagai titik penanda di grid kalender), dengan filter kategori opsional.
 * Dipakai halaman Kalender BWI Fest (BwiFestPage.jsx).
 */
export async function getFestivalsByMonth(yearMonth, category) {
  const params = new URLSearchParams({ month: yearMonth, per_page: "100" });
  if (category) params.set("category", category);

  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel(`/festivals?${params.toString()}`);
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  await delay();
  return bfestEvents.filter((e) => e.date.startsWith(yearMonth) && (!category || e.category === category));
}
