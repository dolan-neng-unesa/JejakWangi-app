import { LARAVEL_API_BASE, USE_LARAVEL_API } from "./config";
import { clearSession, getToken } from "./sessionStore";

// Klien fetch bersama untuk API Laravel (koridor, green space, UMKM, festival,
// geofence, soundscape, sensor, mood, auth).
//
// Yang ditangani di sini supaya tidak diulang di tiap service:
//  - Timeout (default 10 dtk): tanpa ini request ke server yang menggantung membuat
//    halaman memuat selamanya.
//  - Respons non-JSON (halaman 502/HTML dari proxy) tidak lagi memicu
//    "Unexpected token <" — dijadikan ApiError dengan pesan yang jelas.
//  - ApiError membawa status, galat validasi per-kolom (422) dan Retry-After (429).
//  - 401 pada request ber-token → sesi lokal dibersihkan (token dicabut/kedaluwarsa).
//  - Request GET identik yang sedang berjalan digabung jadi satu (beberapa komponen
//    yang memanggil endpoint yang sama di render yang sama hanya memicu 1 request).
//
// Pemutus sirkuit: kalau backend tidak terjangkau (server belum dijalankan),
// request berikutnya ke Laravel dilewati selama COOLDOWN_MS dan langsung
// memakai fallback, sehingga satu halaman tidak memicu belasan request gagal
// (dan belasan galat jaringan di konsol) tiap render. Peringatan dicetak
// sekali per kejadian, bukan per request.

const COOLDOWN_MS = 30 * 1000;
const DEFAULT_TIMEOUT_MS = 10 * 1000;
let downUntil = 0;
let warned = false;
// Selama belum pernah ada respons sukses, request pertama jadi "probe": request
// lain yang datang bersamaan menunggu hasilnya dulu. Tanpa ini, halaman yang
// memanggil 3 endpoint sekaligus (MapPage) tetap memicu 3 galat jaringan
// sebelum pemutus sirkuit sempat aktif.
let everUp = false;
let probe = null;

export class ApiError extends Error {
  constructor(message, { status = 0, errors = null, retryAfter = null, network = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 = tidak ada respons HTTP (jaringan/timeout)
    this.errors = errors; // { kolom: [pesan, ...] } dari 422
    this.retryAfter = retryAfter; // detik, dari header Retry-After pada 429
    this.network = network;
  }

  /** Pesan galat validasi pertama (kalau ada), selain itu pesan umum. */
  get friendlyMessage() {
    if (this.errors) {
      const first = Object.values(this.errors).flat()[0];
      if (first) return String(first);
    }
    if (this.status === 429) {
      return this.retryAfter
        ? `Terlalu banyak percobaan. Coba lagi dalam ${this.retryAfter} detik.`
        : "Terlalu banyak percobaan. Coba lagi sebentar lagi.";
    }
    return this.message;
  }
}

export function isLaravelAvailable() {
  return USE_LARAVEL_API && Date.now() >= downUntil;
}

function tripBreaker() {
  downUntil = Date.now() + COOLDOWN_MS;
  if (!warned) {
    warned = true;
    console.info(
      `[SVARGA] Backend Laravel (${LARAVEL_API_BASE}) tidak terjangkau — memakai data cadangan. ` +
        "Jalankan `php artisan serve` di svarga-backend untuk data langsung."
    );
  }
}

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Request ke API Laravel. Mengembalikan body JSON utuh (atau null untuk 204).
 * @param {string} path mis. "/koridors"
 * @param {object} [opts]
 * @param {string} [opts.method="GET"]
 * @param {object} [opts.body] dikirim sebagai JSON
 * @param {boolean|"optional"} [opts.auth=false] true = wajib ber-token; "optional" = sertakan bila ada
 * @param {number} [opts.timeoutMs]
 * @param {AbortSignal} [opts.signal] pembatalan dari pemanggil (tidak memicu pemutus sirkuit)
 * @param {boolean} [opts.breaker=true] false untuk aksi pengguna (login/daftar) yang harus selalu dicoba
 * @throws {ApiError}
 */
export async function apiRequest(path, { method = "GET", body, auth = false, timeoutMs = DEFAULT_TIMEOUT_MS, signal, breaker = true } = {}) {
  if (!USE_LARAVEL_API) throw new ApiError("Laravel API tidak dikonfigurasi", { network: true });

  if (breaker) {
    if (!everUp && probe) await probe;
    if (!isLaravelAvailable()) throw new ApiError("Laravel API sedang tidak tersedia", { network: true });
  }

  const token = auth ? getToken() : null;
  if (auth === true && !token) throw new ApiError("Silakan masuk terlebih dahulu.", { status: 401 });

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onCallerAbort, { once: true });
  }

  let res;
  try {
    const request = fetch(`${LARAVEL_API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (breaker && !everUp && !probe) {
      probe = request
        .then(
          () => undefined,
          () => undefined
        )
        .finally(() => {
          probe = null;
        });
    }
    res = await request;
  } catch (err) {
    if (signal?.aborted && !timedOut) throw err; // dibatalkan pemanggil: bukan kegagalan server
    // Kegagalan jaringan (ERR_CONNECTION_REFUSED dsb.) atau timeout, bukan respons HTTP.
    if (breaker) tripBreaker();
    throw new ApiError(
      timedOut ? "Server terlalu lama merespons. Coba lagi." : "Gagal terhubung ke server. Cek koneksi internet.",
      { network: true }
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onCallerAbort);
  }

  if (breaker) {
    downUntil = 0;
    warned = false;
    everUp = true;
  }

  const json = await parseBody(res);

  if (!res.ok) {
    if (res.status === 401 && token) clearSession(); // token dicabut / kedaluwarsa
    throw new ApiError(json?.message ?? `Server merespons ${res.status}`, {
      status: res.status,
      errors: json?.errors ?? null,
      retryAfter: Number(res.headers.get("Retry-After")) || null,
    });
  }

  return json;
}

const inflight = new Map();

/** GET bertipe "ambil data": membuka pembungkus `{data: ...}` & menggabungkan request identik yang sedang berjalan. */
export function fetchLaravel(path, opts = {}) {
  if (opts.signal || opts.auth) return apiRequest(path, opts).then((json) => json?.data ?? json);

  let pending = inflight.get(path);
  if (!pending) {
    pending = apiRequest(path, opts)
      .then((json) => json?.data ?? json)
      .finally(() => inflight.delete(path));
    inflight.set(path, pending);
  }
  return pending;
}
