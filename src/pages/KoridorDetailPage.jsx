import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Icon from "../components/global/Icon";
import Skeleton from "../components/global/Skeleton";
import BottomNav from "../components/layout/BottomNav";
import { getKoridorDetail } from "../services/koridorService";
import { getUmkmByKoridor } from "../services/contentService";
import SmartImage from "../components/global/SmartImage";
import EcoCoach from "../components/global/EcoCoach";
import maskot from "../assets/pages/koridor/maskot.png";

const goodStatus = ["Sehat", "Sejuk", "Nyaman", "Tenang", "Rendah"];
const badStatus = ["Panas", "Bising", "Tinggi", "Tidak Sehat", "Kering"];

function statusTone(status) {
  if (goodStatus.includes(status)) return "bg-canopy-100 text-canopy-700";
  if (badStatus.includes(status)) return "bg-alert-600/10 text-alert-600";
  return "bg-ochre-100 text-ochre-600";
}

// Faktor emisi rata-rata kendaraan bermotor (kg CO2 per km) — dasar kalkulator penghematan.
const CO2_PER_KM = 0.26;
const DISTANCE_OPTIONS = [0.5, 1, 1.5, 2, 3, 5];
const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const round = (n, digits) => Math.round(n * 10 ** digits) / 10 ** digits;

function Panel({ className = "", children }) {
  return (
    <div className={`bg-white border border-canopy-800/10 rounded-2xl shadow-[0_1px_2px_rgba(22,33,26,0.04)] ${className}`}>
      {children}
    </div>
  );
}

function PanelHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="h-10 w-10 rounded-xl bg-canopy-100 text-canopy-700 flex items-center justify-center shrink-0">
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <h2 style={{ fontFamily: "var(--font-body)" }} className="font-semibold text-ink-900 leading-tight">{title}</h2>
        <p className="text-xs text-ink-500 mt-0.5 leading-snug">{subtitle}</p>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, unit }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-canopy-100/60 px-2.5 py-2.5">
      <p className="flex items-center gap-1 text-[0.6rem] font-semibold tracking-wide uppercase text-canopy-700 whitespace-nowrap">
        <Icon name={icon} size={13} />
        {label}
      </p>
      <p className="mt-1 text-ink-900">
        <span className="font-bold text-xl">{value}</span>
        <span className="text-xs text-ink-500 ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

