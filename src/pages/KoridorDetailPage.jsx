import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Icon from "../components/global/Icon";
import Card from "../components/global/Card";
import Skeleton from "../components/global/Skeleton";
import BottomNav from "../components/layout/BottomNav";
import { getKoridorDetail } from "../services/koridorService";
import { getUmkmByKoridor } from "../services/contentService";

const goodStatus = ["Sehat", "Sejuk", "Nyaman", "Tenang", "Rendah"];
const badStatus = ["Panas", "Bising", "Tinggi", "Tidak Sehat", "Kering"];

function statusTone(status) {
  if (goodStatus.includes(status)) return "bg-canopy-100 text-canopy-700";
  if (badStatus.includes(status)) return "bg-alert-600/10 text-alert-600";
  return "bg-ochre-100 text-ochre-600";
}

function SensorRow({ icon, label, value, status }) {
  return (
    <Card className="px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-canopy-700 shrink-0">
          <Icon name={icon} size={18} />
        </span>
        <span className="text-sm text-ink-900">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-data text-sm text-ink-900">{value}</span>
        <span className={`text-[0.65rem] font-medium px-2 py-0.5 rounded-full ${statusTone(status)}`}>
          {status}
        </span>
      </div>
    </Card>
  );
}

export default function KoridorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [koridor, setKoridor] = useState(null);
  const [umkm, setUmkm] = useState([]);

  useEffect(() => {
    setKoridor(null);
    getKoridorDetail(id).then(setKoridor).catch(() => setKoridor(false));
    getUmkmByKoridor(id).then(setUmkm);
  }, [id]);

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
            <h1 className="font-display font-bold text-lg text-ink-900 truncate">
              {koridor ? koridor.formal_name : "Detail Koridor"}
            </h1>
            {koridor && <p className="text-xs text-ink-500 truncate">{koridor.route_label}</p>}
          </div>
        </div>

        {!koridor && koridor !== false && (
          <div className="flex flex-col gap-3 mt-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {koridor === false && <p className="text-ink-500 text-sm mt-6">Koridor tidak ditemukan.</p>}

        {koridor && (
          <>
            <img
              src={koridor.hero_image}
              alt={koridor.formal_name}
              className="w-full h-44 object-cover rounded-2xl mt-4"
            />

            <Card className="p-4 mt-4">
              <h2 className="font-semibold text-ink-900">{koridor.condition_title}</h2>
              <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">{koridor.condition_desc}</p>
            </Card>

            <p className="text-xs font-medium text-ink-500 tracking-wide uppercase mt-6 mb-2.5">
              Data Sensor Lingkungan (IoT)
            </p>
            <div className="flex flex-col gap-2.5">
              <SensorRow icon="sensorChip" label="Kualitas Udara" value={`PM2.5: ${koridor.sensor.pm25}`} status={koridor.sensor.pm25_status} />
              <SensorRow icon="thermometer" label="Suhu" value={`${koridor.sensor.suhu}°C`} status={koridor.sensor.suhu_status} />
              <SensorRow icon="humidity" label="Kelembaban" value={`${koridor.sensor.kelembaban}%`} status={koridor.sensor.kelembaban_status} />
              <SensorRow icon="sound" label="Kebisingan" value={`${koridor.sensor.kebisingan} dB`} status={koridor.sensor.kebisingan_status} />
              <SensorRow icon="weather" label="Indeks UV" value={koridor.sensor.uv_index} status={koridor.sensor.uv_status} />
            </div>

            {umkm.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 mt-6 mb-2.5">
                  <Icon name="store" size={13} className="text-canopy-700" />
                  <p className="text-xs font-medium text-ink-500 tracking-wide uppercase">
                    Rekomendasi UMKM Sekitar
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
                  {umkm.map((u) => (
                    <Link
                      key={u.id}
                      to="/umkm"
                      className="min-w-[168px] bg-white rounded-2xl border border-canopy-800/10 overflow-hidden shrink-0"
                    >
                      <img src={u.image} alt={u.business_name} className="h-24 w-full object-cover" />
                      <div className="p-2.5">
                        <p className="font-medium text-sm text-ink-900 truncate">{u.business_name}</p>
                        <p className="text-xs text-ink-500">{u.business_type}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-ink-500">{u.distance_m}m</span>
                          <span className="flex items-center gap-0.5 text-xs text-ink-700">
                            <Icon name="star" size={11} className="text-ochre-500" />
                            {u.rating}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => navigate("/route")}
              className="w-full mt-6 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2"
            >
              Lihat Rekomendasi Green Route
              <Icon name="arrowRight" size={17} />
            </button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
