// Penyimpanan perjalanan Jejak Wangi di perangkat (localStorage): moda dari scan QR awal, riwayat aktivitas,
// kupon, dan cooldown klaim. Bekerja tanpa login/backend; bila login & server terjangkau, journeySync.js
// menjadikan server sumber kebenaran untuk kupon, cooldown, poin, dan peringkat.
import { useSyncExternalStore } from "react";
import { KUPON_COOLDOWN_HARI, KUPON_MERCHANT, TIERS, monthKeyWIB, statusTier } from "../lib/journey";

const KEY = "svarga_journey_v2";
const EVENT = "svarga-journey-change";

const kosong = () => ({
  transport: null, // 'motor' | 'mobil' | 'jalan' | 'sepeda'
  koridorId: null,
  scanAt: null,
  activities: [],
  vouchers: [],
  cooldowns: {}, // tier → ISO; cooldown lokal (klaim saat offline/tanpa login)
  server: null, // { points, monthKm, rank, badge, cooldowns } dari server bila tersinkron
});

let cache = null;

function read() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...kosong(), ...JSON.parse(raw) } : kosong();
  } catch {
    cache = kosong();
  }
  return cache;
}

function write(next) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage penuh/diblokir: state tetap hidup selama tab terbuka.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  function onStorage(e) {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  }
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const getJourney = read;

/** Hook reaktif: komponen otomatis render ulang saat state perjalanan berubah. */
export function useJourney() {
  return useSyncExternalStore(subscribe, read, read);
}

const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nyata = (a) => !a.simulasi;

/** Total km seumur hidup (non-simulasi tidak dibedakan di tampilan profil lama; simulasi dikecualikan). */
export function totalKm(j = read()) {
  return j.activities.filter(nyata).reduce((s, a) => s + a.distanceM, 0) / 1000;
}

export function totalCo2(j = read()) {
  return j.activities.filter(nyata).reduce((s, a) => s + (a.co2Kg ?? 0), 0);
}

export function totalPoin(j = read()) {
  const lokal = (belumSinkron) =>
    j.activities.filter((a) => nyata(a) && (!belumSinkron || !a.synced)).reduce((s, a) => s + (a.poin ?? 0), 0);
  // Poin server sudah memuat aktivitas tersinkron; yang belum tersinkron ditambahkan agar tidak "turun" saat offline.
  return j.server?.points != null ? j.server.points + lokal(true) : lokal(false);
}

/** Km bulan ini (WIB). Dengan data server: km server + aktivitas lokal yang belum tersinkron. */
export function monthKm(j = read(), now = new Date()) {
  const key = monthKeyWIB(now);
  const bulanIni = (a) => nyata(a) && monthKeyWIB(a.startedAt) === key;
  const lokal = (belumSinkron) =>
    j.activities.filter((a) => bulanIni(a) && (!belumSinkron || !a.synced)).reduce((s, a) => s + a.distanceM, 0) / 1000;
  return j.server?.monthKm != null ? j.server.monthKm + lokal(true) : lokal(false);
}

/** Cooldown efektif per tingkat: yang paling akhir antara data lokal dan server. */
export function cooldownsEfektif(j = read()) {
  const out = { ...j.cooldowns };
  for (const [t, iso] of Object.entries(j.server?.cooldowns ?? {})) {
    if (!out[t] || new Date(iso) > new Date(out[t])) out[t] = iso;
  }
  return out;
}

export function tierStatuses(j = read(), now = new Date()) {
  return statusTier(monthKm(j, now), cooldownsEfektif(j), now.getTime());
}

/** Hasil scan QR awal koridor + jawaban "kamu kesini naik apa?". */
export function setArrival({ transport, koridorId }) {
  write({ ...read(), transport, koridorId: koridorId ?? read().koridorId, scanAt: new Date().toISOString() });
}

export function setKoridor(koridorId) {
  write({ ...read(), koridorId });
}

/** Simpan aktivitas selesai. Kupon TIDAK otomatis: pengguna mengklaimnya sendiri di halaman Misi. */
export function saveActivity(activity) {
  const j = read();
  const act = { id: uid("act"), ...activity };
  write({ ...j, activities: [act, ...j.activities] });
  return { activity: act };
}

export function getActivity(id) {
  return read().activities.find((a) => a.id === id) ?? null;
}

