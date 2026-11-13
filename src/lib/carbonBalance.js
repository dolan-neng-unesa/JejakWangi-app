/**
 * Neraca Karbon per Koridor — JEJAK WANGI
 * ------------------------------------------------
 * Diadaptasi dari modul "Jejak Wangi" (neraca-karbon). ES module tanpa dependensi.
 * Satuan keluaran: kg CO2 per hari, kecuali disebut lain.
 *
 * Rumus:
 *   Serapan pohon  S      = Σ (jumlah pohon_i × daya serap_i [kg/th]) ÷ 365
 *   Emisi kendaraan E_kend = Σ (kendaraan/hari_j × panjang koridor [km] × L/km_j × faktor BBM)
 *   Emisi AC        E_AC   = Σ toko (unit × kW × jam × faktor beban × faktor grid)
 *   Rasio serapan   R      = S ÷ (E_kend + E_AC) × 100%
 *   O2 setara              = S × 32/44
 *
 * Di JEJAKWANGI: `co2_reduced_kg_day` = S dan `oxygen_kg_day` = S × 32/44
 * (lihat terapkanNeracaKarbon di bawah).
 */

// ---------------------------------------------------------------------------
// 1. KONSTANTA & REFERENSI
// ---------------------------------------------------------------------------

/** Faktor emisi bahan bakar (kg CO2 per liter). Sumber: IPCC / DEFRA. */
export const FAKTOR_EMISI_BBM = {
  bensin: 2.31,
  solar: 2.68,
};

/**
 * Faktor emisi grid listrik Jawa-Madura-Bali (kg CO2 per kWh) = 0,87 tCO2/MWh.
 * Sumber: daftar faktor emisi JCM Indonesia (merujuk Ditjen Gatrik ESDM, data 2019).
 * Banyuwangi masuk sistem Jamali.
 */
export const FAKTOR_EMISI_GRID_JAMALI = 0.87;

/** Rasio massa O2 yang dilepas per massa CO2 yang diserap (32/44). */
export const RASIO_O2_PER_CO2 = 32 / 44;

/**
 * Konsumsi energi spesifik (L/100 km), dikutip dari tabel yang merujuk
 * Permen LH No. 12/2010 (dikutip ulang di jurnal ITS; bukan dari PDF Permen-nya langsung).
 * Sumber lain yang juga menyebut Permen LH 12/2010 memberi angka berbeda
 * (motor ≈ 3,6; bus besar ≈ 28,6; truk 2 as ≈ 22,7 L/100 km), jadi kendaraan
 * yang ditandai `perluVerifikasi` bisa meleset sampai ±1,7×.
 */
export const JENIS_KENDARAAN = {
  motor: { label: "Sepeda motor", bbm: "bensin", literPer100km: 2.66, perluVerifikasi: true },
  mobil: { label: "Mobil bensin", bbm: "bensin", literPer100km: 11.79, perluVerifikasi: false },
  bus: { label: "Bus besar (solar)", bbm: "solar", literPer100km: 16.89, perluVerifikasi: true },
  truk: { label: "Truk sedang (solar)", bbm: "solar", literPer100km: 15.15, perluVerifikasi: true },
};

/**
 * Daya serap CO2 per jenis pohon (kg CO2 per pohon per tahun).
 * Sumber: Dahlan (2008/2010), tabel jenis pohon Kota Bogor, sebagaimana dikutip
 * Kompas (20 Des 2023) dan J. Unhas (Tabel daya serap CO2). Ini angka pohon dewasa;
 * jangan dipakai untuk bibit/pohon muda. Metodenya sering dikritik terlalu tinggi
 * dibanding estimasi serapan bersih pohon kota, jadi perlakukan sebagai batas atas.
 * `null` = belum ada rujukan; akan memunculkan error supaya tidak ada angka karangan.
 */
