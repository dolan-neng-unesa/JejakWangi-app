import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import Card from "../components/global/Card";
import Icon from "../components/global/Icon";
import Skeleton from "../components/global/Skeleton";
import { getUmkmByKoridor } from "../services/contentService";

export default function UmkmPage() {
  const [umkm, setUmkm] = useState(null);

  useEffect(() => {
    getUmkmByKoridor(1).then(setUmkm);
  }, []);

  return (
    <PageShell title="UMKM Sekitar Koridor">
      <p className="text-sm text-ink-500 -mt-1 mb-4">
        Usaha lokal rendah karbon di sepanjang koridor hijau — dukung ekonomi warga sambil berjalan sehat.
      </p>
      <div className="flex flex-col gap-3">
        {!umkm && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        {umkm?.map((u) => (
          <Card key={u.id} className="overflow-hidden flex items-stretch gap-3 p-3">
            {u.image ? (
              <img src={u.image} alt={u.business_name} className="h-20 w-20 rounded-xl object-cover shrink-0" />
            ) : (
              <span className="h-20 w-20 rounded-xl bg-canopy-100 text-canopy-700 flex items-center justify-center shrink-0">
                <Icon name="cutlery" size={22} />
              </span>
            )}
            <div className="min-w-0 flex flex-col justify-center flex-1">
              <p className="font-medium text-ink-900">{u.business_name}</p>
              <p className="text-xs text-ink-500 mt-0.5">{u.business_type} • {u.address}</p>
              <div className="flex items-center gap-3 mt-1.5">
                {u.distance_m != null && (
                  <span className="text-xs text-ink-500">{u.distance_m}m</span>
                )}
                {u.rating != null && (
                  <span className="flex items-center gap-1 text-xs text-ink-700">
                    <Icon name="star" size={11} className="text-ochre-500" />
                    {u.rating}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
