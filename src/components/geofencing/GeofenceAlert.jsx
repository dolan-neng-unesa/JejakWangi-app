import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../global/Icon";

/**
 * Overlay dalam-app yang mensimulasikan notifikasi "Zona Aktif" saat pengguna
 * memasuki area geofencing (sesuai mockup geofencing-aktif.png). Notifikasi
 * OS native sungguhan tidak bisa dibuat kustom seperti ilustrasi taman di
 * mockup — jadi ini ditampilkan sebagai bottom-sheet di dalam PWA, muncul di
 * atas halaman manapun yang sedang dibuka saat zona terdeteksi aktif.
 */
export default function GeofenceAlert({ zone, soundscape, onClose }) {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);

  if (!zone) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden">
      {/* Latar ilustrasi — dipotong langsung dari mockup geofencing-aktif.png.
          Zona tanpa ilustrasi khusus jatuh ke gradasi hijau bermerek. */}
      {zone.background_image ? (
        <img
          src={zone.background_image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-canopy-700 via-canopy-800 to-canopy-950" />
      )}
      <div className="absolute inset-0 bg-canopy-950/25" />

      <div className="relative w-full max-w-md bg-white rounded-[1.75rem] p-5 shadow-xl mx-4 animate-in">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-canopy-700 tracking-wide uppercase">
            <Icon name="bell" size={15} />
            Zona Aktif
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="h-7 w-7 rounded-full bg-canopy-100 flex items-center justify-center text-canopy-700"
          >
            <Icon name="close" size={13} />
          </button>
        </div>

        <h2 className="font-display font-bold text-lg text-ink-900 mt-3 leading-snug">
          {zone.welcome_title}
        </h2>
        <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">{zone.welcome_desc}</p>

        {soundscape && (
          <button
            onClick={() => setPlaying((p) => !p)}
            className="w-full flex items-center gap-3 bg-canopy-100 rounded-2xl px-3.5 py-3 mt-4"
          >
            <span className="h-9 w-9 rounded-full bg-canopy-700 text-sand-50 flex items-center justify-center shrink-0">
              <Icon name={playing ? "sound" : "play"} size={15} />
            </span>
            <span className="text-left min-w-0">
              <p className="text-sm font-medium text-ink-900">{soundscape.title}</p>
              <p className="text-xs text-ink-500">Audio Relaksasi • {soundscape.duration}</p>
            </span>
          </button>
        )}

        <button
          onClick={() => {
            onClose();
            if (zone.koridor_id) navigate(`/koridor/${zone.koridor_id}`);
          }}
          className="w-full mt-4 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium"
        >
          Lihat Informasi Lokasi
        </button>
      </div>
    </div>
  );
}