const DAHLAN = "Dahlan (2008/2010), tabel Kota Bogor";
export const DAYA_SERAP_POHON = {
  trembesi: { label: "Trembesi (Samanea saman)", kgPerTahun: 28488, sumber: `${DAHLAN}, tajuk 15 m` },
  kenanga: { label: "Kenanga", kgPerTahun: 756.59, sumber: DAHLAN },
  beringin: { label: "Beringin", kgPerTahun: 535.9, sumber: DAHLAN },
  mahoni: { label: "Mahoni", kgPerTahun: 295.73, sumber: DAHLAN },
  bungur: { label: "Bungur", kgPerTahun: 160.14, sumber: DAHLAN },
  flamboyan: { label: "Flamboyan", kgPerTahun: 42.2, sumber: DAHLAN },
  tanjung: { label: "Tanjung", kgPerTahun: 34.29, sumber: DAHLAN },
  angsana: { label: "Angsana", kgPerTahun: 11.12, sumber: DAHLAN },
  ketapang_kencana: { label: "Ketapang kencana", kgPerTahun: null, sumber: "ISI DARI LITERATUR (tidak ada di tabel Dahlan)" },
  // Nilai asumsi untuk ilustrasi/purwarupa. Ganti saat data per jenis tersedia.
  asumsi_rata2: { label: "Asumsi rata-rata (ilustrasi)", kgPerTahun: 100, sumber: "ASUMSI — bukan data lapangan" },
};

/** Jenis pohon default untuk rekomendasi "pohon tambahan agar netral" (realistis, bukan trembesi). */
export const POHON_REKOMENDASI_DEFAULT = "mahoni";

// ---------------------------------------------------------------------------
// 2. UTILITAS
// ---------------------------------------------------------------------------

const bulat = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const salin = (x) => JSON.parse(JSON.stringify(x));

function wajibAngka(nilai, nama) {
  if (typeof nilai !== "number" || !Number.isFinite(nilai) || nilai < 0) {
    throw new Error(`Nilai "${nama}" harus angka >= 0, diterima: ${nilai}`);
  }
  return nilai;
}

/**
 * Skala hitungan kendaraan dari sampel ke per hari.
 * Contoh: 180 motor dalam 1 jam, jalan ramai 14 jam/hari -> skalaKeHarian(180, 1, 14) = 2520.
 * Sampel jam sibuk melebihkan angka harian; ambil beberapa sampel lalu rata-ratakan.
 */
export function skalaKeHarian(jumlahSampel, durasiSampelJam, jamAktifPerHari) {
  wajibAngka(jumlahSampel, "jumlahSampel");
  wajibAngka(durasiSampelJam, "durasiSampelJam");
  wajibAngka(jamAktifPerHari, "jamAktifPerHari");
  if (durasiSampelJam === 0) throw new Error("durasiSampelJam tidak boleh 0");
  return (jumlahSampel / durasiSampelJam) * jamAktifPerHari;
}

/** Emisi per km untuk satu jenis kendaraan (kg CO2/km). */
export function emisiPerKm(jenis, referensi = JENIS_KENDARAAN) {
  const k = referensi[jenis];
  if (!k) throw new Error(`Jenis kendaraan tidak dikenal: ${jenis}`);
  return (k.literPer100km / 100) * FAKTOR_EMISI_BBM[k.bbm];
}

// ---------------------------------------------------------------------------
// 3. RUMUS INTI
// ---------------------------------------------------------------------------

/** S = Σ (n_i × D_i) / 365   [kg CO2/hari] */
export function hitungSerapanPohon(pohon, referensi = DAYA_SERAP_POHON) {
  const rincian = pohon.map(({ jenis, jumlah, kgPerTahun }) => {
    wajibAngka(jumlah, `jumlah pohon ${jenis}`);
    const ref = referensi[jenis];
    // kgPerTahun di data koridor boleh menimpa referensi (mis. hasil alometrik)
    const d = kgPerTahun ?? ref?.kgPerTahun;
    if (d == null) {
      throw new Error(
        `Daya serap pohon "${jenis}" belum diisi. Isi DAYA_SERAP_POHON.${jenis}.kgPerTahun ` +
          `dari literatur, atau beri kgPerTahun langsung di data koridor.`
      );
    }
    wajibAngka(d, `kgPerTahun ${jenis}`);
    return {
      jenis,
      label: ref?.label ?? jenis,
      jumlah,
      kgPerTahunPerPohon: d,
      kgPerHari: (jumlah * d) / 365,
      sumber: kgPerTahun != null ? "data koridor" : ref?.sumber,
    };
  });
  const total = rincian.reduce((s, r) => s + r.kgPerHari, 0);
  return { total, rincian };
}

