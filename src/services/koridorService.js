import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { USE_MOCK, delay, USE_LARAVEL_API, LARAVEL_API_BASE } from "./config";
import { db } from "./firebaseClient";
import { greenSpaces, koridors } from "../data/mockGreenSpaces";
import { getLatestReading } from "./sensorService";

/**
 * Green space & koridor. Sebelumnya lewat Firestore, tapi koleksi
 * `green_space`/`koridor` di project Firebase belum pernah diisi data
 * sungguhan — inilah kenapa gambar koridor tidak pernah muncul walau data
 * mock sudah lengkap. Dipindah ke Laravel (lihat KoridorController &
 * GreenSpaceController) supaya ada satu sumber data nyata yang pasti terisi
 * (lihat seeder-nya, datanya disamakan persis dengan mock lama, termasuk
 * gambar — filenya sama, cuma sekarang disajikan Laravel).
 * Urutan sumber tetap: Laravel -> Firestore -> mock.
 */
async function fetchLaravel(path) {
  const res = await fetch(`${LARAVEL_API_BASE}${path}`);
  if (!res.ok) throw new Error(`Laravel API ${path} merespons ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

/** Ambil daftar seluruh green space (Taman Sritanjung, Blambangan, dst). */
export async function getGreenSpaces() {
  if (USE_LARAVEL_API) {
    try {
      return await fetchLaravel("/green-spaces");
    } catch (err) {
      console.warn("Laravel API (green-spaces) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay();
    return greenSpaces;
  }
  const snap = await getDocs(query(collection(db, "green_space"), orderBy("name")));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

/** Ambil daftar koridor (pilot + rencana perluasan). */
export async function getKoridorList() {
  if (USE_LARAVEL_API) {
    try {
      return await fetchLaravel("/koridors");
    } catch (err) {
      console.warn("Laravel API (koridors) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay();
    return koridors;
  }
  const snap = await getDocs(collection(db, "koridor"));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

/** Ambil detail satu koridor beserta skor lingkungan terbaru. */
export async function getKoridorDetail(koridorId) {
  if (USE_LARAVEL_API) {
    try {
      return await fetchLaravel(`/koridors/${koridorId}`);
    } catch (err) {
      console.warn("Laravel API (koridors/:id) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay();
    const koridor = koridors.find((k) => k.id === Number(koridorId));
    if (!koridor) throw new Error("Koridor tidak ditemukan.");
    return koridor;
  }

  const snap = await getDoc(doc(db, "koridor", String(koridorId)));
  if (!snap.exists()) throw new Error("Koridor tidak ditemukan.");

  const sensor = await getLatestReading(koridorId);
  return { id: Number(snap.id), ...snap.data(), sensor };
}
