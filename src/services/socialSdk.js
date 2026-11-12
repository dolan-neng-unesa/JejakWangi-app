// Pemuat SDK login sosial (Google Identity Services & Facebook JS SDK).
// Skrip pihak ketiga dimuat HANYA saat halaman login dibuka dan penyedianya aktif di
// backend (lihat GET /auth/providers), jadi halaman lain tidak membayar biaya unduhnya.

const scripts = new Map();

function loadScript(id, src) {
  if (!scripts.has(id)) {
    scripts.set(
      id,
      new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.id = id;
        el.src = src;
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => {
          scripts.delete(id); // izinkan coba lagi (mis. setelah koneksi pulih)
          el.remove();
          reject(new Error("Gagal memuat layanan login. Cek koneksi internet lalu coba lagi."));
        };
        document.head.appendChild(el);
      })
    );
  }
  return scripts.get(id);
}

/** Google Identity Services → objek `google.accounts.id`. */
export async function loadGoogleIdentity() {
  await loadScript("google-gsi-client", "https://accounts.google.com/gsi/client");
  const gid = window.google?.accounts?.id;
  if (!gid) throw new Error("Layanan login Google tidak tersedia.");
  return gid;
}

let facebookReady = null;

/** Facebook JS SDK → objek `FB` yang sudah di-init. Dipanggil lebih awal agar FB.login bisa sinkron saat diklik. */
export function loadFacebookSdk({ appId, version = "v21.0" }) {
  facebookReady ??= new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId, version, cookie: false, xfbml: false });
      resolve(window.FB);
    };
    loadScript("facebook-jssdk", "https://connect.facebook.net/en_US/sdk.js").catch((err) => {
      facebookReady = null;
      reject(err);
    });
  });
  return facebookReady;
}