/** E_kend = Σ N_j × L × K_j × F_BBM   [kg CO2/hari] */
export function hitungEmisiKendaraan(kendaraanPerHari, panjangKm, referensi = JENIS_KENDARAAN) {
  wajibAngka(panjangKm, "panjangKm");
  const rincian = Object.entries(kendaraanPerHari).map(([jenis, n]) => {
    wajibAngka(n, `kendaraan ${jenis}`);
    const ef = emisiPerKm(jenis, referensi);
    return {
      jenis,
      label: referensi[jenis].label,
      jumlahPerHari: n,
      gramPerKm: ef * 1000,
      kgPerHari: n * panjangKm * ef,
      perluVerifikasi: Boolean(referensi[jenis].perluVerifikasi),
    };
  });
  const total = rincian.reduce((s, r) => s + r.kgPerHari, 0);
  return { total, rincian };
}

/** E_AC = U × P × t × f_beban × F_grid   [kg CO2/hari], dijumlah per toko */
export function hitungEmisiAC(toko, faktorGrid = FAKTOR_EMISI_GRID_JAMALI) {
  const rincian = toko.map((t) => {
    const { nama, unitAC, kWPerUnit, jamOperasi, faktorBeban = 0.7 } = t;
    wajibAngka(unitAC, `unitAC ${nama}`);
    wajibAngka(kWPerUnit, `kWPerUnit ${nama}`);
    wajibAngka(jamOperasi, `jamOperasi ${nama}`);
    wajibAngka(faktorBeban, `faktorBeban ${nama}`);
    const kWh = unitAC * kWPerUnit * jamOperasi * faktorBeban;
    return { nama, unitAC, kWhPerHari: kWh, kgPerHari: kWh * faktorGrid };
  });
  const total = rincian.reduce((s, r) => s + r.kgPerHari, 0);
  return { total, rincian };
}

/** Peringatan kualitas data: apa saja yang masih ilustrasi/asumsi/belum terverifikasi. */
function kumpulkanPeringatan(k, serapan, kendaraan) {
  const out = [];
  const ket = { pohon: "jumlah pohon", kendaraan: "hitungan kendaraan", ac: "data AC toko" };
  for (const [bidang, nilai] of Object.entries(k.sumberData ?? {})) {
    if (/ilustrasi|estimasi|asumsi|contoh/i.test(String(nilai))) {
      out.push(`${ket[bidang] ?? bidang}: masih ${String(nilai).toLowerCase()}, belum hasil survei`);
    }
  }
  for (const p of serapan.rincian) {
    if (p.jenis === "asumsi_rata2") out.push("daya serap pohon memakai asumsi rata-rata, bukan data per jenis");
  }
  for (const r of kendaraan.rincian) {
    if (r.perluVerifikasi) out.push(`konsumsi BBM ${r.label.toLowerCase()} belum terverifikasi penuh`);
  }
  return [...new Set(out)];
}

/**
 * Neraca lengkap satu koridor.
 * @param {object} k  { id, nama, panjangKm, pohon[], kendaraanPerHari{}, toko[], sumberData{} }
 * @param {object} opsi { jenisPohonRekomendasi: "mahoni" }
 */
