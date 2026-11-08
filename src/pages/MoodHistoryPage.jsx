import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";

// Data tren 7 hari & ringkasan agregat — ilustratif (statis) untuk saat ini.
// Analitik sungguhan idealnya berasal dari koleksi `mood_aggregates` yang
// dihitung Cloud Function (lihat TODO di src/services/moodService.js);
// grafik per-hari seperti ini butuh tabel agregat harian tambahan yang
// belum ada di schema.sql.
const weeklyMood = [
  { date: "4 Mei", value: 50, emoji: "😐" },
  { date: "5 Mei", value: 35, emoji: "😢" },
  { date: "6 Mei", value: 65, emoji: "🙂" },
  { date: "7 Mei", value: 55, emoji: "😐" },
  { date: "8 Mei", value: 90, emoji: "😄" },
  { date: "9 Mei", value: 70, emoji: "🙂" },
  { date: "10 Mei", value: 85, emoji: "😄" },
];

const summary = [
  { label: "Sangat Baik", emoji: "😄", percent: 40, color: "bg-canopy-800" },
  { label: "Baik", emoji: "🙂", percent: 30, color: "bg-canopy-600" },
  { label: "Biasa Saja", emoji: "😐", percent: 15, color: "bg-ochre-500" },
  { label: "Buruk", emoji: "😣", percent: 10, color: "bg-orange-500" },
  { label: "Sangat Buruk", emoji: "😢", percent: 5, color: "bg-alert-600" },
];

export default function MoodHistoryPage() {
  const navigate = useNavigate();
  const maxValue = Math.max(...weeklyMood.map((d) => d.value));

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
          <h1 className="font-display font-bold text-lg text-ink-900">Riwayat Mood</h1>
        </div>

        <div className="flex items-center justify-between mt-6 mb-3">
          <h2 className="font-semibold text-ink-900">Analisis Mood</h2>
          <button className="flex items-center gap-1.5 text-xs text-ink-700 bg-white border border-canopy-800/10 rounded-full px-3 py-1.5">
            7 Hari Terakhir
            <Icon name="chevronDown" size={13} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-canopy-800/10 p-4">
          <div className="flex items-end justify-between gap-2 h-36">
            {weeklyMood.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-base">{d.emoji}</span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-full bg-canopy-700"
                    style={{ height: `${(d.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            {weeklyMood.map((d) => (
              <div key={d.date} className="flex-1 text-center">
                <p className="font-data text-xs text-ink-900">{d.value}</p>
                <p className="text-[0.6rem] text-ink-500 mt-0.5">{d.date}</p>
              </div>
            ))}
          </div>
        </div>

        <h2 className="font-semibold text-ink-900 mt-6 mb-3">Ringkasan Mood</h2>
        <div className="bg-white rounded-2xl border border-canopy-800/10 p-4 flex flex-col gap-4">
          {summary.map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-2 text-ink-900">
                  <span>{s.emoji}</span>
                  {s.label}
                </span>
                <span className="font-medium text-ink-900">{s.percent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-sand-100 overflow-hidden">
                <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