/**
 * Klaim kupon secara LOKAL (dipakai saat belum login / backend tidak aktif).
 * Mengembalikan { ok, voucher } atau { ok:false, error }.
 */
export function claimTierLocal(tier, now = new Date()) {
  const j = read();
  const st = tierStatuses(j, now).find((t) => t.tier === tier);
  if (!st) return { ok: false, error: "Tingkat kupon tidak dikenal." };
  if (st.status === "cooldown") return { ok: false, error: `Kupon ${st.nama} masih cooldown ${st.sisaHariCooldown} hari lagi.` };
  if (st.status === "terkunci") return { ok: false, error: `Jalan kaki bulan ini belum mencapai ${st.targetKm} km.` };

  const voucher = {
    id: uid("vch"),
    code: `JW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    title: st.nama,
    merchant: KUPON_MERCHANT,
    desc: st.hadiah,
    tier,
    expiresAt: new Date(now.getTime() + st.berlakuHari * 86400000).toISOString(),
    status: "tersedia",
    source: `tier-${tier}`,
  };
  write({
    ...j,
    vouchers: [voucher, ...j.vouchers],
    cooldowns: { ...j.cooldowns, [tier]: new Date(now.getTime() + KUPON_COOLDOWN_HARI * 86400000).toISOString() },
  });
  return { ok: true, voucher };
}

export function markVoucherUsed(id) {
  const j = read();
  write({ ...j, vouchers: j.vouchers.map((v) => (v.id === id ? { ...v, status: "digunakan", usedAt: new Date().toISOString() } : v)) });
}

/** Status efektif kupon: tersedia yang lewat masa berlaku dianggap kedaluwarsa. */
export function voucherStatus(v, now = Date.now()) {
  if (v.status === "digunakan") return "digunakan";
  return Date.parse(v.expiresAt) < now ? "kedaluwarsa" : "tersedia";
}

/** Tandai aktivitas sudah diverifikasi lewat scan QR di titik akhir koridor. */
export function markVerified(id) {
  const j = read();
  write({ ...j, activities: j.activities.map((a) => (a.id === id ? { ...a, verified: true } : a)) });
}

export function markSynced(id) {
  const j = read();
  write({ ...j, activities: j.activities.map((a) => (a.id === id ? { ...a, synced: true } : a)) });
}

/** Ubah kupon dari API (snake_case) ke bentuk yang dipakai UI. */
export function fromServerVoucher(v) {
  return {
    id: `srv_${v.id}`,
    serverId: v.id,
    code: v.code,
    title: v.title,
    merchant: v.merchant,
    desc: v.description ?? "",
    tier: v.tier ?? null,
    expiresAt: v.expires_at,
    status: v.status === "digunakan" ? "digunakan" : "tersedia",
    source: v.source,
  };
}

/**
 * Terapkan kondisi resmi dari server. Kupon lokal tanpa serverId (diklaim sebelum login) dipertahankan
 * berdampingan; cooldown & progres server dipakai bersama data lokal lewat monthKm/cooldownsEfektif.
 */
export function applyServerState({ vouchers, summary, tiers }) {
  const j = read();
  const cooldowns = {};
  for (const t of tiers ?? []) if (t.cooldown_until) cooldowns[t.tier] = t.cooldown_until;
  write({
    ...j,
    vouchers: [...vouchers.map(fromServerVoucher), ...j.vouchers.filter((v) => !v.serverId)],
    server: {
      points: summary?.points ?? j.server?.points ?? null,
      monthKm: summary?.bulan_km ?? j.server?.monthKm ?? null,
      rank: summary?.rank_bulan ?? null,
      badge: summary?.badge ?? null,
      cooldowns,
    },
  });
}

/** Cooldown server berubah (mis. dipangkas QR tempat sendiri) tanpa menarik ulang semuanya. */
export function setServerCooldowns(list) {
  const j = read();
  const cooldowns = { ...(j.server?.cooldowns ?? {}) };
  for (const c of list) cooldowns[c.tier] = c.cooldown_until;
  write({ ...j, server: { ...(j.server ?? { points: null, monthKm: null, rank: null, badge: null }), cooldowns } });
}

export function resetJourney() {
  write(kosong());
}

export { TIERS };
