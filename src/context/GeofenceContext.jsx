import { useEffect, useRef, useState } from "react";
import { getActiveGeofences, getSoundscape, findActiveZone } from "../services/geofenceService";
import { GeofenceContext } from "./geofenceContextObject";

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
  const dismissedZoneId = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    getActiveGeofences().then(setZones);
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  async function triggerZone(zone) {
    if (dismissedZoneId.current === zone.id) return;
    setActiveZone(zone);
    setActiveSoundscape(await getSoundscape(zone.soundscape_id));
  }

  function closeAlert() {
    dismissedZoneId.current = activeZone?.id ?? null;
    setActiveZone(null);
  }

  function startWatching() {
    if (!("geolocation" in navigator)) {
      alert("Perangkat/browser ini tidak mendukung Geolocation API.");
      return;
    }
    if (watchIdRef.current != null) return; // sudah berjalan
    setWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const zone = findActiveZone(pos.coords.latitude, pos.coords.longitude, zones);
        if (zone) triggerZone(zone);
      },
      () => setWatching(false),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  function stopWatching() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
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
      value={{ zones, activeZone, activeSoundscape, watching, startWatching, stopWatching, simulateZone, closeAlert }}
    >
      {children}
    </GeofenceContext.Provider>
  );
}
