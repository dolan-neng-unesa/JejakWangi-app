// Jejak Wangi — perhitungan perjalanan (murni, tanpa efek samping, mudah diuji).
//
// Faktor emisi diturunkan dari modul neraca karbon yang sama dengan halaman detail
// koridor (L/100 km × faktor BBM), supaya angka kalkulator & hasil aktivitas konsisten.
import { JENIS_KENDARAAN, FAKTOR_EMISI_BBM } from "./carbonBalance";

/** Moda "kamu kesini naik apa?" pada pop-up setelah scan QR awal. */
export const MODA = {
  motor: { label: "Motor", icon: "motor" },
  mobil: { label: "Mobil", icon: "mobil" },
  jalan: { label: "Jalan kaki", icon: "footprints" },
  sepeda: { label: "Sepeda pancal", icon: "bike" },
};

/** kg CO₂ per km untuk kendaraan bermesin; jalan/sepeda = 0. */
export function emisiPerKm(moda) {
  const k = JENIS_KENDARAAN[moda];
  if (!k) return 0;
  return (k.literPer100km / 100) * FAKTOR_EMISI_BBM[k.bbm];
}

/** Asumsi harga BBM (Rp/liter, setara Pertalite). Ubah di sini bila harga berubah. */
export const HARGA_BBM_PER_LITER = 10000;
/** Estimasi kalori jalan kaki per km (rata-rata orang dewasa). */
export const KKAL_PER_KM = 70;
/** Poin hijau per km. */
export const POIN_PER_KM = 30;

// ---------------------------------------------------------------------------------------------
// Gamifikasi (HARUS sama dengan jejak-wangi-backend/config/jejakwangi.php; server tetap sumber kebenaran).
// ---------------------------------------------------------------------------------------------

/** Kupon bertingkat. Progres = total km jalan kaki (non-simulasi) di bulan kalender berjalan (WIB). */
export const TIERS = [
  { tier: 1, kode: "pelari-mager", nama: "Pelari Mager", targetKm: 1, hadiah: "Air Mineral 1 pcs", berlakuHari: 7 },
  { tier: 2, kode: "pelari-niat", nama: "Pelari Niat", targetKm: 3, hadiah: "Air Isotonik 1 pcs", berlakuHari: 7 },
  { tier: 3, kode: "pelari-kalcer", nama: "Pelari Kalcer", targetKm: 5, hadiah: "Air Isotonik 1 pcs + Jajan 1 pcs", berlakuHari: 14 },
];
export const KUPON_COOLDOWN_HARI = 30;
export const KUPON_MERCHANT = "UMKM Kuliner Lokal";
export const BYO_KURANGI_HARI = 1;
export const LEADERBOARD_MAKS = 100;

/** Badge leaderboard bulanan (tingkat tertinggi yang terpenuhi). */
export const BADGES = {
  "top-1": { label: "Top 1", warna: "bg-ochre-100 text-ochre-600" },
  "top-3": { label: "Top 3", warna: "bg-canopy-100 text-canopy-800" },
  "top-5": { label: "Top 5", warna: "bg-canopy-100 text-canopy-700" },
  "top-10": { label: "Top 10", warna: "bg-sand-100 text-ink-700" },
};

const WIB_OFFSET_MS = 7 * 3600 * 1000;

