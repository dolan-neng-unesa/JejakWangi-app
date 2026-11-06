import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { hasFirebaseCredentials, getFirebaseApp } from "./firebaseClient";
import { USE_MOCK, delay, USE_LARAVEL_API } from "./config";
import { apiRequest, ApiError } from "./laravelClient";
import { AUTH_EVENT, readSession, writeSession, updateSessionUser, clearSession, getToken } from "./sessionStore";

let authInstance = null;
let authPromise = null;

/** Instance Firebase Auth, dibuat saat pertama dibutuhkan; null bila kredensial belum diisi. */
function getAuthInstance() {
  if (!hasFirebaseCredentials) return Promise.resolve(null);
  authPromise ??= getFirebaseApp().then((app) => (authInstance = getAuth(app)));
  return authPromise;
}

/** Kata sandi minimal — harus sama dengan aturan backend (AuthController). */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Email/kata sandi lewat Laravel Sanctum (token-based) — menggantikan Firebase
 * Auth untuk metode ini sesuai arahan mentor. Login sosial (Google/Facebook)
 * TETAP lewat Firebase/mock di bawah karena OAuth popup butuh provider yang
 * belum diatur di backend Laravel; hanya email/password yang dipindah.
 * Urutan sumber tetap sama seperti fitur lain: Laravel -> Firebase -> mock.
 *
 * Sesi aktif bisa datang dari tiga sumber sekaligus (Laravel, mock, Firebase);
 * subscribeToAuthChanges() menggabungkan ketiganya — lihat di bawah.
 */

/** Bentuk objek user disamakan dengan Firebase (uid/email/displayName) supaya UI pemanggil tidak perlu tahu bedanya. */
function toAppUser(laravelUser) {
  return { uid: `laravel-${laravelUser.id}`, email: laravelUser.email, displayName: laravelUser.name };
}

/** Ubah galat apa pun jadi Error dengan pesan yang ramah ditampilkan ke pengguna. */
function toUserError(err) {
  if (err instanceof ApiError) {
    // 401 saat login = kredensial salah; pesan server sudah ramah ("Email atau kata sandi salah.").
    return new Error(err.friendlyMessage);
  }
  return err instanceof Error ? err : new Error(String(err));
}

async function laravelAuthRequest(path, body) {
  try {
    // breaker:false → login/daftar selalu dicoba walau pemutus sirkuit sedang aktif untuk request data.
    return await apiRequest(path, { method: "POST", body, breaker: false });
  } catch (err) {
    throw toUserError(err);
  }
}

// --- Mode mock: sesi disimpan di localStorage, meniru bentuk objek user Firebase ---
const MOCK_USER_KEY = "svarga_mock_user";

function readMockUser() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_USER_KEY) ?? "null");
  } catch {
    return null;
  }
}

