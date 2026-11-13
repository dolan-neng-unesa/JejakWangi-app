import { beforeEach, describe, expect, it } from "vitest";
import { BADGES, TIERS, emisiPerKm, formatDurasi, hitungDampak, levelDariPoin, modaPembanding, monthKeyWIB, parseByoToken, parseKoridorFromQr, resetBulanWIB, saranIspu, sisaHari, statusTier } from "../lib/journey";
import { claimTierLocal, getJourney, monthKm, resetJourney, saveActivity, setArrival, tierStatuses, totalPoin, voucherStatus } from "../services/journeyStore";

describe("lib/journey", () => {
  it("jalan & sepeda tidak beremisi; mobil > motor", () => {
    expect(emisiPerKm("jalan")).toBe(0);
    expect(emisiPerKm("sepeda")).toBe(0);
    expect(emisiPerKm("mobil")).toBeGreaterThan(emisiPerKm("motor"));
  });

  it("pembanding: mobil tetap mobil, selain itu motor", () => {
    expect(modaPembanding("mobil")).toBe("mobil");
    expect(modaPembanding("jalan")).toBe("motor");
  });

  it("hitungDampak 5,2 km vs mobil memakai rumus L/100km × faktor BBM × Rp/liter", () => {
    const d = hitungDampak(5200, "mobil");
    expect(d.co2Kg).toBeCloseTo(5.2 * 0.1179 * 2.31, 4);
    expect(d.rupiah).toBe(Math.round(5.2 * 0.1179 * 10000));
    expect(d.poin).toBe(156);
  });

  it("jarak negatif tidak menghasilkan dampak negatif", () => {
    expect(hitungDampak(-10, "motor").co2Kg).toBe(0);
  });

  it("format durasi", () => {
    expect(formatDurasi(1938)).toBe("32:18");
    expect(formatDurasi(3725)).toBe("1:02:05");
  });

  it("parse isi QR", () => {
    expect(parseKoridorFromQr("https://jejakwangi.id/q/3")).toBe(3);
    expect(parseKoridorFromQr("jejakwangi:koridor:2")).toBe(2);
    expect(parseKoridorFromQr(" 5 ")).toBe(5);
    expect(parseKoridorFromQr("halo")).toBeNull();
    expect(parseKoridorFromQr("")).toBeNull();
  });

  it("saran ISPU: tidak sehat → pesan alternatif, tanpa data → sehat", () => {
    expect(saranIspu(null).sehat).toBe(true);
    expect(saranIspu({ value: 40 }).pesan).toBeNull();
    expect(saranIspu({ value: 80 }).sehat).toBe(true);
    expect(saranIspu({ value: 130 }).sehat).toBe(false);
  });

  it("level naik tiap 250 poin", () => {
    expect(levelDariPoin(0).level).toBe(1);
    expect(levelDariPoin(250).level).toBe(2);
    expect(levelDariPoin(260).sisa).toBe(240);
  });
});

describe("gamifikasi: tier, cooldown, bulan WIB", () => {
  it("konfigurasi tier sesuai ketentuan", () => {
    expect(TIERS.map((t) => t.targetKm)).toEqual([1, 3, 5]);
    expect(TIERS.map((t) => t.berlakuHari)).toEqual([7, 7, 14]);
    expect(TIERS.map((t) => t.hadiah)).toEqual(["Air Mineral 1 pcs", "Air Isotonik 1 pcs", "Air Isotonik 1 pcs + Jajan 1 pcs"]);
    expect(Object.keys(BADGES)).toEqual(["top-1", "top-3", "top-5", "top-10"]);
  });

  it("batas bulan memakai zona Jakarta (UTC+7), bukan zona perangkat", () => {
    expect(monthKeyWIB("2026-10-31T16:30:00Z")).toBe("2026-10"); // 31 Okt 23:30 WIB
    expect(monthKeyWIB("2026-10-31T17:30:00Z")).toBe("2026-11"); // 1 Nov 00:30 WIB
    expect(resetBulanWIB(new Date("2026-11-15T03:00:00Z")).toISOString()).toBe("2026-11-30T17:00:00.000Z"); // 1 Des 00:00 WIB
  });

  it("statusTier: terkunci → bisa_diklaim → cooldown", () => {
    const now = Date.parse("2026-11-15T03:00:00Z");
    expect(statusTier(0.5, {}, now).map((t) => t.status)).toEqual(["terkunci", "terkunci", "terkunci"]);
    expect(statusTier(3, {}, now).map((t) => t.status)).toEqual(["bisa_diklaim", "bisa_diklaim", "terkunci"]);
    const st = statusTier(5, { 2: new Date(now + 30 * 864e5).toISOString() }, now);
    expect(st.map((t) => t.status)).toEqual(["bisa_diklaim", "cooldown", "bisa_diklaim"]);
    expect(st[1].sisaHariCooldown).toBe(30);
  });

  it("sisaHari dibulatkan ke atas dan tidak negatif", () => {
    const now = Date.now();
    expect(sisaHari(new Date(now + 36 * 3600e3), now)).toBe(2);
    expect(sisaHari(new Date(now - 1000), now)).toBe(0);
  });

  it("parse token QR tempat sendiri", () => {
    const t = "a".repeat(40);
    expect(parseByoToken(`jejakwangi:byo:${t}`)).toBe(t);
    expect(parseByoToken(t)).toBe(t);
    expect(parseByoToken("jejakwangi:koridor:1")).toBeNull();
    expect(parseByoToken("pendek")).toBeNull();
  });
});