export function hitungNeracaKoridor(k, opsi = {}) {
  const jenisRek = opsi.jenisPohonRekomendasi ?? POHON_REKOMENDASI_DEFAULT;

  const serapan = hitungSerapanPohon(k.pohon ?? []);
  const kendaraan = hitungEmisiKendaraan(k.kendaraanPerHari ?? {}, k.panjangKm);
  const ac = hitungEmisiAC(k.toko ?? []);

  const totalEmisi = kendaraan.total + ac.total;
  const rasioSerapanPersen = totalEmisi > 0 ? (serapan.total / totalEmisi) * 100 : null;
  const defisit = Math.max(0, totalEmisi - serapan.total);

  const serapRek = DAYA_SERAP_POHON[jenisRek]?.kgPerTahun;
  const pohonTambahan = serapRek ? Math.ceil(defisit / (serapRek / 365)) : null;

  return {
    id: k.id,
    nama: k.nama,
    panjangKm: k.panjangKm,
    serapanPohon: bulat(serapan.total),
    o2SetaraKgPerHari: bulat(serapan.total * RASIO_O2_PER_CO2),
    emisiKendaraan: bulat(kendaraan.total),
    emisiAC: bulat(ac.total),
    totalEmisi: bulat(totalEmisi),
    rasioSerapanPersen: rasioSerapanPersen == null ? null : bulat(rasioSerapanPersen, 1),
    defisit: bulat(defisit),
    rekomendasi: {
      jenisPohon: jenisRek,
      pohonTambahanUntukNetral: pohonTambahan,
    },
    rincian: {
      pohon: serapan.rincian.map((r) => ({ ...r, kgPerHari: bulat(r.kgPerHari) })),
      kendaraan: kendaraan.rincian.map((r) => ({ ...r, gramPerKm: bulat(r.gramPerKm, 1), kgPerHari: bulat(r.kgPerHari) })),
      ac: ac.rincian.map((r) => ({ ...r, kWhPerHari: bulat(r.kWhPerHari), kgPerHari: bulat(r.kgPerHari) })),
    },
    sumberData: k.sumberData ?? {},
    peringatan: kumpulkanPeringatan(k, serapan, kendaraan),
  };
}

// ---------------------------------------------------------------------------
// 4. SKENARIO ("what-if")
// ---------------------------------------------------------------------------

const persen = (x) => Math.min(100, Math.max(0, Number(x) || 0)) / 100;

/**
 * Terapkan skenario ke data koridor (tanpa mengubah aslinya).
 * @param {object} s {
 *   persenMotorJalanKaki: 0..100  — % pengendara motor beralih jalan kaki
 *   persenHematAC:        0..100  — penurunan konsumsi listrik AC
 *   tambahPohon: { jenis: "mahoni", jumlah: 10 }
 * }
 */
export function terapkanSkenario(k, s = {}) {
  const c = salin(k);
  const pMotor = persen(s.persenMotorJalanKaki);
  const pAC = persen(s.persenHematAC);

  if (c.kendaraanPerHari?.motor != null) c.kendaraanPerHari.motor *= 1 - pMotor;
  c.toko = (c.toko ?? []).map((t) => ({ ...t, kWPerUnit: t.kWPerUnit * (1 - pAC) }));
  if (s.tambahPohon?.jumlah > 0) {
    c.pohon = [...(c.pohon ?? []), { jenis: s.tambahPohon.jenis, jumlah: s.tambahPohon.jumlah }];
  }
  return c;
}

/** Bandingkan kondisi awal dan setelah skenario. */
export function bandingkanSkenario(k, s, opsi) {
  const awal = hitungNeracaKoridor(k, opsi);
  const sesudah = hitungNeracaKoridor(terapkanSkenario(k, s), opsi);
  return {
    skenario: s,
    awal,
    sesudah,
    selisih: {
      emisiTurunKgPerHari: bulat(awal.totalEmisi - sesudah.totalEmisi),
      serapanNaikKgPerHari: bulat(sesudah.serapanPohon - awal.serapanPohon),
      rasioSerapanPersen: bulat((sesudah.rasioSerapanPersen ?? 0) - (awal.rasioSerapanPersen ?? 0), 1),
    },
  };
}

