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
import { firebaseApp } from "./firebaseClient";
import { USE_MOCK, delay, USE_LARAVEL_API, LARAVEL_API_BASE } from "./config";

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

/**
 * Email/kata sandi lewat Laravel Sanctum (token-based) — menggantikan Firebase
 * Auth untuk metode ini sesuai arahan mentor. Login sosial (Google/Facebook)
 * TETAP lewat Firebase/mock di bawah karena OAuth popup butuh provider yang
 * belum diatur di backend Laravel; hanya email/password yang dipindah.
 * Urutan sumber tetap sama seperti fitur lain: Laravel -> Firebase -> mock.
 */
const LARAVEL_TOKEN_KEY = "svarga_laravel_token";
const LARAVEL_USER_KEY = "svarga_laravel_user";

function readLaravelSession() {
  const token = localStorage.getItem(LARAVEL_TOKEN_KEY);
  const userJson = localStorage.getItem(LARAVEL_USER_KEY);
  if (!token || !userJson) return null;
  try {
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
}

function writeLaravelSession(user, token) {
  if (user && token) {
    localStorage.setItem(LARAVEL_TOKEN_KEY, token);
    localStorage.setItem(LARAVEL_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LARAVEL_TOKEN_KEY);
    localStorage.removeItem(LARAVEL_USER_KEY);
  }
  window.dispatchEvent(new Event("svarga-mock-auth-change"));
}

/** Bentuk objek user disamakan dengan Firebase (uid/email/displayName) supaya UI pemanggil tidak perlu tahu bedanya. */
function toAppUser(laravelUser) {
  return { uid: `laravel-${laravelUser.id}`, email: laravelUser.email, displayName: laravelUser.name };
}

async function laravelAuthRequest(path, body) {
  const res = await fetch(`${LARAVEL_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Gagal menghubungi server autentikasi.");
  return json; // { user: {id, name, email}, token }
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
  if (user) localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(MOCK_USER_KEY);
  // Supaya komponen lain yang subscribe (subscribeToAuthChanges) di tab yang sama ikut update.
  window.dispatchEvent(new Event("svarga-mock-auth-change"));
}

function friendlyAuthError(err) {
  const code = err?.code ?? "";
  const map = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/user-not-found": "Akun dengan email ini tidak ditemukan.",
    "auth/wrong-password": "Kata sandi salah.",
    "auth/invalid-credential": "Email atau kata sandi salah.",
    "auth/email-already-in-use": "Email ini sudah terdaftar. Coba masuk, bukan daftar.",
    "auth/weak-password": "Kata sandi minimal 6 karakter.",
    "auth/popup-closed-by-user": "Jendela login ditutup sebelum selesai.",
    "auth/network-request-failed": "Gagal terhubung ke server. Cek koneksi internet.",
  };
  return map[code] ?? err?.message ?? "Terjadi kesalahan saat autentikasi.";
}

/** Masuk dengan email & kata sandi. */
export async function signInWithEmail(email, password) {
  if (USE_LARAVEL_API) {
    const { user, token } = await laravelAuthRequest("/auth/login", { email, password });
    writeLaravelSession(user, token);
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
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/** Daftar akun baru dengan email & kata sandi. */
export async function registerWithEmail(email, password, displayName) {
  if (USE_LARAVEL_API) {
    const { user, token } = await laravelAuthRequest("/auth/register", {
      name: displayName || email.split("@")[0],
      email,
      password,
    });
    writeLaravelSession(user, token);
    return toAppUser(user);
  }
  if (USE_MOCK) {
    await delay(400);
    if (!email || !password) throw new Error("Email dan kata sandi wajib diisi.");
    if (password.length < 6) throw new Error("Kata sandi minimal 6 karakter.");
    const user = { uid: `mock-${email}`, email, displayName: displayName || email.split("@")[0] };
    writeMockUser(user);
    return user;
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
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
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
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
    const cred = await signInWithPopup(auth, new FacebookAuthProvider());
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

export async function signOutUser() {
  const laravelSession = readLaravelSession();
  if (laravelSession) {
    try {
      await fetch(`${LARAVEL_API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${laravelSession.token}` },
      });
    } catch {
      // Tetap bersihkan sesi lokal walau request logout gagal (mis. server sedang mati).
    }
    writeLaravelSession(null, null);
    return;
  }
  if (USE_MOCK) {
    writeMockUser(null);
    return;
  }
  await signOut(auth);
}

/** Ambil access token Sanctum yang sedang aktif, untuk dipakai request otentikasi lain (mis. submit mood). */
export function getLaravelToken() {
  return readLaravelSession()?.token ?? null;
}

/** Subscribe ke perubahan status login. Mengembalikan fungsi unsubscribe. */
export function subscribeToAuthChanges(callback) {
  if (USE_LARAVEL_API) {
    callback(readLaravelSession() ? toAppUser(readLaravelSession().user) : null);
    const handler = () => callback(readLaravelSession() ? toAppUser(readLaravelSession().user) : null);
    window.addEventListener("svarga-mock-auth-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("svarga-mock-auth-change", handler);
      window.removeEventListener("storage", handler);
    };
  }
  if (USE_MOCK) {
    callback(readMockUser());
    const handler = () => callback(readMockUser());
    window.addEventListener("svarga-mock-auth-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("svarga-mock-auth-change", handler);
      window.removeEventListener("storage", handler);
    };
  }
  return onAuthStateChanged(auth, callback);
}
