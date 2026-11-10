import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { USE_MOCK, USE_FIRESTORE_FALLBACK, delay } from "./config";
import { fetchLaravel, isLaravelAvailable } from "./laravelClient";
import { withTimeout } from "./withTimeout";
import { db } from "./firebaseClient";
import { umkms, bfestEvents } from "../data/mockContent";

/**
 * UMKM & Festival — sesuai arahan mentor, backend untuk dua fitur ini
 * pakai Laravel (lihat svarga-backend/), bukan Firestore. Urutan sumber data:
 *   1. Laravel API (kalau VITE_LARAVEL_API_URL diisi)
 *   2. Firestore (kalau kredensial Firebase ada tapi Laravel tidak/gagal)
 *   3. Data mock lokal (fallback terakhir)
 * Fallback otomatis (bukan cuma saat kosong, tapi juga saat request Laravel
 * gagal — mis. server belum dijalankan) supaya halaman tidak blank/error
 * kalau backend Laravel sedang tidak aktif.
 */

// Firestore bisa menolak baca (rules) atau gagal jaringan — jatuhkan ke mock
// alih-alih membiarkan promise ditolak (galat tak tertangkap di konsol).
async function safeFirestore(read, fallback) {
  if (!USE_FIRESTORE_FALLBACK) {
    await delay();
    return fallback();
  }
  try {
    return await withTimeout(read());
  } catch {
    await delay();
    return fallback();
  }
}

/** Seluruh UMKM aktif (dipakai peta untuk menampilkan marker; field latitude/longitude bisa null). */
export async function getUmkmList() {
  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel("/umkm?per_page=100");
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  if (USE_MOCK) {
    await delay();
    return umkms.filter((u) => u.is_active);
  }
  return safeFirestore(async () => {
    const snap = await getDocs(collection(db, "umkms"));
    return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
  }, () => umkms.filter((u) => u.is_active));
}

export async function getUmkmByKoridor(koridorId) {
  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel(`/umkm?koridor_id=${koridorId}`);
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  if (USE_MOCK) {
    await delay();
    return umkms.filter((u) => u.koridor_id === Number(koridorId));
  }
  return safeFirestore(async () => {
    const snap = await getDocs(query(collection(db, "umkms"), where("koridor_id", "==", Number(koridorId))));
    return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
  }, () => umkms.filter((u) => u.koridor_id === Number(koridorId)));
}

export async function getBfestCalendar() {
  if (isLaravelAvailable()) {
    try {
      return await fetchLaravel("/festivals?upcoming=1");
    } catch {
      // laravelClient sudah mencatat sekali; lanjut ke fallback.
    }
  }

  if (USE_MOCK) {
    await delay();
    return bfestEvents;
  }
  return safeFirestore(async () => {
    const snap = await getDocs(query(collection(db, "bfest"), orderBy("date")));
    return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
  }, () => bfestEvents);
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

  if (USE_MOCK) {
    await delay();
    return bfestEvents.filter((e) => e.date.startsWith(yearMonth) && (!category || e.category === category));
  }

  const inMonth = (e) => e.date?.startsWith(yearMonth) && (!category || e.category === category);
  return safeFirestore(
    async () => {
      const snap = await getDocs(query(collection(db, "bfest"), orderBy("date")));
      return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() })).filter(inMonth);
    },
    () => bfestEvents.filter(inMonth)
  );
}
