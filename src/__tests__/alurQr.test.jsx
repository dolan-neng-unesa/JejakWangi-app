import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const parkir = vi.fn();
const mulai = vi.fn();
const selesai = vi.fn();
vi.mock("../services/engineService", async (orig) => ({
  ...(await orig()),
  cekParkir: (...a) => parkir(...a),
  mulaiCheckin: (...a) => mulai(...a),
  selesaiCheckin: (...a) => selesai(...a),
  fetchImpact: () => Promise.resolve({ data: { co2_terhindar_kg: 1.2, jalan_km: 2, plastik_terhindar: 3, sampah_terpilah_kg: 4, bibit: 0, sdgs: [{ nomor: 13, nama: "Penanganan perubahan iklim", nilai: 1.2, satuan: "kg CO₂ terhindar" }], poin_tersedia: 160 } }),
  fetchRewards: () => Promise.resolve({ data: [{ kode: "bibit", nama: "Bibit pohon", poin: 150 }], poin_tersedia: 160 }),
  redeemReward: vi.fn().mockResolvedValue({ data: { kode: "BBT-ABC123" } }),
}));
vi.mock("../services/sessionStore", async (orig) => ({ ...(await orig()), getToken: () => "tok" }));

const { default: ParkirScanPage } = await import("../pages/ParkirScanPage");
const { default: CheckinPage } = await import("../pages/CheckinPage");
const { default: DampakPage } = await import("../pages/DampakPage");

beforeEach(() => { parkir.mockReset(); mulai.mockReset(); selesai.mockReset(); });
afterEach(cleanup);
const ui = (path, el) => (<MemoryRouter initialEntries={[path]}><Routes><Route path={path} element={el} /><Route path="/checkin" element={<p>CHECKIN</p>} /></Routes></MemoryRouter>);

describe("QR kantong parkir", () => {
  it("ISPU tidak sehat → tampil alasan dan saran waktu/rute lain", async () => {
    const user = userEvent.setup();
    parkir.mockResolvedValue({ data: { titik: { nama: "Parkir Sritanjung" }, koridor: { nama: "RTH Sritanjung" }, sehat: false, data_lengkap: true, ispu: { nilai: 130, kategori: "Tidak Sehat" }, suhu_c: 31, selisih_suhu_c: 2, jam_ramai: { level: "ramai", jam_terpadat: "07.00–08.00" }, alasan_tidak_sehat: ["ISPU 130 (Tidak Sehat)"], saran: { teks: ["Udara biasanya paling bersih sekitar pukul 10.00."] } } });
    render(ui("/parkir", <ParkirScanPage />));
    await user.type(screen.getByLabelText("QR kantong parkir"), "PRK-SRI");
    await user.click(screen.getByRole("button", { name: "Cek" }));
    await waitFor(() => expect(screen.getByText(/Kurang nyaman/)).toBeTruthy());
    expect(screen.getByTestId("saran").textContent).toMatch(/pukul 10/);
    await user.click(screen.getByRole("button", { name: /Jalan ke pasar atau taman/ }));
    expect(screen.getByText("CHECKIN")).toBeTruthy();
  });

  it("ISPU sehat → langsung boleh berjalan, tanpa saran", async () => {
    const user = userEvent.setup();
    parkir.mockResolvedValue({ data: { titik: { nama: "P" }, koridor: null, sehat: true, data_lengkap: true, ispu: { nilai: 40, kategori: "Baik" }, suhu_c: 28, alasan_tidak_sehat: [], saran: null } });
    render(ui("/parkir", <ParkirScanPage />));
    await user.type(screen.getByLabelText("QR kantong parkir"), "X");
    await user.click(screen.getByRole("button", { name: "Cek" }));
    await waitFor(() => expect(screen.getByText(/ISPU sehat/)).toBeTruthy());
    expect(screen.queryByTestId("saran")).toBeNull();
  });
});

describe("Check-in lapak", () => {
  it("tanpa tas → QR tujuan kedua → kecepatan wajar → dihitung", async () => {
    const user = userEvent.setup();
    mulai.mockResolvedValueOnce({ data: { langkah: "tanya_tas", pesan: "?" } }).mockResolvedValueOnce({ data: { langkah: "scan_tujuan_kedua", pesan: "Jalan ke tujuan", checkin: { id: 5 } } });
    selesai.mockResolvedValue({ data: { id: 5, status: "dihitung", jarak_m: 320, co2_kg: 0.2, plastik_pcs: 0, points: 10 } });
    render(ui("/checkin", <CheckinPage />));
    await user.type(screen.getByLabelText("QR lapak atau titik awal"), "LPK-PSR-01");
    await user.click(screen.getByRole("button", { name: "Pindai" }));
    await user.click(await screen.findByRole("button", { name: "Tidak" }));
    await user.type(await screen.findByLabelText("QR tujuan kedua"), "TJN-SRI");
    await user.click(screen.getByRole("button", { name: "Selesai" }));
    await waitFor(() => expect(screen.getByText("Check-in dihitung")).toBeTruthy());
    expect(selesai).toHaveBeenCalledWith(5, "TJN-SRI");
  });

  it("bawa tas → langsung tercatat dengan plastik terhindar", async () => {
    const user = userEvent.setup();
    mulai.mockResolvedValueOnce({ data: { langkah: "tanya_tas", pesan: "?" } }).mockResolvedValueOnce({ data: { langkah: "selesai", pesan: "Tercatat!", checkin: { id: 1, status: "dihitung", co2_kg: 0.04, plastik_pcs: 1, points: 5 } } });
    render(ui("/checkin", <CheckinPage />));
    await user.type(screen.getByLabelText("QR lapak atau titik awal"), "LPK-PSR-01");
    await user.click(screen.getByRole("button", { name: "Pindai" }));
    await user.click(await screen.findByRole("button", { name: "Ya, bawa" }));
    await waitFor(() => expect(screen.getByText(/1 kantong plastik terhindar/)).toBeTruthy());
    expect(mulai).toHaveBeenLastCalledWith({ code: "LPK-PSR-01", tanpa_belanja: false, bawa_tas: true });
  });

  it("kecepatan tidak wajar → check-in tidak dihitung dengan alasan", async () => {
    const user = userEvent.setup();
    mulai.mockResolvedValue({ data: { langkah: "scan_tujuan_kedua", pesan: "ok", checkin: { id: 9 } } });
    selesai.mockResolvedValue({ data: { id: 9, status: "tidak_dihitung", alasan: "Kecepatan 9.0 m/s terlalu cepat untuk berjalan kaki." } });
    render(ui("/checkin", <CheckinPage />));
    await user.click(screen.getByLabelText(/Tanpa belanja/));
    await user.type(screen.getByLabelText("QR lapak atau titik awal"), "TJN-SRI");
    await user.click(screen.getByRole("button", { name: "Pindai" }));
    await user.type(await screen.findByLabelText("QR tujuan kedua"), "LPK-PSR-01");
    await user.click(screen.getByRole("button", { name: "Selesai" }));
    await waitFor(() => expect(screen.getByText("Check-in tidak dihitung")).toBeTruthy());
    expect(screen.getByText(/terlalu cepat/)).toBeTruthy();
  });
});

describe("Kartu dampak", () => {
  it("menampilkan SDGs dan menukar bibit", async () => {
    const user = userEvent.setup();
    render(ui("/dampak", <DampakPage />));
    await waitFor(() => expect(screen.getByText("Penanganan perubahan iklim")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tukar" }));
    await waitFor(() => expect(screen.getByText(/BBT-ABC123/)).toBeTruthy());
  });
});
