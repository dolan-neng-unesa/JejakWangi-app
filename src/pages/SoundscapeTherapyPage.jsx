import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { soundscapes } from "../data/mockContent";

const categoryLabel = {
  gamelan_using: "Gamelan Using",
  alam: "Suara Alam",
  ambient: "Ambient",
};

export default function SoundscapeTherapyPage() {
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState(null);

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"
          >
            <Icon name="chevronLeft" size={19} className="text-ink-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-ink-900">Soundscape Therapy</h1>
        </div>

        <p className="text-sm text-ink-500 mt-3 mb-4">
          Audio terapi personal memakai bunyi khas Using Banyuwangi — otomatis diputar saat memasuki
          zona geofencing tertentu, atau bisa diputar manual di sini.
        </p>

        <div className="flex flex-col gap-2.5">
          {soundscapes.map((s) => {
            const isPlaying = playingId === s.id;
            return (
              <div
                key={s.id}
                className={`rounded-2xl border p-3.5 flex items-center gap-3 transition-colors ${
                  isPlaying ? "bg-canopy-100 border-canopy-700" : "bg-white border-canopy-800/10"
                }`}
              >
                <button
                  onClick={() => setPlayingId(isPlaying ? null : s.id)}
                  className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${
                    isPlaying ? "bg-canopy-700 text-sand-50" : "bg-canopy-100 text-canopy-700"
                  }`}
                  aria-label={isPlaying ? "Jeda" : "Putar"}
                >
                  <Icon name={isPlaying ? "sound" : "play"} size={16} />
                </button>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-ink-900">{s.title}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {categoryLabel[s.category] ?? s.category} • {s.duration}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
