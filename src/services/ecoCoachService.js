// Eco-Coach AI: penjelasan data berbahasa sehari-hari dari backend (POST /api/eco-coach).
// Angka dihitung server dan dicek ulang di server — AI hanya menjelaskan. API key LLM hanya ada di
// server; app ini tidak pernah memegang kunci apa pun.
import { apiRequest, isLaravelAvailable } from "./laravelClient";
import { getToken } from "./sessionStore";

/**
 * @param {object} opts
 * @param {"ringkasan"|"tanya"} [opts.mode="tanya"] ringkasan = dampak kunjungan terakhir (wajib login)
 * @param {string} [opts.pertanyaan] untuk mode "tanya" (maks. 300 karakter)
 * @param {number|string|null} [opts.koridorId] koridor yang dibicarakan (opsional)
 * @returns {Promise<{teks: string, sumber: "ai"|"template"}|null>} null = server tidak tersedia / tidak berlaku
 * @throws {ApiError} galat dari server (mis. 429 terlalu sering, 422 pertanyaan tidak valid)
 */
export async function askEcoCoach({ mode = "tanya", pertanyaan = "", koridorId = null } = {}) {
  if (!isLaravelAvailable()) return null;
  if (mode === "ringkasan" && !getToken()) return null;

  const body = { mode };
  if (mode === "tanya") body.pertanyaan = String(pertanyaan).trim().slice(0, 300);
  const id = Number(koridorId);
  if (koridorId != null && Number.isInteger(id) && id > 0) body.koridor_id = id;

  const res = await apiRequest("/eco-coach", { method: "POST", auth: "optional", body, timeoutMs: 25000 });
  const d = res?.data;
  return d?.teks ? { teks: String(d.teks), sumber: d.sumber === "ai" ? "ai" : "template" } : null;
}
