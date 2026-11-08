import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Modul memakai import.meta.env saat dimuat → muat ulang per tes dengan env yang dikunci.
async function load() {
  vi.resetModules();
  vi.stubEnv("VITE_LARAVEL_API_URL", "http://api.test/api");
  const session = await import("../services/sessionStore");
  const store = await import("../services/journeyStore");
  const sync = await import("../services/journeySync");
  return { session, store, sync };
}

const json = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
const act = (m) => ({ startedAt: new Date().toISOString(), durationSec: 1800, distanceM: m, poin: Math.round(m / 30), co2Kg: 0.1, transport: "motor", koridorId: 1 });
const hariDepan = (n) => new Date(Date.now() + n * 864e5).toISOString();
const voucher = (o = {}) => ({ id: 9, code: "JW-SRV123", title: "Pelari Mager", merchant: "UMKM", description: "Air Mineral 1 pcs", tier: 1, source: "tier-1", status: "tersedia", expires_at: hariDepan(7), ...o });

/** Router fetch palsu untuk endpoint Jejak Wangi. */
function fakeApi(over = {}) {
  const calls = [];
  vi.spyOn(globalThis, "fetch").mockImplementation((url, init) => {
    const path = String(url).replace("http://api.test/api", "");
    const method = init?.method ?? "GET";
    calls.push({ path, method, body: init?.body ? JSON.parse(init.body) : null, auth: init?.headers?.Authorization });
    const key = `${method} ${path}`;
    if (over[key]) return over[key]();
    if (key === "POST /activities") return json({ data: {} }, 201);
    if (key === "GET /vouchers") return json({ data: [] });
    if (key === "GET /me/summary") return json({ data: { points: 0, bulan_km: 0, rank_bulan: null, badge: null } });
    if (key === "GET /vouchers/tiers") return json({ data: [] });
    return json({ message: "tak dikenal" }, 404);
  });
  return calls;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("journeySync", () => {
  it("tanpa token tidak memanggil server", async () => {
    const { sync, store } = await load();
    const spy = vi.spyOn(globalThis, "fetch");
    store.resetJourney();
    store.saveActivity(act(1000));
    expect((await sync.syncJourney()).ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("mendorong aktivitas dengan client_id, lalu memakai kupon, poin, progres, dan badge dari server", async () => {
    const { sync, store, session } = await load();
    session.writeSession({ id: 1, name: "Levi" }, "tok");
    store.resetJourney();
    const { activity } = store.saveActivity(act(2000));
    const calls = fakeApi({
      "GET /vouchers": () => json({ data: [voucher()] }),
      "GET /me/summary": () => json({ data: { points: 306, bulan_km: 2, rank_bulan: 1, badge: { kode: "top-1", label: "Top 1" } } }),
    });

    expect((await sync.syncJourney()).ok).toBe(true);
    const post = calls.find((c) => c.method === "POST");
    expect(post.path).toBe("/activities");
    expect(post.body).toMatchObject({ client_id: activity.id, distance_m: 2000, transport: "motor", koridor_id: 1 });
    expect(post.auth).toBe("Bearer tok");

    const j = store.getJourney();
    expect(j.activities[0].synced).toBe(true);
    expect(j.vouchers[0]).toMatchObject({ code: "JW-SRV123", serverId: 9, tier: 1 });
    expect(j.server).toMatchObject({ rank: 1, badge: { kode: "top-1" } });
    expect(store.totalPoin()).toBe(306);
    expect(store.monthKm()).toBeCloseTo(2); // km server; aktivitas tersinkron tidak dihitung dua kali
  });

  it("cooldown dari server menimpa status tingkat, dan aktivitas offline tetap menambah progres", async () => {
    const { sync, store, session } = await load();
    session.writeSession({ id: 1 }, "tok");
    store.resetJourney();
    fakeApi({
      "GET /vouchers/tiers": () => json({ data: [{ tier: 1, cooldown_until: hariDepan(12) }] }),
      "GET /me/summary": () => json({ data: { points: 0, bulan_km: 1.5, rank_bulan: null, badge: null } }),
    });
    await sync.syncJourney();
    let st = store.tierStatuses();
    expect(st[0]).toMatchObject({ status: "cooldown", sisaHariCooldown: 12 });
    expect(st[1].status).toBe("terkunci"); // 1,5 km < 3 km

    // aktivitas baru yang belum tersinkron ikut dihitung → 1,5 + 1,6 = 3,1 km
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    store.saveActivity(act(1600));
    expect(store.monthKm()).toBeCloseTo(3.1);
    st = store.tierStatuses();
    expect(st[1].status).toBe("bisa_diklaim");
  });

  it("klaim lewat server: POST /vouchers/claim lalu sinkron ulang", async () => {
    const { sync, store, session } = await load();
    session.writeSession({ id: 1 }, "tok");
    store.resetJourney();
    let diklaim = false;
    const calls = fakeApi({
      "POST /vouchers/claim": () => { diklaim = true; return json({ data: voucher() }, 201); },
      "GET /vouchers": () => json({ data: diklaim ? [voucher()] : [] }),
    });
    const r = await sync.klaimKupon(1);
    expect(r.ok).toBe(true);
    expect(calls.find((c) => c.path === "/vouchers/claim").body).toEqual({ tier: 1 });
    expect(store.getJourney().vouchers[0].code).toBe("JW-SRV123");
  });

  it("klaim ditolak server (cooldown) → pesan galat server sampai ke UI", async () => {
    const { sync, store, session } = await load();
    session.writeSession({ id: 1 }, "tok");
    store.resetJourney();
    fakeApi({ "POST /vouchers/claim": () => json({ message: "Kupon Pelari Mager masih cooldown." }, 422) });
    const r = await sync.klaimKupon(1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/cooldown/i);
  });

  it("tanpa login klaim jatuh ke penyimpanan lokal", async () => {
    const { sync, store } = await load();
    store.resetJourney();
    store.saveActivity(act(1200));
    const spy = vi.spyOn(globalThis, "fetch");
    const r = await sync.klaimKupon(1);
    expect(r.ok).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    expect(store.getJourney().vouchers).toHaveLength(1);
  });

  it("ditolak server (422) → ditandai selesai, tidak diulang terus", async () => {
    const { sync, store, session } = await load();
    session.writeSession({ id: 1 }, "tok");
    store.resetJourney();
    store.saveActivity(act(1000));
    fakeApi({ "POST /activities": () => json({ message: "x", errors: { distance_m: ["Kecepatan tidak wajar."] } }, 422) });
    await sync.syncJourney();
    expect(store.getJourney().activities[0].synced).toBe(true);
  });

  it("server mati → UI tetap jalan dari data lokal", async () => {
    const { sync, store, session } = await load();
    session.writeSession({ id: 1 }, "tok");
    store.resetJourney();
    store.saveActivity(act(2000));
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("network"));
    expect((await sync.syncJourney()).ok).toBe(false);
    expect(store.getJourney().activities[0].synced).toBeUndefined();
    expect(store.totalPoin()).toBeGreaterThan(0);
  });

  it("QR tempat sendiri: cooldown dari server diterapkan ke status tingkat", async () => {
    const { sync, store, session } = await load();
    session.writeSession({ id: 1 }, "tok");
    store.resetJourney();
    const cd = [{ tier: 2, nama: "Pelari Niat", cooldown_until: hariDepan(29), sudah_bisa_diklaim: false }];
    const calls = fakeApi({ "POST /byo/confirm": () => json({ message: "Cooldown kuponmu berkurang 1 hari.", applied: true, data: { dikurangi_hari: 1, cooldowns: cd } }) });
    const r = await sync.konfirmasiTempatSendiri("t".repeat(40));
    expect(r).toMatchObject({ ok: true, applied: true });
    expect(calls[0].body).toEqual({ token: "t".repeat(40) });
    expect(store.cooldownsEfektif()[2]).toBe(cd[0].cooldown_until);
  });

  it("QR tempat sendiri tanpa login ditolak dengan pesan jelas, tanpa memanggil server", async () => {
    const { sync } = await load();
    const spy = vi.spyOn(globalThis, "fetch");
    const r = await sync.konfirmasiTempatSendiri("x".repeat(40));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/masuk/i);
    expect(spy).not.toHaveBeenCalled();
  });

  it("QR kedaluwarsa dari server → galat ditampilkan", async () => {
    const { sync, session } = await load();
    session.writeSession({ id: 1 }, "tok");
    fakeApi({ "POST /byo/confirm": () => json({ message: "QR sudah kedaluwarsa. Minta kasir membuat QR baru." }, 422) });
    const r = await sync.konfirmasiTempatSendiri("x".repeat(40));
    expect(r).toMatchObject({ ok: false });
    expect(r.error).toMatch(/kedaluwarsa/i);
  });

  it("kasir menerbitkan QR; 403 untuk non-kasir dijelaskan", async () => {
    const { sync, session } = await load();
    session.writeSession({ id: 1 }, "tok");
    fakeApi({ "POST /byo/token": () => json({ data: { qr_payload: `jejakwangi:byo:${"a".repeat(40)}`, expires_at: hariDepan(0.003), berlaku_menit: 5 } }, 201) });
    expect((await sync.terbitkanQrTempatSendiri()).qr_payload).toMatch(/^jejakwangi:byo:/);
    vi.restoreAllMocks();
    fakeApi({ "POST /byo/token": () => json({ message: "Hanya akun kasir UMKM yang dapat membuat QR ini." }, 403) });
    const r = await sync.terbitkanQrTempatSendiri();
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/kasir/i);
  });

  it("leaderboard memuat rows, me, dan periode", async () => {
    const { sync } = await load();
    fakeApi({ "GET /leaderboard": () => json({ data: [{ rank: 1, name: "Levi K.", km: 4, badge: { kode: "top-1", label: "Top 1" }, is_me: true }], me: null, period: { reset_at: "2026-11-30T17:00:00Z" } }) });
    const lb = await sync.fetchLeaderboard();
    expect(lb.rows[0].badge.kode).toBe("top-1");
    expect(lb.period.reset_at).toBeTruthy();
  });
});
