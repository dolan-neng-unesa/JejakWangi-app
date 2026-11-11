// Penyimpanan sesi Laravel (token Sanctum + profil ringkas) di localStorage.
// Dipisah dari authService supaya laravelClient bisa membaca token / membersihkan
// sesi saat server membalas 401 tanpa membuat impor melingkar
// (authService -> laravelClient -> authService).
//
// Semua akses storage dibungkus try/catch: Safari mode privat & kebijakan
// "blokir cookie dan data situs" melempar SecurityError, yang sebelumnya
// membuat seluruh aplikasi gagal render saat membaca sesi.

export const AUTH_EVENT = "svarga-mock-auth-change"; // nama lama dipertahankan (dipakai juga mode mock)

const TOKEN_KEY = "svarga_laravel_token";
const USER_KEY = "svarga_laravel_user";
const EXPIRES_KEY = "svarga_laravel_expires";

function get(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage tidak tersedia: sesi hanya berlaku selama tab terbuka (tidak fatal).
  }
}

/** @returns {{token: string, user: object}|null} null bila tidak ada sesi, rusak, atau sudah kedaluwarsa. */
export function readSession() {
  const token = get(TOKEN_KEY);
  const userJson = get(USER_KEY);
  if (!token || !userJson) return null;

  const expires = get(EXPIRES_KEY);
  if (expires && Date.parse(expires) <= Date.now()) {
    clearSession();
    return null;
  }

  try {
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
}

export function getToken() {
  return readSession()?.token ?? null;
}

function notify() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function writeSession(user, token, expiresAt = null) {
  set(TOKEN_KEY, token);
  set(USER_KEY, JSON.stringify(user));
  set(EXPIRES_KEY, expiresAt);
  notify();
}

/** Perbarui profil tersimpan tanpa mengganti token (mis. hasil /auth/me). */
export function updateSessionUser(user) {
  set(USER_KEY, JSON.stringify(user));
  notify();
}

export function clearSession() {
  const had = Boolean(get(TOKEN_KEY));
  set(TOKEN_KEY, null);
  set(USER_KEY, null);
  set(EXPIRES_KEY, null);
  if (had) notify();
}