describe("services/journeyStore", () => {
  beforeEach(() => {
    localStorage.clear();
    resetJourney();
  });

  const NOW = new Date("2026-11-15T03:00:00Z");
  const aktivitas = (m, o = {}) => ({ startedAt: NOW.toISOString(), durationSec: 600, distanceM: m, poin: Math.round((m / 1000) * 30), co2Kg: 0.1, ...o });

  it("menyimpan moda dari scan QR awal", () => {
    setArrival({ transport: "motor", koridorId: 1 });
    expect(getJourney().transport).toBe("motor");
    expect(getJourney().koridorId).toBe(1);
  });

  it("progres bulan ini kumulatif, mengabaikan bulan lalu dan simulasi", () => {
    saveActivity(aktivitas(600));
    saveActivity(aktivitas(500));
    saveActivity(aktivitas(4000, { startedAt: "2026-10-31T16:30:00Z" })); // bulan lalu (WIB)
    saveActivity(aktivitas(9000, { simulasi: true }));
    expect(monthKm(getJourney(), NOW)).toBeCloseTo(1.1);
    expect(totalPoin()).toBe(18 + 15 + 120); // simulasi tidak memberi poin
  });

  it("menyimpan aktivitas TIDAK otomatis membuat kupon", () => {
    saveActivity(aktivitas(6000));
    expect(getJourney().vouchers).toHaveLength(0);
  });

  it("klaim ditolak bila belum mencapai target", () => {
    saveActivity(aktivitas(900));
    expect(claimTierLocal(1, NOW)).toMatchObject({ ok: false });
  });

  it("klaim tingkat 1 pada tepat 1 km: kupon 7 hari + cooldown 30 hari", () => {
    saveActivity(aktivitas(1000));
    const r = claimTierLocal(1, NOW);
    expect(r.ok).toBe(true);
    expect(r.voucher).toMatchObject({ title: "Pelari Mager", desc: "Air Mineral 1 pcs", tier: 1, status: "tersedia" });
    expect(Date.parse(r.voucher.expiresAt) - NOW.getTime()).toBe(7 * 864e5);
    const st = tierStatuses(getJourney(), NOW);
    expect(st[0]).toMatchObject({ status: "cooldown", sisaHariCooldown: 30 });
  });

  it("tingkat 3: masa pakai 14 hari; tiap tingkat cooldown sendiri-sendiri", () => {
    saveActivity(aktivitas(5000));
    const r3 = claimTierLocal(3, NOW);
    expect(Date.parse(r3.voucher.expiresAt) - NOW.getTime()).toBe(14 * 864e5);
    expect(tierStatuses(getJourney(), NOW).map((t) => t.status)).toEqual(["bisa_diklaim", "bisa_diklaim", "cooldown"]);
  });

  it("tidak bisa klaim dua kali selama cooldown", () => {
    saveActivity(aktivitas(2000));
    expect(claimTierLocal(1, NOW).ok).toBe(true);
    const lagi = claimTierLocal(1, NOW);
    expect(lagi.ok).toBe(false);
    expect(lagi.error).toMatch(/cooldown/i);
    expect(getJourney().vouchers).toHaveLength(1);
  });

  it("setelah 30 hari bisa klaim lagi bila progres bulan baru cukup", () => {
    saveActivity(aktivitas(1500));
    claimTierLocal(1, NOW);
    const later = new Date(NOW.getTime() + 31 * 864e5); // pertengahan Desember
    expect(claimTierLocal(1, later).ok).toBe(false); // progres Desember masih 0
    saveActivity(aktivitas(1000, { startedAt: later.toISOString() }));
    expect(claimTierLocal(1, later).ok).toBe(true);
    expect(getJourney().vouchers).toHaveLength(2);
  });

  it("tingkat tak dikenal ditolak", () => {
    expect(claimTierLocal(9, NOW).ok).toBe(false);
  });

  it("kupon lewat masa berlaku dianggap kedaluwarsa", () => {
    const v = { status: "tersedia", expiresAt: new Date(Date.now() - 1000).toISOString() };
    expect(voucherStatus(v)).toBe("kedaluwarsa");
    expect(voucherStatus({ ...v, status: "digunakan" })).toBe("digunakan");
  });
});
