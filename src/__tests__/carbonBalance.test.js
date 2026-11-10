import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DAYA_SERAP_POHON,
  FAKTOR_EMISI_GRID_JAMALI,
  RASIO_O2_PER_CO2,
  bandingkanSkenario,
  emisiPerKm,
  hitungEmisiAC,
  hitungNeracaKoridor,
  hitungSerapanPohon,
  skalaKeHarian,
  terapkanNeracaKarbon,
  terapkanSkenario,
} from "../lib/carbonBalance";

const koridorContoh = {
  id: 1,
  nama: "Koridor contoh",
  panjangKm: 0.5,
  pohon: [{ jenis: "mahoni", jumlah: 100 }],
  kendaraanPerHari: { motor: 1000, mobil: 100 },
  toko: [{ nama: "Toko", unitAC: 2, kWPerUnit: 0.8, jamOperasi: 10, faktorBeban: 0.7 }],
  sumberData: { pohon: "SURVEI", kendaraan: "ILUSTRASI", ac: "SURVEI" },
};

afterEach(() => vi.restoreAllMocks());

describe("rumus inti", () => {
  it("serapan pohon = jumlah × kg/tahun ÷ 365", () => {
    const { total } = hitungSerapanPohon([{ jenis: "mahoni", jumlah: 100 }]);
    expect(total).toBeCloseTo((100 * DAYA_SERAP_POHON.mahoni.kgPerTahun) / 365, 6);
  });

  it("jenis pohon tanpa rujukan memunculkan error, bukan angka karangan", () => {
    expect(() => hitungSerapanPohon([{ jenis: "ketapang_kencana", jumlah: 3 }])).toThrow(/belum diisi/);
  });

  it("emisi AC = unit × kW × jam × beban × faktor grid", () => {
    const { total } = hitungEmisiAC(koridorContoh.toko);
    expect(total).toBeCloseTo(2 * 0.8 * 10 * 0.7 * FAKTOR_EMISI_GRID_JAMALI, 6);
  });

  it("emisi per km motor ≈ 0,061 dan mobil ≈ 0,272 kg CO₂/km", () => {
    expect(emisiPerKm("motor")).toBeCloseTo(0.0614, 3);
    expect(emisiPerKm("mobil")).toBeCloseTo(0.2723, 3);
  });

  it("skala sampel ke harian", () => {
    expect(skalaKeHarian(180, 1, 14)).toBe(2520);
  });

  it("neraca: total emisi = kendaraan + AC, O₂ = 32/44 × serapan", () => {
    const n = hitungNeracaKoridor(koridorContoh);
    expect(n.totalEmisi).toBeCloseTo(n.emisiKendaraan + n.emisiAC, 1);
    expect(n.o2SetaraKgPerHari / n.serapanPohon).toBeCloseTo(RASIO_O2_PER_CO2, 2);
    expect(n.peringatan.some((p) => /hitungan kendaraan/.test(p))).toBe(true);
  });
});

describe("skenario", () => {
  it("tidak mengubah data asli dan membatasi persen 0–100", () => {
    const asli = JSON.parse(JSON.stringify(koridorContoh));
    const s = terapkanSkenario(koridorContoh, { persenMotorJalanKaki: 150 });
    expect(koridorContoh).toEqual(asli);
    expect(s.kendaraanPerHari.motor).toBe(0);
  });

  it("jalan kaki + hemat AC + tambah pohon menurunkan emisi dan menaikkan serapan", () => {
    const { selisih } = bandingkanSkenario(koridorContoh, {
      persenMotorJalanKaki: 10,
      persenHematAC: 20,
      tambahPohon: { jenis: "mahoni", jumlah: 10 },
    });
    expect(selisih.emisiTurunKgPerHari).toBeGreaterThan(0);
    expect(selisih.serapanNaikKgPerHari).toBeGreaterThan(0);
  });
});

describe("terapkanNeracaKarbon (jembatan ke koridor SVARGA)", () => {
  const koridor = {
    id: 9,
    formal_name: "Koridor 9",
    distance_meter: 500,
    oxygen_kg_day: 99,
    co2_reduced_kg_day: 99,
    carbon_inputs: {
      pohon: koridorContoh.pohon,
      kendaraanPerHari: koridorContoh.kendaraanPerHari,
      toko: koridorContoh.toko,
      sumberData: { pohon: "SURVEI" },
    },
  };

  it("mengisi co2_reduced_kg_day & oxygen_kg_day dari carbon_inputs (panjang = distance_meter/1000)", () => {
    const r = terapkanNeracaKarbon(koridor);
    expect(r.co2_reduced_kg_day).toBe(Math.round(r.carbon_balance.serapanPohon * 10) / 10);
    expect(r.oxygen_kg_day / r.co2_reduced_kg_day).toBeCloseTo(RASIO_O2_PER_CO2, 1);
    expect(r.carbon_balance.panjangKm).toBe(0.5);
  });

  it("tanpa carbon_inputs, koridor dikembalikan apa adanya", () => {
    const polos = { id: 1, oxygen_kg_day: 5, co2_reduced_kg_day: 7 };
    expect(terapkanNeracaKarbon(polos)).toBe(polos);
  });

  it("data tidak valid → angka tersimpan dipertahankan dan UI tidak crash", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const rusak = { ...koridor, carbon_inputs: { ...koridor.carbon_inputs, pohon: [{ jenis: "ketapang_kencana", jumlah: 1 }] } };
    const r = terapkanNeracaKarbon(rusak);
    expect(r.oxygen_kg_day).toBe(99);
    expect(r.carbon_balance).toBeUndefined();
  });
});

describe("data mock koridor SVARGA", () => {
  it("ketujuh koridor punya neraca karbon dan O₂ < CO₂ (sesuai 32/44)", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_LARAVEL_API_URL", "");
    const { getKoridorList } = await import("../services/koridorService.js");
    const list = await getKoridorList();
    expect(list).toHaveLength(7);
    for (const k of list) {
      expect(k.carbon_balance, `koridor ${k.id}`).toBeTruthy();
      expect(k.oxygen_kg_day).toBeLessThan(k.co2_reduced_kg_day + 0.001);
    }
    vi.unstubAllEnvs();
  });

  it("Koridor Pasar Induk (id 7) tampil di posisi 2 dan membawa konten detail", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_LARAVEL_API_URL", "");
    const { getKoridorList, getKoridorDetail } = await import("../services/koridorService.js");
    const list = await getKoridorList();
    // id = nomor wilayah ESP32 (tidak digeser); urutan tampil lewat sort_order.
    expect(list.map((k) => k.id)).toEqual([1, 7, 2, 3, 4, 5, 6]);
    expect(list[1]).toMatchObject({ short_name: "Corridor Pasar", formal_name: "Koridor Pasar Induk", umkm_count: 5, hijau_level: "agak_hijau" });

    const pasar = await getKoridorDetail(7);
    expect(pasar.highlights.kunjungan).toHaveLength(3);
    expect(pasar.highlights.kunjungan.map((k) => k.sdg)).toEqual(["SDG 13", "SDG 12", "SDG 3 & 11"]);
    expect(pasar.highlights.dampak).toMatchObject({ co2_kg: 85, kantong_plastik: 1240 });
    vi.unstubAllEnvs();
  });
});
