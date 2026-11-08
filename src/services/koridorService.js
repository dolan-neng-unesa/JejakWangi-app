import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { USE_MOCK, delay } from "./config";
import { db } from "./firebaseClient";
import { greenSpaces, koridors } from "../data/mockGreenSpaces";
import { getLatestReading } from "./sensorService";

/**
 * Struktur Firestore yang diasumsikan (lihat src/db/schema.sql untuk versi relasional):
 *   green_space/{greenSpaceId}   — sama seperti tabel green_space
 *   koridor/{koridorId}          — sama seperti tabel koridor, doc id = "1", "2", dst.
 */

/** Ambil daftar seluruh green space (Taman Sritanjung, Blambangan, dst). */
export async function getGreenSpaces() {
  if (USE_MOCK) {
    await delay();
    return greenSpaces;
  }
  const snap = await getDocs(query(collection(db, "green_space"), orderBy("name")));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

/** Ambil daftar koridor (pilot + rencana perluasan). */
export async function getKoridorList() {
  if (USE_MOCK) {
    await delay();
    return koridors;
  }
  const snap = await getDocs(collection(db, "koridor"));
  return snap.docs.map((d) => ({ id: Number(d.id), ...d.data() }));
}

/** Ambil detail satu koridor beserta skor lingkungan terbaru. */
export async function getKoridorDetail(koridorId) {
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
