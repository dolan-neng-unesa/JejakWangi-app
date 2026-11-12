import { delay } from "./config";
import { fetchLaravel, isLaravelAvailable } from "./laravelClient";
import { greenSpaces, koridors } from "../data/mockGreenSpaces";
import { terapkanNeracaKarbon } from "../lib/carbonBalance";

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
  // oxygen_kg_day & co2_reduced_kg_day dihitung dari `carbon_inputs` (lib/carbonBalance.js);
  // koridor tanpa carbon_inputs memakai angka tersimpan apa adanya.
  if (api) return Array.isArray(api) ? api.map((k) => terapkanNeracaKarbon(k)) : api;

  await delay();
  return koridors.map((k) => terapkanNeracaKarbon(k));
}

/** Ambil detail satu koridor beserta skor lingkungan terbaru. */
export async function getKoridorDetail(koridorId) {
  const api = await fromLaravel(`/koridors/${koridorId}`);
  if (api) return terapkanNeracaKarbon(api);

  await delay();
  const koridor = koridors.find((k) => k.id === Number(koridorId));
  if (!koridor) throw new Error("Koridor tidak ditemukan.");
  return terapkanNeracaKarbon(koridor);
}
