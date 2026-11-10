// Service worker minimal: hanya menyimpan tile peta yang pernah dilihat agar
// peta tetap tampil (di area yang sama) saat sinyal lemah/offline. Aset app
// TIDAK di-cache di sini, jadi deploy baru tidak tertahan versi lama.
//
// Strategi NETWORK-FIRST (cache hanya dipakai saat jaringan gagal). Versi lama
// cache-first menyimpan respons "opaque" apa adanya — termasuk tile yang gagal
// (403/429 dari penyedia) — lalu menyajikannya terus, sehingga tile kosong
// "menempel" walau penyedia sudah pulih. v2 juga menghapus cache v1 itu.
const TILE_CACHE = "svarga-map-tiles-v2";
const TILE_HOSTS = ["basemaps.cartocdn.com", "tile.openstreetmap.org"];
const MAX_TILES = 400;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("svarga-map-tiles-") && k !== TILE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_TILES) await Promise.all(keys.slice(0, keys.length - MAX_TILES).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!TILE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith("." + h))) return;

  event.respondWith(
    caches.open(TILE_CACHE).then(async (cache) => {
      try {
        const res = await fetch(request);
        if (res && (res.ok || res.type === "opaque")) {
          cache.put(request, res.clone()).then(() => trim(cache));
        }
        return res;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    })
  );
});
