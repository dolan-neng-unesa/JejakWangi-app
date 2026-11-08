import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { USE_MOCK, delay, USE_LARAVEL_API, LARAVEL_API_BASE } from "./config";
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

async function fetchLaravel(path) {
  const res = await fetch(`${LARAVEL_API_BASE}${path}`);
  if (!res.ok) throw new Error(`Laravel API ${path} merespons ${res.status}`);
  const json = await res.json();
  return json.data ?? json; // Laravel API Resource collection membungkus dalam { data: [...] }
}

export async function getUmkmByKoridor(koridorId) {
  if (USE_LARAVEL_API) {
    try {
      return await fetchLaravel(`/umkm?koridor_id=${koridorId}`);
    } catch (err) {
      console.warn("Laravel API (umkm) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay();
    return umkms.filter((u) => u.koridor_id === Number(koridorId));
  }
  const snap = await getDocs(query(collection(db, "umkms"), where("koridor_id", "==", Number(koridorId))));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

export async function getBfestCalendar() {
  if (USE_LARAVEL_API) {
    try {
      return await fetchLaravel("/festivals?upcoming=1");
    } catch (err) {
      console.warn("Laravel API (festivals) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay();
    return bfestEvents;
  }
  const snap = await getDocs(query(collection(db, "bfest"), orderBy("date")));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}