/** Pil bergaya desain, tapi memakai <select> asli supaya mudah dipakai di layar sentuh & pembaca layar. */
function PillSelect({ id, label, value, options, format, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="flex items-center gap-3 text-sm font-medium text-ink-900">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none text-center font-semibold text-sm text-ink-900 bg-sand-100 border border-canopy-800/10 rounded-xl px-4 py-1.5 min-w-[4.5rem] cursor-pointer focus:outline-none focus:border-canopy-700"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {format(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function CarbonCalculator({ km, setKm, perWeek, setPerWeek }) {
  const weekly = round(km * perWeek * CO2_PER_KM, 2);
  return (
    <Panel className="p-4 mt-4">
      <PanelHeader
        icon="calculator"
        title="Kalkulator Penghematan CO₂"
        subtitle="Beralih ke jalan kaki di koridor ini untuk mengurangi emisi karbon."
      />
      <div className="mt-3 border-t border-canopy-800/10 pt-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-lg bg-canopy-100 text-canopy-700 flex items-center justify-center shrink-0">
            <Icon name="footprints" size={16} />
          </span>
          <div className="flex-1">
            <PillSelect id="calc-km" label="Jarak Jalan Kaki" value={km} options={DISTANCE_OPTIONS} format={(o) => `${o} km`} onChange={setKm} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-lg bg-canopy-100 text-canopy-700 flex items-center justify-center shrink-0">
            <Icon name="calendar" size={16} />
          </span>
          <div className="flex-1">
            <PillSelect id="calc-freq" label="Frekuensi per Minggu" value={perWeek} options={FREQUENCY_OPTIONS} format={(o) => `${o}×`} onChange={setPerWeek} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-canopy-600 to-canopy-800 text-white px-4 py-3.5" aria-live="polite">
        <p className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-white/75">Estimasi Penghematan CO₂</p>
        <p className="mt-1.5">
          <span className="font-bold text-3xl">{weekly.toFixed(2)}</span>
          <span className="text-sm text-white/85 ml-1">kg CO₂/minggu</span>
        </p>
        <p className="text-xs text-white/70 mt-1">
          {km} km × {perWeek} kali × {CO2_PER_KM} kg CO₂/km
        </p>
      </div>
      <p className="text-[0.7rem] text-ink-500 mt-3 leading-snug">
        Nilai merupakan estimasi berdasarkan rata-rata emisi kendaraan. Bukan pengukuran terverifikasi.
      </p>
    </Panel>
  );
}

/** "Contoh Perhitungan Emisi": kendaraan (motor, mobil) dan AC toko per hari, plus rasio serapan pohon. */
function EmissionExamples({ cb }) {
  const kend = cb.rincian?.kendaraan ?? [];
  const motor = kend.find((k) => k.jenis === "motor");
  const mobil = kend.find((k) => k.jenis === "mobil");
  const unitAc = (cb.rincian?.ac ?? []).reduce((n, t) => n + t.unitAC, 0);
  const jumlahToko = cb.rincian?.ac?.length ?? 0;
  const pohon = (cb.rincian?.pohon ?? []).reduce((n, p) => n + p.jumlah, 0);
  const tiles = [
    motor && { icon: "motor", label: "Motor", value: `±${Math.round(motor.jumlahPerHari).toLocaleString("id-ID")}/hari`, kg: motor.kgPerHari },
    mobil && { icon: "mobil", label: "Mobil", value: `±${Math.round(mobil.jumlahPerHari).toLocaleString("id-ID")}/hari`, kg: mobil.kgPerHari },
    jumlahToko > 0 && { icon: "store", label: "AC Toko", value: `${jumlahToko} toko, ${unitAc} AC`, kg: cb.emisiAC },
  ].filter(Boolean);
  const terbesar = tiles.length ? tiles.reduce((a, b) => (b.kg > a.kg ? b : a)) : null;
  return (
    <>
      <p className="text-center text-sm font-semibold text-ink-900 mt-4">Contoh Perhitungan Emisi</p>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-canopy-800/10 bg-sand-50 px-2 py-3 text-center">
            <span className="text-canopy-700 flex justify-center"><Icon name={t.icon} size={22} /></span>
            <p className="text-xs font-semibold text-ink-900 mt-1">{t.label}</p>
            <p className="text-[0.65rem] text-ink-500">{t.value}</p>
            <p className="text-[0.65rem] font-data text-ink-700 mt-0.5">{t.kg.toLocaleString("id-ID")} kg CO₂/hari</p>
          </div>
        ))}
      </div>
      {terbesar && (
        <p className="mt-2 text-xs rounded-lg bg-ochre-100 text-ochre-600 px-3 py-2">
          {terbesar.label} menyumbang emisi terbesar di koridor ini.
        </p>
      )}
      <div className="grid grid-cols-2 mt-3 rounded-xl overflow-hidden border border-canopy-800/10 text-center">
        <div className="py-3 bg-white">
          <p className="font-bold text-xl text-ink-900">{pohon.toLocaleString("id-ID")} <span className="text-sm font-medium text-ink-500">Pohon</span></p>
          <p className="text-[0.65rem] text-ink-500">±{Math.round(cb.serapanPohon * 365).toLocaleString("id-ID")} kg CO₂/tahun</p>
        </div>
        <div className="py-3 bg-canopy-100">
          <p className="font-bold text-xl text-canopy-700">≈ {cb.rasioSerapanPersen != null ? `${cb.rasioSerapanPersen}%` : "–"}</p>
          <p className="text-[0.65rem] text-ink-500">Rasio Serapan</p>
        </div>
      </div>
      {cb.peringatan?.length > 0 && (
        <p className="text-[0.7rem] text-ink-500 mt-2 leading-snug">Estimasi awal: {cb.peringatan[0]}.</p>
      )}
    </>
  );
}

