import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { USE_MOCK, delay } from "./config";
import { db } from "./firebaseClient";

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
 * Simpan satu entri mood ke koleksi Firestore `mood_logs`. Data bersifat
 * agregat/anonim (lihat Batasan 4.1) — anonymous_session_id dipakai selama
 * pengguna belum login (mode tamu). Security Rules (firestore.rules) mengizinkan
 * `create` publik pada koleksi ini tapi TIDAK mengizinkan `read` per-dokumen,
 * supaya identitas mood individu tidak bisa dibaca ulang oleh siapa pun,
 * termasuk client sendiri — hanya agregat (lihat getMoodAggregate) yang boleh dibaca.
 */
export async function submitMood({ greenSpaceId, moodScore, anonymousSessionId }) {
  if (USE_MOCK) {
    await delay(250);
    const logs = readLocalLogs();
    const entry = {
      id: Date.now(),
      green_space_id: greenSpaceId,
      mood_score: moodScore,
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
    anonymous_session_id: anonymousSessionId,
    logged_at: serverTimestamp(),
  });
  return { id: docRef.id };
}

/**
 * Ambil rekap agregat mood (bukan data individual) untuk satu green space.
 *
 * PENTING: firestore.rules memblokir `read` langsung ke koleksi `mood_logs`
 * (lihat komentar di rules) supaya entri mood individual tidak pernah bisa
 * dibaca ulang oleh siapa pun, termasuk client sendiri — ini konsekuensi
 * dari komitmen anonimitas di Batasan 4.1 proposal.
 *
 * Konsekuensinya, agregat HARUS dihasilkan di sisi server (Cloud Function
 * terjadwal atau Firestore Trigger yang berjalan lewat Admin SDK, sehingga
 * bypass rules) dan ditulis ke koleksi `mood_aggregates/{greenSpaceId}`,
 * yang boleh dibaca publik. Fungsi ini membaca dari koleksi tersebut.
 *
 * TODO (belum dibuat di repo ini): Cloud Function `onCreate` di `mood_logs`
 * atau scheduled function yang menghitung ulang count & average, lalu
 * setDoc ke `mood_aggregates/{greenSpaceId}`.
 */
export async function getMoodAggregate(greenSpaceId) {
  if (USE_MOCK) {
    await delay();
    const logs = readLocalLogs().filter((l) => l.green_space_id === greenSpaceId);
    if (logs.length === 0) return { count: 0, average: null };
    const average = logs.reduce((sum, l) => sum + l.mood_score, 0) / logs.length;
    return { count: logs.length, average: Number(average.toFixed(2)) };
  }

  const snap = await getDoc(doc(db, "mood_aggregates", String(greenSpaceId)));
  return snap.exists() ? snap.data() : { count: 0, average: null };
}
