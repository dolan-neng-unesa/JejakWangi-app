// Sinkronisasi Jejak Wangi ke Laravel. Pola local-first: UI selalu bekerja dari journeyStore;
// bila pengguna login & server terjangkau, aktivitas didorong ke /activities dan kupon, cooldown, poin,
// serta peringkat ditarik dari server (server menghitung ulang dampak — klien tidak dipercaya).
import { apiRequest, isLaravelAvailable } from "./laravelClient";
import { getToken } from "./sessionStore";
import { applyServerState, claimTierLocal, getJourney, markSynced, setServerCooldowns } from "./journeyStore";

export const canSync = () => isLaravelAvailable() && Boolean(getToken());

async function pushActivity(a) {
  await apiRequest("/activities", {
    method: "POST",
    auth: true,
    body: {
      client_id: a.id,
      koridor_id: a.koridorId ?? null,
      transport: a.transport ?? null,
      distance_m: a.distanceM,
      duration_sec: Math.max(1, a.durationSec),
      started_at: a.startedAt,
      is_simulated: Boolean(a.simulasi),
    },
  });
  markSynced(a.id);
}

/** Dorong aktivitas yang belum tersinkron, lalu tarik kupon, cooldown, poin, dan peringkat. Tidak pernah melempar. */
export async function syncJourney() {
  if (!canSync()) return { ok: false };
  try {
    for (const a of getJourney().activities.filter((x) => !x.synced).reverse()) {
      try {
        await pushActivity(a);
      } catch (err) {
        // 422 = ditolak server (mis. kecepatan tak wajar): tandai selesai agar tidak dicoba terus.
        if (err?.status === 422) markSynced(a.id);
        else throw err;
      }
    }
    const [v, s, t] = await Promise.all([
      apiRequest("/vouchers", { auth: true }),
      apiRequest("/me/summary", { auth: true }),
      apiRequest("/vouchers/tiers", { auth: true }),
    ]);
    applyServerState({ vouchers: v?.data ?? [], summary: s?.data ?? null, tiers: t?.data ?? [] });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Klaim kupon: lewat server bila login & terhubung, kalau tidak secara lokal. */
export async function klaimKupon(tier) {
  if (!canSync()) return claimTierLocal(tier);
  try {
    await syncJourney(); // pastikan aktivitas terbaru sudah di server sebelum klaim
    const res = await apiRequest("/vouchers/claim", { method: "POST", auth: true, body: { tier } });
    await syncJourney();
    return { ok: true, voucher: res?.data ?? null };
  } catch (err) {
    await syncJourney();
    return { ok: false, error: err?.friendlyMessage ?? err?.message ?? "Gagal mengklaim kupon." };
  }
}

export async function redeemOnServer(serverId) {
  if (!canSync() || serverId == null) return null;
  try {
    return await apiRequest(`/vouchers/${serverId}/redeem`, { method: "POST", auth: true });
  } catch {
    return null;
  }
}

/** Leaderboard bulan ini: { rows, me, period } atau null bila server tidak terjangkau. */
export async function fetchLeaderboard() {
  if (!isLaravelAvailable()) return null;
  try {
    const res = await apiRequest("/leaderboard", { auth: "optional" });
    return { rows: res?.data ?? [], me: res?.me ?? null, period: res?.period ?? null };
  } catch {
    return null;
  }
}

/** Pelanggan memindai QR kasir "membawa tempat sendiri". */
export async function konfirmasiTempatSendiri(token) {
  if (!canSync()) return { ok: false, error: "Masuk ke akunmu dan pastikan terhubung ke server untuk memakai fitur ini." };
  try {
    const res = await apiRequest("/byo/confirm", { method: "POST", auth: true, body: { token } });
    if (res?.applied) setServerCooldowns(res?.data?.cooldowns ?? []);
    return { ok: true, applied: Boolean(res?.applied), message: res?.message, cooldowns: res?.data?.cooldowns ?? [] };
  } catch (err) {
    return { ok: false, error: err?.friendlyMessage ?? err?.message ?? "QR tidak dapat diproses." };
  }
}

/** Kasir menerbitkan QR sekali pakai. */
export async function terbitkanQrTempatSendiri() {
  if (!canSync()) return { ok: false, error: "Masuk dengan akun kasir dan pastikan terhubung ke server." };
  try {
    const res = await apiRequest("/byo/token", { method: "POST", auth: true });
    return { ok: true, ...res.data };
  } catch (err) {
    return { ok: false, error: err?.friendlyMessage ?? err?.message ?? "Gagal membuat QR." };
  }
}
