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
import { USE_MOCK, delay } from "./config";

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

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
  if (USE_MOCK) {
    writeMockUser(null);
    return;
  }
  await signOut(auth);
}

/** Subscribe ke perubahan status login. Mengembalikan fungsi unsubscribe. */
export function subscribeToAuthChanges(callback) {
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
