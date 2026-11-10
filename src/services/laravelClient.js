import { LARAVEL_API_BASE, USE_LARAVEL_API } from "./config";

// Klien fetch bersama untuk API Laravel (koridor, green space, UMKM, festival,
// geofence, soundscape). Layanan sensor IoT (sensorService.js) sengaja TIDAK
// memakai ini — alur sensor ESP32 dibiarkan apa adanya.
//
// Pemutus sirkuit: kalau backend tidak terjangkau (server belum dijalankan),
// request berikutnya ke Laravel dilewati selama COOLDOWN_MS dan langsung
// memakai fallback, sehingga satu halaman tidak memicu belasan request gagal
// (dan belasan galat jaringan di konsol) tiap render. Peringatan dicetak
// sekali per kejadian, bukan per request.

const COOLDOWN_MS = 30 * 1000;
let downUntil = 0;
let warned = false;
// Selama belum pernah ada respons sukses, request pertama jadi "probe": request
// lain yang datang bersamaan menunggu hasilnya dulu. Tanpa ini, halaman yang
// memanggil 3 endpoint sekaligus (MapPage) tetap memicu 3 galat jaringan
// sebelum pemutus sirkuit sempat aktif.
let everUp = false;
let probe = null;

export function isLaravelAvailable() {
  return USE_LARAVEL_API && Date.now() >= downUntil;
}

export async function fetchLaravel(path) {
  if (!everUp && probe) await probe;
  if (!isLaravelAvailable()) throw new Error("Laravel API sedang tidak tersedia");

  let res;
  try {
    const request = fetch(`${LARAVEL_API_BASE}${path}`, { headers: { Accept: "application/json" } });
    if (!everUp && !probe) {
      probe = request.then(
        () => undefined,
        () => undefined
      ).finally(() => {
        probe = null;
      });
    }
    res = await request;
  } catch (err) {
    // Kegagalan jaringan (ERR_CONNECTION_REFUSED dsb.), bukan respons HTTP.
    downUntil = Date.now() + COOLDOWN_MS;
    if (!warned) {
      warned = true;
      console.info(
        `[SVARGA] Backend Laravel (${LARAVEL_API_BASE}) tidak terjangkau — memakai data cadangan. ` +
          "Jalankan `php artisan serve` di svarga-backend untuk data langsung."
      );
    }
    throw err;
  }

  downUntil = 0;
  warned = false;
  everUp = true;
  if (!res.ok) throw new Error(`Laravel API ${path} merespons ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}