// ---------------------------------------------------------------------------
// 5. RINGKASAN SEMUA KORIDOR → JSON DASHBOARD
// ---------------------------------------------------------------------------

/**
 * Hitung semua koridor, beri peringkat prioritas (rasio serapan terendah =
 * paling butuh intervensi), dan susun objek siap dikirim ke dashboard.
 */
export function hitungSemuaKoridor(daftarKoridor, opsi = {}) {
  const hasil = daftarKoridor.map((k) => hitungNeracaKoridor(k, opsi));

  const urut = [...hasil].sort((a, b) => (a.rasioSerapanPersen ?? Infinity) - (b.rasioSerapanPersen ?? Infinity));
  urut.forEach((h, i) => (h.peringkatPrioritas = i + 1));

  const jumlah = (key) => bulat(hasil.reduce((s, h) => s + h[key], 0));
  const totalEmisi = jumlah("totalEmisi");
  const totalSerapan = jumlah("serapanPohon");

  return {
    dibuat: new Date().toISOString(),
    satuan: "kg CO2/hari",
    konstanta: {
      faktorEmisiBBM: FAKTOR_EMISI_BBM,
      faktorEmisiGrid: FAKTOR_EMISI_GRID_JAMALI,
      rasioO2PerCO2: bulat(RASIO_O2_PER_CO2, 3),
    },
    ringkasan: {
      totalEmisi,
      totalEmisiKendaraan: jumlah("emisiKendaraan"),
      totalEmisiAC: jumlah("emisiAC"),
      totalSerapan,
      rasioSerapanPersen: totalEmisi > 0 ? bulat((totalSerapan / totalEmisi) * 100, 1) : null,
      koridorPrioritas: urut[0]?.nama ?? null,
    },
    koridor: hasil,
  };
}

// ---------------------------------------------------------------------------
// 6. JEMBATAN KE DATA KORIDOR JEJAK WANGI
// ---------------------------------------------------------------------------

/**
 * Ubah koridor JEJAK WANGI (`koridor.carbon_inputs` + `distance_meter`) jadi masukan modul ini.
 * carbon_inputs: { pohon[], kendaraanPerHari{}, toko[], sumberData{}, panjangKm? }
 * Panjang koridor default = distance_meter / 1000; isi carbon_inputs.panjangKm bila
 * panjang hasil survei/jalur sebenarnya berbeda.
 */
export function koridorKeMasukan(koridor) {
  const ci = koridor.carbon_inputs;
  return {
    id: koridor.id,
    nama: koridor.formal_name,
    panjangKm: ci.panjangKm ?? Number(koridor.distance_meter ?? 0) / 1000,
    pohon: ci.pohon ?? [],
    kendaraanPerHari: ci.kendaraanPerHari ?? {},
    toko: ci.toko ?? [],
    sumberData: ci.sumberData ?? {},
  };
}

/**
 * Isi `co2_reduced_kg_day` (= serapan pohon) dan `oxygen_kg_day` (= serapan × 32/44)
 * sebuah koridor JEJAK WANGI dari `carbon_inputs`, dan tempelkan hasil lengkapnya di
 * `carbon_balance`. Tanpa `carbon_inputs` (atau datanya tidak valid) koridor dikembalikan
 * apa adanya, jadi angka tersimpan di database tetap jadi cadangan dan UI tidak rusak.
 */
export function terapkanNeracaKarbon(koridor, opsi) {
  if (!koridor?.carbon_inputs) return koridor;
  try {
    const n = hitungNeracaKoridor(koridorKeMasukan(koridor), opsi);
    return {
      ...koridor,
      co2_reduced_kg_day: bulat(n.serapanPohon, 1),
      oxygen_kg_day: bulat(n.o2SetaraKgPerHari, 1),
      carbon_balance: n,
    };
  } catch (err) {
    console.warn(`[neraca karbon] koridor ${koridor.id} dilewati: ${err.message}`);
    return koridor;
  }
}
