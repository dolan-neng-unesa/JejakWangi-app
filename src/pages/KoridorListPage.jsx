import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/global/Icon";
import Skeleton from "../components/global/Skeleton";
import BottomNav from "../components/layout/BottomNav";
import { getKoridorList } from "../services/koridorService";

const hijauBadge = {
  paling_hijau: { label: "Paling Hijau", className: "bg-canopy-700 text-sand-50" },
  agak_hijau: { label: "Agak Hijau", className: "bg-canopy-100 text-canopy-700" },
  setengah_hijau: { label: "Setengah Hijau", className: "bg-ochre-100 text-ochre-600" },
  tidak_hijau: { label: "Tidak Hijau", className: "bg-alert-600/10 text-alert-600" },
};

function LeafRating({ score = 0, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Indeks hijau ${score} dari ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon
          key={i}
          name="leaf"
          size={14}
          strokeWidth={i < score ? 2 : 1.3}
          className={i < score ? "text-canopy-600" : "text-canopy-200"}
        />
      ))}
    </div>
  );
}

export default function KoridorListPage() {
  const [koridors, setKoridors] = useState(null);

  useEffect(() => {
    getKoridorList().then(setKoridors);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-28">
        <h1 className="font-display font-bold text-2xl text-ink-900">Pilih Koridor Hijau</h1>
        <p className="text-sm text-ink-500 mt-1">6 wilayah pemantauan sensor ekologis aktif saat ini.</p>

        <div className="flex flex-col gap-4 mt-5">
          {!koridors && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}

          {koridors?.map((k) => {
            const badge = hijauBadge[k.hijau_level] ?? hijauBadge.agak_hijau;
            return (
              <Link
                key={k.id}
                to={`/koridor/${k.id}`}
                className="bg-white rounded-2xl border border-canopy-800/10 p-3 flex gap-3"
              >
                <img
                  src={k.thumbnail}
                  alt={k.short_name}
                  className="h-20 w-20 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-ink-900 leading-snug">{k.short_name}</h2>
                    <span className={`text-[0.6rem] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${badge.className}`}>
                      {badge.label.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">{k.desc}</p>

                  <div className="flex items-center justify-between mt-2">
                    <LeafRating score={k.hijau_score} />
                    <span className="text-[0.65rem] text-ink-500">Indeks IoT Aktif</span>
                  </div>

                  <span className="inline-flex items-center gap-1 mt-2 text-[0.65rem] font-medium text-ochre-600 bg-ochre-100 rounded-full px-2 py-1">
                    <Icon name="cutlery" size={11} />
                    {k.umkm_count} UMKM Kuliner
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
