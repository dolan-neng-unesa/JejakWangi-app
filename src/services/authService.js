import { delay, USE_LARAVEL_API } from "./config";
import { apiRequest, ApiError } from "./laravelClient";
import { AUTH_EVENT, readSession, writeSession, updateSessionUser, clearSession, getToken } from "./sessionStore";

/** Kata sandi minimal — harus sama dengan aturan backend (AuthController). */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Autentikasi email/kata sandi lewat Laravel Sanctum (token-based).
 * Kalau VITE_LARAVEL_API_URL kosong (mengembangkan UI tanpa backend), login
 * memakai sesi mock di localStorage supaya alur halaman tetap bisa dicoba.
 */

/** Bentuk objek user untuk UI (uid/email/displayName). */
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

// --- Mode mock (tanpa backend): sesi disimpan di localStorage ---
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

/** Masuk dengan email & kata sandi. */
export async function signInWithEmail(email, password) {
  if (USE_LARAVEL_API) {
    const { user, token, expires_at: expiresAt } = await laravelAuthRequest("/auth/login", { email: email.trim(), password });
    writeSession(user, token, expiresAt);
    return toAppUser(user);
  }
  // Backend belum dikonfigurasi: sesi mock lokal.
  await delay(400);
  if (!email || !password) throw new Error("Email dan kata sandi wajib diisi.");
  const user = { uid: `mock-${email}`, email, displayName: email.split("@")[0] };
  writeMockUser(user);
  return user;
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
  // Backend belum dikonfigurasi: sesi mock lokal.
  await delay(400);
  if (!email || !password) throw new Error("Email dan kata sandi wajib diisi.");
  const user = { uid: `mock-${email}`, email, displayName: displayName || email.split("@")[0] };
  writeMockUser(user);
  return user;
}

/**
 * Penyedia login sosial yang aktif di backend (satu sumber: .env backend), mis.
 * { google: { client_id }, facebook: null }. Galat jaringan TIDAK boleh merusak halaman
 * login — hasilnya cukup "tidak ada penyedia" sehingga tombol sosial tidak ditampilkan.
 */
const NO_PROVIDERS = { google: null, facebook: null };
let providersPromise = null;
export function fetchAuthProviders() {
  if (!USE_LARAVEL_API) return Promise.resolve(NO_PROVIDERS);
  providersPromise ??= apiRequest("/auth/providers", { breaker: false, timeoutMs: 8000 })
    .then((json) => ({ ...NO_PROVIDERS, ...(json?.data ?? json ?? {}) }))
    .catch(() => {
      providersPromise = null; // coba lagi di kunjungan berikutnya
      return NO_PROVIDERS;
    });
  return providersPromise;
}

/**
 * Masuk/daftar lewat Google (token = ID token) atau Facebook (token = access token).
 * Backend memverifikasi token ke penyedia lalu membalas format yang sama dengan login email.
 */
export async function signInWithSocial(provider, token) {
  if (!USE_LARAVEL_API) throw new Error("Login sosial membutuhkan koneksi ke server.");
  const { user, token: accessToken, expires_at: expiresAt } = await laravelAuthRequest("/auth/social", { provider, token });
  writeSession(user, accessToken, expiresAt);
  return toAppUser(user);
}

/** Keluar: hapus sesi Laravel (dan sesi mock bila ada). */
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

/** Pengguna aktif saat ini: sesi Laravel, atau sesi mock bila backend tidak dikonfigurasi. */
function currentUser() {
  const session = USE_LARAVEL_API ? readSession() : null;
  if (session) return toAppUser(session.user);
  return USE_LARAVEL_API ? null : readMockUser();
}

/**
 * Subscribe ke perubahan status login. Mengembalikan fungsi unsubscribe.
 * Token Laravel yang tersimpan divalidasi ke server sekali di awal.
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

  validateLaravelSession();

  return () => {
    window.removeEventListener(AUTH_EVENT, emit);
    window.removeEventListener("storage", emit);
  };
}
