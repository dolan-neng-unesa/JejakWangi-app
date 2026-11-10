import { useEffect, useState } from "react";
import StatusPill from "../global/StatusPill";
import Icon from "../global/Icon";
import { useNavigate } from "react-router-dom";

/**
 * Menampilkan status pemuatan/kesegaran data sensor di bagian atas layar,
 * sesuai 7.3 UX: "Informasi status ditampilkan secara jelas di bagian atas
 * peta — mis. sedang memuat data sensor terkini, atau data terakhir + waktu."
 */
export default function TopStatusBar({ title, showBack = false, sensorState = "online", lastUpdated }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const minutesAgo = lastUpdated ? Math.max(0, Math.round((now - new Date(lastUpdated).getTime()) / 60000)) : null;

  return (
    <header className="sticky top-0 z-20 bg-sand-50/90 backdrop-blur px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b border-canopy-800/5">
      <div className="mx-auto max-w-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="p-1 -ml-1 text-canopy-800 shrink-0"
            >
              <Icon name="chevronLeft" size={22} />
            </button>
          )}
          <h1 className="font-display text-lg text-canopy-950 truncate">{title}</h1>
        </div>
        <StatusPill tone={sensorState}>
          {sensorState === "online" && minutesAgo != null
            ? minutesAgo < 1
              ? "Diperbarui barusan"
              : `Diperbarui ${minutesAgo} mnt lalu`
            : sensorState === "offline"
            ? "Sensor luring"
            : "Memuat…"}
        </StatusPill>
      </div>
    </header>
  );
}
