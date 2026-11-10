import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { USE_MOCK, USE_FIRESTORE_FALLBACK, delay } from "./config";
import { fetchLaravel, isLaravelAvailable } from "./laravelClient";
import { db } from "./firebaseClient";
import { greenSpaces, koridors } from "../data/mockGreenSpaces";
import { getLatestReading } from "./sensorService";
import { withTimeout } from "./withTimeout";

/**
 * Green space & koridor. Urutan sumber: Laravel -> (Firestore, opsional) -> mock.
 *
 * Koleksi Firestore `green_space`/`koridor` belum pernah diisi, dan rules
 * project Firebase bisa saja menolak baca ("Missing or insufficient
 * permissions"). Karena itu Firestore dijaga try/catch dan dianggap gagal
 * kalau kosong — halaman selalu mendapat data (mock) alih-alih promise
 * yang ditolak dan galat di konsol.
 */

async function fromLaravel(path) {
  if (!isLaravelAvailable()) return null;
  try {
    return await fetchLaravel(path);
  } catch {
    return null; // laravelClient sudah mencatat sekali; lanjut ke fallback
  }
}

async function fromFirestore(read) {
  if (!USE_FIRESTORE_FALLBACK || USE_MOCK || !db) return null;
  try {
    const result = await withTimeout(read());
    return Array.isArray(result) ? (result.length ? result : null) : result;
  } catch {
    return null;
  }
}

/** Ambil daftar seluruh green space (Taman Sritanjung, Blambangan, dst). */
export async function getGreenSpaces() {
  const api = await fromLaravel("/green-spaces");
  if (api) return api;

  const fs = await fromFirestore(async () => {
    const snap = await getDocs(query(collection(db, "green_space"), orderBy("name")));
    return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
  });
  if (fs) return fs;

  await delay();
  return greenSpaces;
}

/** Ambil daftar koridor (pilot + rencana perluasan). */
export async function getKoridorList() {
  const api = await fromLaravel("/koridors");
  if (api) return api;

  const fs = await fromFirestore(async () => {
    const snap = await getDocs(collection(db, "koridor"));
    return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
  });
  if (fs) return fs;

  await delay();
  return koridors;
}

/** Ambil detail satu koridor beserta skor lingkungan terbaru. */
export async function getKoridorDetail(koridorId) {
  const api = await fromLaravel(`/koridors/${koridorId}`);
  if (api) return api;

  const fs = await fromFirestore(async () => {
    const snap = await getDoc(doc(db, "koridor", String(koridorId)));
    if (!snap.exists()) return null;
    const sensor = await getLatestReading(koridorId);
    return { id: Number(snap.id), ...snap.data(), sensor };
  });
  if (fs) return fs;

  await delay();
  const koridor = koridors.find((k) => k.id === Number(koridorId));
  if (!koridor) throw new Error("Koridor tidak ditemukan.");
  return koridor;
}
