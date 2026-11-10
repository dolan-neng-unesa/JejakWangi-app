import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/global/Icon";
import Skeleton from "../components/global/Skeleton";
import BottomNav from "../components/layout/BottomNav";
import { useKoridorRoutes } from "../hooks/useKoridorRoutes";
import { formatDistance } from "../lib/geo";

// Daftar rute = daftar koridor (lihat hooks/useKoridorRoutes.js). Datang dari detail koridor
// lewat ?koridor=ID → koridor itu tampil paling atas dan ditandai.

function LeafRating({ score, max = 5 }) {
  const tone = score >= 4 ? "text-canopy-600" : score === 3 ? "text-ochre-500" : "text-alert-600";
  return (
    <div className="flex items-center gap-0.5" aria-label={`Skor kehijauan ${score} dari ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} name="leaf" size={14} strokeWidth={i < score ? 2 : 1.3} className={i < score ? tone : "text-canopy-200"} />
      ))}
    </div>
  );
}

export default function RouteListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("koridor");
  const { loading, list } = useKoridorRoutes();

  const sorted = useMemo(
    () => [...list].sort((a, b) => Number(b.id === focusId) - Number(a.id === focusId) || Number(b.hasPath) - Number(a.hasPath)),
    [list, focusId]
  );

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center shrink-0"
          >
            <Icon name="chevronLeft" size={19} className="text-ink-900" />
          </button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg text-ink-900">Smart Green Route</h1>
            <p className="text-xs text-ink-500 mt-0.5">Pilih koridor hijau yang ingin Anda lalui.</p>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col gap-2.5 mt-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!loading && list.length === 0 && <p className="text-sm text-ink-500 mt-6">Belum ada koridor yang tersedia.</p>}

        <div className="flex flex-col gap-2.5 mt-5">
          {sorted.map((r) => {
            const k = r.koridor;
            const focused = r.id === focusId;
            return (
              <button
                key={r.id}
                disabled={!r.hasPath}
                onClick={() => navigate(`/route/pilih?koridor=${r.id}`)}
                className={`w-full text-left rounded-2xl border p-3.5 flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${
                  focused ? "bg-canopy-100 border-canopy-700" : "bg-white border-canopy-800/10"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-ink-900">{r.label}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{r.routeLabel}</p>
                  <p className="text-[0.7rem] text-ink-500 mt-1">
                    🍴{k.umkm_count ?? 0} UMKM di rute ini
                    {r.hasPath ? ` • ${r.minutes} menit • ${formatDistance(r.distanceMeters)}` : " • Jalur belum tersedia"}
                    {k.status === "rencana" && " • Rencana"}
                  </p>
                  <div className="mt-2">
                    <LeafRating score={k.hijau_score ?? 0} />
                  </div>
                </div>
                {r.hasPath && <Icon name="chevronLeft" size={16} className="rotate-180 text-ink-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