function writeMockUser(user) {
  try {
    if (user) localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(MOCK_USER_KEY);
  } catch {
    // storage tidak tersedia — abaikan.
  }
  // Supaya komponen lain yang subscribe (subscribeToAuthChanges) di tab yang sama ikut update.
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function friendlyAuthError(err) {
  const code = err?.code ?? "";
  const map = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/user-not-found": "Akun dengan email ini tidak ditemukan.",
    "auth/wrong-password": "Kata sandi salah.",
    "auth/invalid-credential": "Email atau kata sandi salah.",
    "auth/email-already-in-use": "Email ini sudah terdaftar. Coba masuk, bukan daftar.",
    "auth/weak-password": `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    "auth/popup-closed-by-user": "Jendela login ditutup sebelum selesai.",
    "auth/network-request-failed": "Gagal terhubung ke server. Cek koneksi internet.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
  };
  return map[code] ?? err?.message ?? "Terjadi kesalahan saat autentikasi.";
}

/** Masuk dengan email & kata sandi. */
export async function signInWithEmail(email, password) {
  if (USE_LARAVEL_API) {
    const { user, token, expires_at: expiresAt } = await laravelAuthRequest("/auth/login", { email: email.trim(), password });
    writeSession(user, token, expiresAt);
    return toAppUser(user);
  }
  if (USE_MOCK) {
    await delay(400);
    if (!email || !password) throw new Error("Email dan kata sandi wajib diisi.");
    const user = { uid: `mock-${email}`, email, displayName: email.split("@")[0] };
    writeMockUser(user);
    return user;
  }
  try {
    const cred = await signInWithEmailAndPassword(await getAuthInstance(), email, password);
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/** Daftar akun baru dengan email & kata sandi. */
export async function registerWithEmail(email, password, displayName) {
  if (password && password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  }
  if (USE_LARAVEL_API) {
    const { user, token, expires_at: expiresAt } = await laravelAuthRequest("/auth/register", {
      name: displayName?.trim() || email.split("@")[0],
      email: email.trim(),
      password,
    });
    writeSession(user, token, expiresAt);
    return toAppUser(user);
  }
  if (USE_MOCK) {
    await delay(400);
    if (!email || !password) throw new Error("Email dan kata sandi wajib diisi.");
    const user = { uid: `mock-${email}`, email, displayName: displayName || email.split("@")[0] };
    writeMockUser(user);
    return user;
  }
  try {
    const cred = await createUserWithEmailAndPassword(await getAuthInstance(), email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/** Masuk dengan akun Google (popup). Perlu diaktifkan di Firebase Console → Authentication → Sign-in method. */
export async function signInWithGoogle() {
  if (USE_MOCK) {
    await delay(400);
    const user = { uid: "mock-google", email: "tamu@svarga.app", displayName: "Tamu (Google)" };
    writeMockUser(user);
    return user;
  }
  try {
    const cred = await signInWithPopup(await getAuthInstance(), new GoogleAuthProvider());
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/**
 * Masuk dengan akun Facebook (popup). Selain diaktifkan di Firebase Console,
 * metode ini juga butuh App ID dari Meta for Developers — lihat catatan di README.
 */
export async function signInWithFacebook() {
  if (USE_MOCK) {
    await delay(400);
    const user = { uid: "mock-facebook", email: "tamu@svarga.app", displayName: "Tamu (Facebook)" };
    writeMockUser(user);
    return user;
  }
  try {
    const cred = await signInWithPopup(await getAuthInstance(), new FacebookAuthProvider());
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/** Keluar dari SEMUA sumber sesi (Laravel, mock, Firebase) — pengguna bisa saja punya lebih dari satu aktif. */
export async function signOutUser() {
  if (readSession()) {
    try {
      await apiRequest("/auth/logout", { method: "POST", auth: true, breaker: false, timeoutMs: 5000 });
    } catch {
      // Tetap bersihkan sesi lokal walau request logout gagal (mis. server sedang mati / token sudah kedaluwarsa).
    }
    clearSession();
  }
  if (readMockUser()) writeMockUser(null);
  const firebaseAuth = await getAuthInstance();
  if (firebaseAuth?.currentUser) await signOut(firebaseAuth);
}

/** Ambil access token Sanctum yang sedang aktif, untuk dipakai request otentikasi lain (mis. submit mood). */
export function getLaravelToken() {
  return getToken();
}

/**
 * Cek ke server bahwa token tersimpan masih berlaku. Tanpa ini pengguna yang tokennya
 * sudah dicabut/kedaluwarsa (atau akunnya dinonaktifkan admin) tetap tampak "login" di
 * perangkat selamanya. Hanya galat 401/403 yang menghapus sesi — server mati atau
 * jaringan putus TIDAK boleh membuat pengguna ter-logout.
 */
let validating = null;
export function validateLaravelSession() {
  if (!USE_LARAVEL_API || !readSession()) return Promise.resolve(false);
  validating ??= apiRequest("/auth/me", { auth: true, breaker: false, timeoutMs: 8000 })
    .then((json) => {
      const user = json?.data ?? json;
      if (user?.id) updateSessionUser(user);
      return true;
    })
    .catch((err) => {
      if (err instanceof ApiError && err.status === 403) clearSession(); // akun dinonaktifkan (401 sudah ditangani apiRequest)
      return false;
    })
    .finally(() => {
      validating = null;
    });
  return validating;
}

/** Pengguna aktif saat ini dari sumber mana pun: sesi Laravel > mock > Firebase. */
function currentUser() {
  const session = USE_LARAVEL_API ? readSession() : null;
  if (session) return toAppUser(session.user);
  const mock = USE_MOCK ? readMockUser() : null;
  if (mock) return mock;
  return authInstance?.currentUser ?? null;
}

/**
 * Subscribe ke perubahan status login. Mengembalikan fungsi unsubscribe.
 * Sebelumnya, saat VITE_LARAVEL_API_URL terisi, hanya sesi Laravel yang diamati sehingga
 * login Google/Facebook/mock tidak pernah terdeteksi. Sekarang ketiga sumber digabung,
 * dan token Laravel yang tersimpan divalidasi ke server sekali di awal.
 */
export function subscribeToAuthChanges(callback) {
  let last;
  const emit = () => {
    const user = currentUser();
    const key = user?.uid ?? null;
    if (key === last) return;
    last = key;
    callback(user);
  };

  emit();
  window.addEventListener(AUTH_EVENT, emit);
  window.addEventListener("storage", emit); // sinkron antar-tab
  let unsubscribeFirebase = null;
  let disposed = false;
  getAuthInstance().then((firebaseAuth) => {
    if (firebaseAuth && !disposed) unsubscribeFirebase = onAuthStateChanged(firebaseAuth, emit);
  });

  validateLaravelSession();

  return () => {
    disposed = true;
    window.removeEventListener(AUTH_EVENT, emit);
    window.removeEventListener("storage", emit);
    unsubscribeFirebase?.();
  };
}
