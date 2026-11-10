import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import BaseTileLayer from "../components/map/BaseTileLayer";
import { useKoridorRoutes } from "../hooks/useKoridorRoutes";
import { haversineMeters, pointAlong } from "../lib/geo";
import { createAmbient } from "../lib/ambient";
import { formatDurasi, formatKm, hitungDampak } from "../lib/journey";
import { getJourney, saveActivity } from "../services/journeyStore";
import EcoCoach from "../components/global/EcoCoach";

const MAX_ACCURACY_M = 40; // abaikan titik GPS yang kurang akurat
const MIN_STEP_M = 3; // abaikan getaran GPS saat diam
const MAX_STEP_M = 80; // lonjakan tak wajar antar-titik (bukan jalan kaki)
const SIM_M_PER_SEC = 12; // mode simulasi dipercepat agar bisa didemokan

function Follow({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.panTo(pos, { animate: true, duration: 0.6 });
  }, [map, pos]);
  return null;
}

export default function ActivityPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { routes } = useKoridorRoutes();
  const simRoute = routes[params.get("koridor") ?? getJourney().koridorId ?? Object.keys(routes)[0]];

  const [status, setStatus] = useState("running"); // running | paused
  const [gps, setGps] = useState("mencari"); // mencari | kuat | lemah | ditolak | tidak-ada | simulasi
  const [simulate, setSimulate] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [path, setPath] = useState([]);
  const [soundOn, setSoundOn] = useState(false);
  const ambient = useRef(null);
  const last = useRef(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Detik berjalan (berhenti saat jeda).
  useEffect(() => {
    if (status !== "running") return undefined;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const addPoint = useCallback((pt) => {
    if (statusRef.current !== "running") {
      last.current = pt; // posisi tetap dilacak agar jarak jeda tidak ikut terhitung
      return;
    }
    const prev = last.current;
    last.current = pt;
    if (!prev) return setPath([pt]);
    const d = haversineMeters(prev, pt);
    if (d < MIN_STEP_M || d > MAX_STEP_M) return;
    setDistance((m) => m + d);
    setPath((p) => [...p, pt]);
  }, []);

  // GPS sungguhan.
  useEffect(() => {
    if (simulate) return undefined;
    if (!("geolocation" in navigator)) {
      setGps("tidak-ada");
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const ok = p.coords.accuracy <= MAX_ACCURACY_M;
        setGps(ok ? "kuat" : "lemah");
        if (ok) addPoint([p.coords.latitude, p.coords.longitude]);
      },
      (err) => setGps(err.code === 1 ? "ditolak" : "lemah"),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [simulate, addPoint]);

  // Mode simulasi: berjalan di sepanjang jalur koridor.
  useEffect(() => {
    if (!simulate || !simRoute?.hasPath) return undefined;
    setGps("simulasi");
    let m = 0;
    const t = setInterval(() => {
      m = Math.min(simRoute.distanceMeters, m + SIM_M_PER_SEC);
      addPoint(pointAlong(simRoute.path, m));
      if (m >= simRoute.distanceMeters) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [simulate, simRoute, addPoint]);

  // Suara ambient menemani perjalanan; butuh gestur pengguna, jadi diaktifkan lewat tombol.
  useEffect(() => {
    ambient.current = createAmbient();
    return () => ambient.current?.stop();
  }, []);
  function toggleSound() {
    if (soundOn) ambient.current.stop();
    else if (!ambient.current.start()) return;
    setSoundOn(!soundOn);
  }

  const kkal = useMemo(() => hitungDampak(distance, getJourney().transport).kkal, [distance]);
  const pos = path[path.length - 1];

  function finish() {
    ambient.current?.stop();
    const j = getJourney();
    const dampak = hitungDampak(distance, j.transport);
    const { activity } = saveActivity({
      startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
      durationSec: elapsed,
      distanceM: Math.round(distance),
      kkal: dampak.kkal,
      co2Kg: dampak.co2Kg,
      liter: dampak.liter,
      rupiah: dampak.rupiah,
      poin: dampak.poin,
      pembanding: dampak.pembanding,
      transport: j.transport,
      koridorId: j.koridorId,
      simulasi: simulate,
      path,
    });
    navigate(`/scan/akhir/${activity.id}`, { replace: true });
  }

  const gpsLabel = {
    mencari: "Mencari sinyal GPS…",
    kuat: "GPS kuat",
    lemah: "GPS lemah",
    ditolak: "Izin lokasi ditolak",
    "tidak-ada": "GPS tidak tersedia",
    simulasi: "Mode simulasi",
  }[gps];
  const needSim = (gps === "ditolak" || gps === "tidak-ada") && !simulate;

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center">
              <Icon name="chevronLeft" size={19} />
            </button>
            <h1 className="font-semibold text-ink-900">Lacak Aktivitas</h1>
          </div>
          <button
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Matikan suara ambient" : "Nyalakan suara ambient"}
            className={`h-9 w-9 rounded-full flex items-center justify-center ${soundOn ? "bg-canopy-700 text-white" : "bg-white border border-canopy-800/10 text-ink-700"}`}
          >
            <Icon name="sound" size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-canopy-700">
            <span className={`h-1.5 w-1.5 rounded-full ${status === "running" ? "bg-canopy-600 animate-pulse" : "bg-ochre-500"}`} />
            {status === "running" ? "Merekam aktivitas" : "Dijeda"}
          </span>
          <span className="text-ink-500">{gpsLabel}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-ink-900">
          <div><p className="font-data text-2xl">{formatKm(distance)}<span className="text-sm text-ink-500"> km</span></p><p className="text-xs text-ink-500">Jarak tempuh</p></div>
          <div><p className="font-data text-2xl">{formatDurasi(elapsed)}</p><p className="text-xs text-ink-500">Durasi</p></div>
          <div><p className="font-data text-2xl">{kkal}</p><p className="text-xs text-ink-500">Kalori (kkal)</p></div>
        </div>

        <div className="relative mt-4 h-72 rounded-3xl overflow-hidden border border-canopy-800/10">
          <MapContainer center={pos ?? simRoute?.path?.[0] ?? [-8.2192, 114.3691]} zoom={17} zoomControl={false} className="h-full w-full">
            <BaseTileLayer />
            {path.length > 1 && <Polyline positions={path} pathOptions={{ color: "#2c4a30", weight: 6 }} />}
            {pos && <CircleMarker center={pos} radius={8} pathOptions={{ color: "#fff", fillColor: "#3f6e45", fillOpacity: 1, weight: 3 }} />}
            <Follow pos={pos} />
          </MapContainer>
        </div>

        {needSim && (
          <div className="mt-3 rounded-2xl bg-ochre-100 text-ochre-600 text-sm px-4 py-3">
            Lokasi tidak bisa dibaca. Aktifkan izin lokasi, atau coba{" "}
            <button onClick={() => setSimulate(true)} className="font-semibold underline">mode simulasi</button> di jalur koridor.
          </div>
        )}

        <EcoCoach page="aktivitas" transport={getJourney().transport} className="mt-4" />

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => setStatus(status === "running" ? "paused" : "running")}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-canopy-700 text-canopy-700 py-3 font-medium"
          >
            <Icon name={status === "running" ? "pause" : "play"} size={17} />
            {status === "running" ? "Jeda" : "Lanjut"}
          </button>
          <button onClick={finish} disabled={distance < 1} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-canopy-700 text-sand-50 py-3 font-medium disabled:bg-canopy-200 disabled:text-canopy-500">
            <Icon name="stop" size={16} /> Selesai
          </button>
        </div>
        <p className="text-center text-xs text-ink-500 mt-3">
          {simulate ? "Mode simulasi: bukan perjalanan sungguhan." : "Tetap waspada dan nikmati perjalananmu."}
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