function SensorRow({ icon, label, value, status }) {
  return (
    <div className="bg-white border border-canopy-800/10 rounded-xl px-3.5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-canopy-700 shrink-0">
          <Icon name={icon} size={18} />
        </span>
        <span className="text-sm text-ink-900">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-sm text-ink-900">{value}</span>
        <span className={`text-[0.65rem] font-semibold uppercase tracking-wide px-2 py-1 rounded-md ${statusTone(status)}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

export default function KoridorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [koridor, setKoridor] = useState(null);
  const [umkm, setUmkm] = useState([]);
  const [km, setKm] = useState(1.5);
  const [perWeek, setPerWeek] = useState(5);

  useEffect(() => {
    // `cancelled` mencegah balasan koridor lama menimpa koridor baru bila id berubah
    // sebelum request sebelumnya selesai (atau halaman sudah ditinggalkan).
    let cancelled = false;
    setKoridor(null);
    setUmkm([]);
    getKoridorDetail(id)
      .then((data) => !cancelled && setKoridor(data))
      .catch(() => !cancelled && setKoridor(false));
    getUmkmByKoridor(id)
      .then((list) => !cancelled && setUmkm(list))
      .catch(() => !cancelled && setUmkm([]));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-10 w-10 rounded-full bg-sand-100 border border-canopy-800/10 flex items-center justify-center shrink-0"
          >
            <Icon name="chevronLeft" size={20} className="text-ink-900" />
          </button>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 style={{ fontFamily: "var(--font-body)" }} className="font-bold text-xl text-ink-900 truncate">
              {koridor ? koridor.formal_name : "Detail Koridor"}
            </h1>
            {koridor && <p className="text-xs text-ink-500 truncate mt-0.5">{koridor.route_label}</p>}
          </div>
          <img src={maskot} alt="" aria-hidden="true" className="h-14 w-12 object-contain shrink-0 -mt-1" />
        </div>

        {koridor && (
          <div className="flex justify-end -mt-1">
            <p className="max-w-[12.5rem] bg-white rounded-xl border border-canopy-800/10 shadow-[0_2px_8px_-2px_rgba(22,33,26,0.15)] px-3 py-2 text-xs text-ink-900 leading-snug">
              dengan berjalan {km} km kamu menghemat {round(km * CO2_PER_KM, 1).toFixed(1)} kg co2
            </p>
          </div>
        )}

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
            <SmartImage
              src={koridor.hero_image}
              alt={koridor.formal_name}
              className="w-full h-40 object-cover rounded-2xl mt-4"
            />

            <Panel className="p-4 mt-4">
              <PanelHeader icon="leaf" title={koridor.condition_title} subtitle="Estimasi kontribusi lingkungan" />
              {(koridor.oxygen_kg_day != null || koridor.co2_reduced_kg_day != null) && (
                <div className="flex gap-3 mt-3">
                  {koridor.oxygen_kg_day != null && (
                    <StatTile icon="wind" label="Oksigen dihasilkan" value={koridor.oxygen_kg_day} unit="kg/hari" />
                  )}
                  {koridor.co2_reduced_kg_day != null && (
                    <StatTile icon="leaf" label="CO₂ tereduksi" value={koridor.co2_reduced_kg_day} unit="kg/hari" />
                  )}
                </div>
              )}
              {koridor.carbon_balance && <EmissionExamples cb={koridor.carbon_balance} />}
              <p className="text-sm text-ink-500 mt-3 pt-3 border-t border-canopy-800/10 leading-relaxed">
                {koridor.condition_desc}
              </p>
            </Panel>

            <EcoCoach page="koridor" className="mt-4" />
            <CarbonCalculator km={km} setKm={setKm} perWeek={perWeek} setPerWeek={setPerWeek} />

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
                      className="min-w-[15rem] bg-white rounded-2xl border border-canopy-800/10 p-2.5 shrink-0"
                    >
                      <SmartImage src={u.image} alt={u.business_name} className="h-24 w-full object-cover rounded-xl" />
                      <div className="pt-2.5 px-0.5">
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
              onClick={() => navigate(`/route?koridor=${koridor.id}`)}
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
