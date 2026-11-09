import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import Skeleton from "../components/global/Skeleton";
import { getMoodSummary } from "../services/moodService";

// Skala mood_score (1..4) disamakan dengan moods[] di MoodTrackerPage.jsx.
const SCORE_META = {
  4: { label: "Sangat Baik", emoji: "😄", color: "bg-canopy-800" },
  3: { label: "Baik", emoji: "🙂", color: "bg-canopy-600" },
  2: { label: "Biasa Saja", emoji: "😐", color: "bg-ochre-500" },
  1: { label: "Buruk", emoji: "😢", color: "bg-orange-500" },
};

function emojiForAverage(avg) {
  if (avg == null) return "—";
  return SCORE_META[Math.round(avg)]?.emoji ?? "😐";
}

function formatDateLabel(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function MoodHistoryPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null); // null = loading

  useEffect(() => {
    getMoodSummary(1, 7)
      .then(setSummary)
      .catch(() => setSummary({ total_entries: 0, daily: [], distribution: {} }));
  }, []);

  const daily = summary?.daily ?? [];
  const maxValue = Math.max(1, ...daily.map((d) => d.average_score ?? 0));
  const total = summary?.total_entries ?? 0;

  const distributionRows = [4, 3, 2, 1].map((score) => {
    const count = summary?.distribution?.[score] ?? 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { score, count, percent, ...SCORE_META[score] };
  });

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
          <span className="flex items-center gap-1.5 text-xs text-ink-700 bg-white border border-canopy-800/10 rounded-full px-3 py-1.5">
            7 Hari Terakhir
          </span>
        </div>

        {summary === null ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="bg-white rounded-2xl border border-canopy-800/10 p-4">
            <div className="flex items-end justify-between gap-2 h-36">
              {daily.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-base">{emojiForAverage(d.average_score)}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-full ${d.average_score == null ? "bg-sand-100" : "bg-canopy-700"}`}
                      style={{ height: `${((d.average_score ?? 0) / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 mt-2">
              {daily.map((d) => (
                <div key={d.date} className="flex-1 text-center">
                  <p className="font-data text-xs text-ink-900">{d.average_score ?? "–"}</p>
                  <p className="text-[0.6rem] text-ink-500 mt-0.5">{formatDateLabel(d.date)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-semibold text-ink-900 mt-6 mb-3">Ringkasan Mood</h2>
        {summary === null ? (
          <Skeleton className="h-40" />
        ) : total === 0 ? (
          <div className="bg-white rounded-2xl border border-canopy-800/10 p-4 text-sm text-ink-500 text-center">
            Belum ada data mood untuk koridor ini dalam 7 hari terakhir.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-canopy-800/10 p-4 flex flex-col gap-4">
            {distributionRows.map((s) => (
              <div key={s.score}>
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
        )}
      </div>
      <BottomNav />
    </div>
  );
}
