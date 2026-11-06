import { USE_MOCK, delay, USE_LARAVEL_API } from "./config";
import { loadFirestore } from "./firebaseClient";
import { apiRequest } from "./laravelClient";

const LOCAL_KEY = "svarga_mood_logs_mock";
const ANON_SESSION_KEY = "svarga_anon_session";

let memorySessionId = null; // cadangan bila localStorage tidak tersedia (mode privat)

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * ID acak per perangkat untuk mode tamu, disimpan agar sama antar kunjungan. Sebelumnya
 * halaman Mood Tracker mengirim string tetap "guest-session" untuk SEMUA tamu, sehingga
 * `unique_contributors` di ringkasan mood selalu menghitung seluruh tamu sebagai satu orang.
 * Tidak berisi data pribadi — hanya untuk membedakan kontributor secara anonim.
 */
export function getAnonymousSessionId() {
  try {
    let id = localStorage.getItem(ANON_SESSION_KEY);
    if (!id) {
      id = `guest-${randomId()}`;
      localStorage.setItem(ANON_SESSION_KEY, id);
    }
    return id;
  } catch {
    return (memorySessionId ??= `guest-${randomId()}`);
  }
}

function readLocalLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeLocalLogs(logs) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(logs));
  } catch {
    // kuota penuh / storage diblokir: catatan mock tidak tersimpan, tapi pengguna tidak perlu melihat galat.
  }
}

/**
 * Simpan satu entri mood. Sesuai arahan mentor, backend untuk fitur ini
 * dipindah ke Laravel (lihat MoodLogController). Urutan sumber data:
 *   1. Laravel API (kalau VITE_LARAVEL_API_URL diisi)
 *   2. Firestore (fallback kalau Laravel tidak dikonfigurasi/gagal)
 *   3. Data mock lokal (fallback terakhir)
 *
 * Data bersifat agregat/anonim (lihat Batasan 4.1) — mode tamu (tanpa
 * login) tetap didukung penuh: anonymous_session_id dipakai selama
 * pengguna belum login, dan kalau ada token Sanctum yang aktif, backend
 * otomatis ikut mencatat user_id (lihat MoodLogController@store).
 */
export async function submitMood({ greenSpaceId, moodScore, note, activity, anonymousSessionId }) {
  const sessionId = anonymousSessionId || getAnonymousSessionId();

  if (USE_LARAVEL_API) {
    try {
      const json = await apiRequest("/mood-logs", {
        method: "POST",
        auth: "optional", // token Sanctum dilampirkan bila ada → backend mencatat user_id
        breaker: false,
        body: {
          green_space_id: Number(greenSpaceId),
          mood_score: moodScore,
          note: note || undefined,
          activity: activity || undefined,
          anonymous_session_id: sessionId,
        },
      });
      return json?.data ?? json;
    } catch (err) {
      // Hanya galat jaringan/server (tidak terjangkau, 5xx) yang boleh jatuh ke fallback.
      // 4xx (validasi 422, throttle 429) adalah penolakan sah: sebelumnya ditelan lalu data
      // "disimpan" ke fallback sehingga pengguna mengira berhasil padahal ditolak server.
      if (err.status >= 400 && err.status < 500) throw err;
      console.warn("Laravel API (mood-logs) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay(250);
    const logs = readLocalLogs();
    const entry = {
      id: Date.now(),
      green_space_id: greenSpaceId,
      mood_score: moodScore,
      note: note ?? null,
      activity: activity ?? null,
      anonymous_session_id: sessionId,
      logged_at: new Date().toISOString(),
    };
    logs.push(entry);
    writeLocalLogs(logs);
    return entry;
  }

  const { db, addDoc, collection, serverTimestamp } = await loadFirestore();
  const docRef = await addDoc(collection(db, "mood_logs"), {
    green_space_id: Number(greenSpaceId),
    mood_score: moodScore,
    note: note ?? null,
    activity: activity ?? null,
    anonymous_session_id: sessionId,
    logged_at: serverTimestamp(),
  });
  return { id: docRef.id };
}

/**
 * Ambil rekap agregat mood (bukan data individual) untuk satu green space,
 * dipakai halaman Riwayat Mood: tren N hari terakhir + distribusi skor.
 * Lewat Laravel, agregat dihitung langsung dengan SQL (MoodLogController@summary)
 * — tidak perlu lagi Cloud Function terpisah seperti rencana lama di
 * versi Firestore (lihat cabang getMoodAggregateFirestore di bawah).
 */
export async function getMoodSummary(greenSpaceId, days = 7) {
  if (USE_LARAVEL_API) {
    try {
      const query = new URLSearchParams({ green_space_id: String(greenSpaceId), days: String(days) });
      return await apiRequest(`/mood-logs/summary?${query}`, { breaker: false }); // { total_entries, daily: [...], distribution: {...} }
    } catch (err) {
      console.warn("Laravel API (mood-logs/summary) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay();
    // Id bisa tersimpan sebagai angka atau string ("1") tergantung asal pemanggil — bandingkan sebagai angka.
    const logs = readLocalLogs().filter((l) => Number(l.green_space_id) === Number(greenSpaceId));
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // skala mood 1–5, sama dengan backend
    logs.forEach((l) => (distribution[l.mood_score] = (distribution[l.mood_score] ?? 0) + 1));
    return { total_entries: logs.length, daily: [], distribution };
  }

  // Fallback lama (Firestore): baca agregat pra-hitung dari koleksi
  // `mood_aggregates` (lihat catatan getMoodAggregateFirestore).
  return getMoodAggregateFirestore(greenSpaceId);
}

/**
 * PENTING: firestore.rules memblokir `read` langsung ke koleksi `mood_logs`
 * supaya entri mood individual tidak pernah bisa dibaca ulang, konsekuensi
 * dari komitmen anonimitas di Batasan 4.1 proposal. Agregat HARUS dihasilkan
 * di sisi server (Cloud Function) dan ditulis ke `mood_aggregates/{greenSpaceId}`.
 * TODO (belum dibuat, hanya relevan kalau Laravel tidak dipakai): Cloud
 * Function `onCreate` di `mood_logs` yang menghitung ulang & menulis ke sana.
 */
async function getMoodAggregateFirestore(greenSpaceId) {
  const { db, getDoc, doc } = await loadFirestore();
  const snap = await getDoc(doc(db, "mood_aggregates", String(greenSpaceId)));
  return snap.exists() ? snap.data() : { count: 0, average: null };
}