/** Kunci bulan kalender zona Jakarta, mis. "2026-11". Tanpa bergantung zona waktu perangkat. */
export function monthKeyWIB(date) {
  const d = new Date(new Date(date).getTime() + WIB_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Awal bulan depan (WIB) sebagai Date — kapan progres & leaderboard reset. */
export function resetBulanWIB(now = new Date()) {
  const d = new Date(now.getTime() + WIB_OFFSET_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - WIB_OFFSET_MS);
}

/** Sisa hari (dibulatkan ke atas) sampai `until`; 0 bila sudah lewat. */
export function sisaHari(until, now = Date.now()) {
  const ms = new Date(until).getTime() - now;
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
}

/**
 * Status tiap tingkat kupon: terkunci | bisa_diklaim | cooldown.
 * @param {number} monthKm  progres km bulan ini
 * @param {Record<number,string>} cooldowns  tier → ISO waktu boleh klaim lagi
 */
export function statusTier(monthKm, cooldowns = {}, now = Date.now()) {
  return TIERS.map((t) => {
    const until = cooldowns[t.tier];
    const cooldown = until && new Date(until).getTime() > now;
    return {
      ...t,
      progressKm: Math.min(monthKm, t.targetKm),
      status: cooldown ? "cooldown" : monthKm >= t.targetKm ? "bisa_diklaim" : "terkunci",
      cooldownUntil: cooldown ? until : null,
      sisaHariCooldown: cooldown ? sisaHari(until, now) : 0,
    };
  });
}

/** Tingkat berikutnya yang paling dekat dicapai (untuk Eco-Coach & ringkasan); null bila semua sudah di cooldown. */
export function tierBerikutnya(statuses) {
  return statuses.find((t) => t.status === "terkunci") ?? statuses.find((t) => t.status === "bisa_diklaim") ?? null;
}

/**
 * Moda pembanding. Orang yang sudah jalan/bersepeda tidak "menghindari" apa pun terhadap
 * kebiasaannya sendiri, jadi pembandingnya motor (kendaraan paling umum) dan itu dinyatakan di UI.
 */
export function modaPembanding(moda) {
  return moda === "mobil" ? "mobil" : "motor";
}

/** Emisi terhindar (kg), hemat BBM (liter) dan rupiah untuk jarak tempuh jalan kaki. */
export function hitungDampak(distanceM, moda) {
  const km = Math.max(0, distanceM) / 1000;
  const ref = modaPembanding(moda);
  const k = JENIS_KENDARAAN[ref];
  const liter = (k.literPer100km / 100) * km;
  const co2Kg = km * emisiPerKm(ref);
  return {
    km,
    pembanding: ref,
    co2Kg,
    liter,
    rupiah: Math.round(liter * HARGA_BBM_PER_LITER),
    kkal: Math.round(km * KKAL_PER_KM),
    poin: Math.round(km * POIN_PER_KM),
  };
}

export function formatDurasi(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(r).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatRupiah(n) {
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

/** 5,2 km → "5,2"; id-ID memakai koma desimal. */
export function formatKm(m, digits = 1) {
  return (Math.max(0, m) / 1000).toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatCo2(kg) {
  return kg < 1 ? `${Math.round(kg * 1000)} g CO₂` : `${kg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg CO₂`;
}

/** Level pejalan dari total poin (250 poin per level, mulai level 1). */
export function levelDariPoin(poin) {
  const level = Math.floor(poin / 250) + 1;
  const names = ["Pemula", "Pejalan Hijau", "Penjelajah Koridor", "Penjaga Kanopi", "Duta Wangi"];
  return { level, nama: names[Math.min(names.length - 1, Math.floor(level / 2))], sisa: 250 - (poin % 250) };
}

/**
 * Alur sistem: setelah scan QR koridor, cek ISPU dulu. Kalau tidak sehat, sarankan rute/waktu lain
 * (bukan memblokir). `ispu` = hasil calcIspu() atau null bila belum ada data.
 */
export function saranIspu(ispu) {
  if (!ispu || ispu.value == null) return { sehat: true, pesan: null };
  if (ispu.value <= 50) return { sehat: true, pesan: null };
  if (ispu.value <= 100) {
    return { sehat: true, pesan: "Udara sedang. Aman berjalan, kurangi lari intens di dekat jalan raya." };
  }
  return {
    sehat: false,
    pesan: "Udara kurang sehat saat ini. Coba rute yang lebih teduh atau jalan di pagi/sore hari.",
  };
}

/** Isi QR yang dikenali: "…/q/3", "jejakwangi:koridor:3", atau angka saja. null bila tidak dikenali. */
export function parseKoridorFromQr(text) {
  if (!text) return null;
  const str = String(text).trim();
  const m = str.match(/(?:\/q\/|koridor[:/=])(\d+)/i) ?? str.match(/^(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** Isi QR kasir "membawa tempat sendiri": "jejakwangi:byo:<token>" atau token polos. null bila tidak dikenali. */
export function parseByoToken(text) {
  if (!text) return null;
  const str = String(text).trim();
  const m = str.match(/^jejakwangi:byo:([A-Za-z0-9]{20,64})$/) ?? str.match(/^([A-Za-z0-9]{20,64})$/);
  return m ? m[1] : null;
}
