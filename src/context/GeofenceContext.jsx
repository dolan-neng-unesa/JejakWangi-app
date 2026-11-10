import { useEffect, useRef, useState } from "react";
import { getActiveGeofences, getSoundscape, findActiveZone } from "../services/geofenceService";
import { GeofenceContext } from "./geofenceContextObject";

const GEO_ERROR_MESSAGES = {
  1: "Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser untuk memakai geofencing.",
  2: "Lokasi perangkat tidak tersedia saat ini.",
  3: "Waktu pencarian lokasi habis. Coba lagi.",
};

/**
 * Menyediakan status geofencing (daftar zona, zona aktif, status pemantauan)
 * ke SELURUH aplikasi — dipasang sekali di App.jsx supaya notifikasi "Zona
 * Aktif" bisa muncul di halaman manapun yang sedang dibuka, bukan cuma saat
 * pengguna sedang berada di halaman Geofencing.
 */
export function GeofenceProvider({ children }) {
  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [activeSoundscape, setActiveSoundscape] = useState(null);
  const [watching, setWatching] = useState(false);
  const [watchError, setWatchError] = useState(null);

  // Ref, bukan state/closure: callback watchPosition dibuat sekali saat startWatching dipanggil,
  // jadi `zones` yang ia tangkap bisa saja masih [] (daftar zona belum selesai dimuat) dan
  // tidak pernah diperbarui — zona tak pernah terdeteksi selama sesi pemantauan itu.
  const zonesRef = useRef([]);
  const dismissedZoneId = useRef(null);
  const currentZoneId = useRef(null); // zona yang sedang ditempati menurut GPS
  const triggerSeq = useRef(0); // menolak hasil soundscape yang datang terlambat
  const soundscapeCache = useRef(new Map());
  const watchIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getActiveGeofences()
      .then((list) => {
        if (cancelled) return;
        zonesRef.current = list;
        setZones(list);
      })
      .catch(() => {
        // Tanpa catch, kegagalan memuat zona menjadi unhandled rejection; fitur tetap bisa
        // dipakai lewat simulasi/zona yang berhasil dimuat nanti.
      });

    return () => {
      cancelled = true;
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  async function loadSoundscape(id) {
    const cache = soundscapeCache.current;
    if (cache.has(id)) return cache.get(id);
    const data = await getSoundscape(id);
    if (data) cache.set(id, data); // jangan cache null/galat supaya bisa dicoba lagi
    return data;
  }

  async function triggerZone(zone) {
    if (dismissedZoneId.current === zone.id) return;
    const seq = ++triggerSeq.current;
    setActiveZone(zone);
    try {
      const soundscape = await loadSoundscape(zone.soundscape_id);
      if (seq === triggerSeq.current) setActiveSoundscape(soundscape);
    } catch {
      if (seq === triggerSeq.current) setActiveSoundscape(null);
    }
  }

  function closeAlert() {
    dismissedZoneId.current = activeZone?.id ?? null;
    setActiveZone(null);
  }

  function handlePosition(pos) {
    const zone = findActiveZone(pos.coords.latitude, pos.coords.longitude, zonesRef.current);

    if (!zone) {
      // Keluar dari zona: izinkan notifikasi muncul lagi saat pengguna masuk kembali.
      currentZoneId.current = null;
      dismissedZoneId.current = null;
      return;
    }

    // watchPosition menembak tiap beberapa detik selama pengguna diam di dalam zona; tanpa
    // pengecekan ini setiap pembaruan memicu ulang alert + request soundscape.
    if (currentZoneId.current === zone.id) return;
    currentZoneId.current = zone.id;
    triggerZone(zone);
  }

  function clearWatch() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    currentZoneId.current = null;
  }

  function startWatching() {
    if (!("geolocation" in navigator)) {
      alert("Perangkat/browser ini tidak mendukung Geolocation API.");
      return;
    }
    if (watchIdRef.current != null) return; // sudah berjalan
    setWatchError(null);
    setWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        // Bersihkan juga watchIdRef: kalau hanya setWatching(false), startWatching berikutnya
        // melihat id lama dan keluar di "sudah berjalan" — pemantauan tak bisa dimulai ulang.
        clearWatch();
        setWatching(false);
        setWatchError(GEO_ERROR_MESSAGES[err.code] ?? "Gagal membaca lokasi perangkat.");
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  function stopWatching() {
    clearWatch();
    setWatching(false);
  }

  // Simulasi untuk keperluan demo/testing — lokasi zona di Banyuwangi tidak
  // akan cocok dengan GPS asli kebanyakan penguji.
  function simulateZone(zone) {
    dismissedZoneId.current = null;
    triggerZone(zone);
  }

  return (
    <GeofenceContext.Provider
      value={{ zones, activeZone, activeSoundscape, watching, watchError, startWatching, stopWatching, simulateZone, closeAlert }}
    >
      {children}
    </GeofenceContext.Provider>
  );
}
