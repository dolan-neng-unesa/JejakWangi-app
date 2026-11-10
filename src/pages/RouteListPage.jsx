import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";

// Alternatif rute yang bisa dipilih pengguna sebelum masuk ke peta detail
// (halaman berikutnya di alur: peta + "Pilih Rute" -> detail -> navigasi).
// `preset` menentukan opsi mana yang otomatis terpilih di halaman peta,
// menjembatani daftar rute bernama (A-E) dengan tiga preset generik yang
// sudah ada di sana (tercepat/terhijau/teduh).
const ROUTES = [
  {
    id: "a",
    name: "Route A — Paling Hijau",
    desc: "Melalui jalan dr. Sutomo (Sangat Teduh)",
    umkm: 3,
    score: 5,
    tone: "text-canopy-600",
    preset: "terhijau",
  },
  {
    id: "b",
    name: "Route B — Cukup Hijau",
    desc: "Melalui jalan Wahid Hasyim (Teduh)",
    umkm: 5,
    score: 4,
    tone: "text-canopy-600",
    preset: "terhijau",
  },
  {
    id: "c",
    name: "Route C — Lebih Teduh",
    desc: "Menghindari kemacetan & polusi",
    umkm: 2,
    score: 3,
    tone: "text-orange-500",
    preset: "teduh",
  },
  {
    id: "d",
    name: "Route D — Lebih Nyaman",
    desc: "Melewati jalur pedestrian lebar",
    umkm: 4,
    score: 3,
    tone: "text-ochre-500",
    preset: "teduh",
  },
  {
    id: "e",
    name: "Route E — Jalur Cepat",
    desc: "Terpapar matahari & bising",
    umkm: 1,
    score: 1,
    tone: "text-alert-600",
    preset: "tercepat",
  },
];

function LeafRating({ score, tone, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Skor kenyamanan ${score} dari ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon
          key={i}
          name="leaf"
          size={14}
          strokeWidth={i < score ? 2 : 1.3}
          className={i < score ? tone : "text-canopy-200"}
        />
      ))}
    </div>
  );
}

export default function RouteListPage() {
  const navigate = useNavigate();

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
            <p className="text-xs text-ink-500 mt-0.5">Pilih variasi jalur sesuai preferensi kenyamanan Anda.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mt-5">
          {ROUTES.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/route/pilih?preset=${r.preset}`)}
              className="w-full text-left bg-white rounded-2xl border border-canopy-800/10 p-3.5 flex items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-ink-900">{r.name}</p>
                <p className="text-xs text-ink-500 mt-0.5">{r.desc}</p>
                <p className="text-[0.7rem] text-ink-400 mt-1">🍴{r.umkm} UMKM di rute ini</p>
                <div className="mt-2">
                  <LeafRating score={r.score} tone={r.tone} />
                </div>
              </div>
              <Icon name="chevronLeft" size={16} className="rotate-180 text-ink-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
