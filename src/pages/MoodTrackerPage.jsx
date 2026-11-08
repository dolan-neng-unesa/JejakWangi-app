import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { submitMood } from "../services/moodService";

const moods = [
  { score: 1, emoji: "😢", label: "Buruk" },
  { score: 2, emoji: "😐", label: "Biasa" },
  { score: 3, emoji: "🙂", label: "Baik" },
  { score: 4, emoji: "😄", label: "Sangat Baik" },
];

const activities = [
  { id: "belajar", icon: "book", label: "Belajar" },
  { id: "bekerja", icon: "briefcase", label: "Bekerja" },
  { id: "olahraga", icon: "compass", label: "Olahraga" },
  { id: "lainnya", icon: "dots", label: "Lainnya" },
];

export default function MoodTrackerPage() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(3);
  const [note, setNote] = useState("");
  const [activity, setActivity] = useState("olahraga");
  const [status, setStatus] = useState("idle"); // idle | saving | saved

  async function handleSubmit() {
    if (!selectedMood) return;
    setStatus("saving");
    await submitMood({
      greenSpaceId: 1,
      moodScore: selectedMood,
      anonymousSessionId: "guest-session",
    });
    setStatus("saved");
    setTimeout(() => navigate("/mood/riwayat"), 500);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"
            >
              <Icon name="chevronLeft" size={19} className="text-ink-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-ink-900">Mood Tracker</h1>
          </div>
          <button onClick={() => navigate("/mood/riwayat")} className="text-xs font-medium text-canopy-700">
            Riwayat
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-canopy-800/10 p-4 mt-4">
          <h2 className="font-semibold text-ink-900 text-center">Bagaimana perasaanmu hari ini?</h2>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {moods.map((m) => {
              const isSelected = selectedMood === m.score;
              return (
                <button
                  key={m.score}
                  onClick={() => setSelectedMood(m.score)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-colors ${
                    isSelected ? "bg-canopy-100" : "hover:bg-sand-100"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className={`text-[0.65rem] leading-tight ${isSelected ? "text-canopy-700 font-medium" : "text-ink-500"}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-canopy-800/10 mt-4 pt-4">
            <label htmlFor="note" className="text-sm font-medium text-ink-900">
              Catatan (opsional)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tulis sesuatu tentang perasaanmu..."
              className="w-full mt-2 bg-sand-100 rounded-2xl px-3.5 py-3 text-sm outline-none placeholder:text-ink-500/60 resize-none focus:ring-2 focus:ring-canopy-700/30"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-ink-900">Aktivitas saat ini (opsional)</label>
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {activities.map((a) => {
                const isSelected = activity === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActivity(isSelected ? null : a.id)}
                    className="flex flex-col items-center gap-1.5"
                    aria-pressed={isSelected}
                  >
                    <span
                      className={`h-11 w-11 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-canopy-700 text-sand-50" : "bg-sand-100 text-ink-500"
                      }`}
                    >
                      <Icon name={isSelected ? "check" : a.icon} size={17} />
                    </span>
                    <span className={`text-[0.65rem] ${isSelected ? "text-canopy-700 font-medium" : "text-ink-500"}`}>
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedMood || status === "saving"}
          className="w-full mt-4 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium disabled:opacity-50"
        >
          {status === "saved" ? "Tersimpan 🌿" : status === "saving" ? "Menyimpan…" : "Simpan Mood"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
