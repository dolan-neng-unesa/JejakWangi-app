import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { USE_MOCK, delay, USE_LARAVEL_API, LARAVEL_API_BASE } from "./config";
import { db } from "./firebaseClient";
import { getLaravelToken } from "./authService";

const LOCAL_KEY = "svarga_mood_logs_mock";

function readLocalLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeLocalLogs(logs) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(logs));
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
  if (USE_LARAVEL_API) {
    try {
      const token = getLaravelToken();
      const res = await fetch(`${LARAVEL_API_BASE}/mood-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          green_space_id: Number(greenSpaceId),
          mood_score: moodScore,
          note: note || undefined,
          activity: activity || undefined,
          anonymous_session_id: anonymousSessionId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? `Laravel API /mood-logs merespons ${res.status}`);
      return json.data;
    } catch (err) {
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
      anonymous_session_id: anonymousSessionId,
      logged_at: new Date().toISOString(),
    };
    logs.push(entry);
    writeLocalLogs(logs);
    return entry;
  }

  const docRef = await addDoc(collection(db, "mood_logs"), {
    green_space_id: Number(greenSpaceId),
    mood_score: moodScore,
    note: note ?? null,
    activity: activity ?? null,
    anonymous_session_id: anonymousSessionId,
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
      const res = await fetch(
        `${LARAVEL_API_BASE}/mood-logs/summary?green_space_id=${greenSpaceId}&days=${days}`
      );
      if (!res.ok) throw new Error(`Laravel API /mood-logs/summary merespons ${res.status}`);
      return res.json(); // { total_entries, daily: [...], distribution: {...} }
    } catch (err) {
      console.warn("Laravel API (mood-logs/summary) tidak terjangkau, jatuh ke fallback:", err.message);
    }
  }

  if (USE_MOCK) {
    await delay();
    const logs = readLocalLogs().filter((l) => l.green_space_id === greenSpaceId);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
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
  const snap = await getDoc(doc(db, "mood_aggregates", String(greenSpaceId)));
  return snap.exists() ? snap.data() : { count: 0, average: null };
}
