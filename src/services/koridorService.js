import { delay } from "./config";
import { fetchLaravel, isLaravelAvailable } from "./laravelClient";
import { greenSpaces, koridors } from "../data/mockGreenSpaces";

/**
 * Green space & koridor. Urutan sumber: Laravel -> mock.
 * Halaman selalu mendapat data (mock) alih-alih promise yang ditolak
 * kalau backend belum dijalankan.
 */

async function fromLaravel(path) {
  if (!isLaravelAvailable()) return null;
  try {
    return await fetchLaravel(path);
  } catch {
    return null; // laravelClient sudah mencatat sekali; lanjut ke fallback
  }
}

/** Ambil daftar seluruh green space (Taman Sritanjung, Blambangan, dst). */
export async function getGreenSpaces() {
  const api = await fromLaravel("/green-spaces");
  if (api) return api;

  await delay();
  return greenSpaces;
}

/** Ambil daftar koridor (pilot + rencana perluasan). */
export async function getKoridorList() {
  const api = await fromLaravel("/koridors");
  if (api) return api;

  await delay();
  return koridors;
}

/** Ambil detail satu koridor beserta skor lingkungan terbaru. */
export async function getKoridorDetail(koridorId) {
  const api = await fromLaravel(`/koridors/${koridorId}`);
  if (api) return api;

  await delay();
  const koridor = koridors.find((k) => k.id === Number(koridorId));
  if (!koridor) throw new Error("Koridor tidak ditemukan.");
  return koridor;
}
