import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ScanPage from "../pages/ScanPage";
import CouponPage from "../pages/CouponPage";
import ChallengePage from "../pages/ChallengePage";
import ChargerDetailPage from "../pages/ChargerDetailPage";
import ActivityResultPage from "../pages/ActivityResultPage";
import { claimTierLocal, getJourney, resetJourney, saveActivity } from "../services/journeyStore";
import { ecoTip } from "../lib/ecoCoach";

function Where() {
  return <p data-testid="loc">{useLocation().pathname}</p>;
}
const app = (path, routes) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes>{routes}</Routes>
    <Where />
  </MemoryRouter>
);

beforeEach(() => {
  localStorage.clear();
  resetJourney();
});
afterEach(cleanup);

const act = (m, o = {}) => ({ startedAt: new Date().toISOString(), durationSec: 1800, distanceM: m, poin: Math.round(m / 1000 * 30), co2Kg: 0.5, rupiah: 1000, kkal: 100, pembanding: "motor", path: [], ...o });

describe("Alur Jejak Wangi", () => {
  it("scan QR awal → pop-up moda → tersimpan → beranda", async () => {
    const user = userEvent.setup();
    render(app("/q/1", <><Route path="/q/:koridorId" element={<ScanPage />} /><Route path="/home" element={<p>BERANDA</p>} /></>));
    expect(screen.getByText("Kamu kesini naik apa?")).toBeTruthy();
    const kirim = screen.getByRole("button", { name: /kirim/i });
    expect(kirim.disabled).toBe(true); // wajib memilih dulu
    await user.click(screen.getByRole("button", { name: /mobil/i }));
    await user.click(kirim);
    await waitFor(() => expect(screen.getByText("BERANDA")).toBeTruthy());
    expect(getJourney().transport).toBe("mobil");
    expect(getJourney().koridorId).toBe(1);
  });

  it("kode manual yang salah ditolak, yang benar membuka pop-up", async () => {
    const user = userEvent.setup();
    render(app("/scan", <Route path="/scan" element={<ScanPage />} />));
    await user.type(screen.getByLabelText(/kode koridor/i), "halo");
    await user.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByRole("alert").textContent).toMatch(/tidak dikenali/i);
    await user.clear(screen.getByLabelText(/kode koridor/i));
    await user.type(screen.getByLabelText(/kode koridor/i), "jejakwangi:koridor:2");
    await user.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByText("Kamu kesini naik apa?")).toBeTruthy();
  });

  it("scan QR akhir memverifikasi aktivitas lalu membuka hasil", async () => {
    const user = userEvent.setup();
    const { activity } = saveActivity(act(1000));
    render(app(`/scan/akhir/${activity.id}`, <><Route path="/scan/akhir/:id" element={<ScanPage mode="akhir" />} /><Route path="/aktivitas/selesai/:id" element={<p>HASIL</p>} /></>));
    await user.type(screen.getByLabelText(/kode koridor/i), "1");
    await user.click(screen.getByRole("button", { name: "Lanjut" }));
    await waitFor(() => expect(screen.getByText("HASIL")).toBeTruthy());
    expect(getJourney().activities[0].verified).toBe(true);
  });

  it("Lewati di scan akhir tetap membuka hasil tanpa verifikasi", async () => {
    const user = userEvent.setup();
    const { activity } = saveActivity(act(1000));
    render(app(`/scan/akhir/${activity.id}`, <><Route path="/scan/akhir/:id" element={<ScanPage mode="akhir" />} /><Route path="/aktivitas/selesai/:id" element={<p>HASIL</p>} /></>));
    await user.click(screen.getByRole("button", { name: "Lewati" }));
    expect(screen.getByText("HASIL")).toBeTruthy();
    expect(getJourney().activities[0].verified).toBeUndefined();
  });

  it("halaman misi: 3 tingkat kupon sesuai progres bulan ini, klaim menghasilkan kupon + cooldown", async () => {
    const user = userEvent.setup();
    saveActivity(act(3200));
    render(app("/misi", <Route path="/misi" element={<ChallengePage />} />));
    expect(screen.getByText("Pelari Mager")).toBeTruthy();
    expect(screen.getByText("Pelari Niat")).toBeTruthy();
    expect(screen.getByText("Pelari Kalcer")).toBeTruthy();
    const klaim = screen.getAllByRole("button", { name: "Klaim kupon" });
    expect(klaim).toHaveLength(2); // 1 km & 3 km tercapai, 5 km belum
    await user.click(klaim[0]);
    await waitFor(() => expect(getJourney().vouchers).toHaveLength(1));
    expect(getJourney().vouchers[0].title).toBe("Pelari Mager");
    await waitFor(() => expect(screen.getByText(/Cooldown/)).toBeTruthy());
    expect(screen.getAllByRole("button", { name: "Klaim kupon" })).toHaveLength(1);
  });

  it("halaman misi tidak menampilkan kartu kupon untuk progres 0", () => {
    render(app("/misi", <Route path="/misi" element={<ChallengePage />} />));
    expect(screen.queryByRole("button", { name: "Klaim kupon" })).toBeNull();
    expect(screen.getAllByText(/lagi bulan ini/).length).toBe(3);
  });

  it("memakai kupon: pindah ke tab Digunakan dan tidak bisa dipakai dua kali", async () => {
    const user = userEvent.setup();
    saveActivity(act(1500));
    claimTierLocal(1);
    render(app("/kupon", <Route path="/kupon" element={<CouponPage />} />));
    expect(screen.getByText("Air Mineral 1 pcs")).toBeTruthy();
    expect(screen.queryByLabelText(/tumbler/i)).toBeNull(); // bonus tumbler kini lewat QR kasir
    await user.click(screen.getByRole("button", { name: /gunakan sekarang/i }));
    await user.click(screen.getByRole("button", { name: /sudah dipakai/i }));
    await waitFor(() => expect(getJourney().vouchers[0].status).toBe("digunakan"));
    expect(screen.queryByRole("button", { name: /gunakan sekarang/i })).toBeNull();
  });

  it("hasil aktivitas: emisi terhindar dan ajakan klaim kupon yang sudah tercapai", async () => {
    const { activity } = saveActivity(act(5200, { startedAt: new Date().toISOString() }));
    render(app(`/aktivitas/selesai/${activity.id}`, <Route path="/aktivitas/selesai/:id" element={<ActivityResultPage />} />));
    expect(screen.getByText("Kerja bagus!")).toBeTruthy();
    expect(screen.getByText("3 kupon bisa diklaim")).toBeTruthy();
    expect(screen.getByRole("link", { name: /klaim kupon di misi/i })).toBeTruthy();
  });

  it("hasil aktivitas dengan id tidak dikenal tidak crash", () => {
    render(app("/aktivitas/selesai/xxx", <Route path="/aktivitas/selesai/:id" element={<ActivityResultPage />} />));
    expect(screen.getByText("Aktivitas tidak ditemukan.")).toBeTruthy();
  });

  it("detail charger: port penuh tidak bisa dipilih, tombol mulai mengarah ke pengisian", async () => {
    const user = userEvent.setup();
    render(app("/charger/1", <><Route path="/charger/:id" element={<ChargerDetailPage />} /><Route path="/charger/:id/isi" element={<p>ISI</p>} /></>));
    await waitFor(() => expect(screen.getByText("Charger Station 1")).toBeTruthy());
    const penuh = screen.getByRole("button", { name: /A4/ });
    expect(penuh.disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: /mulai charging/i }));
    expect(screen.getByText("ISI")).toBeTruthy();
  });
});

describe("Eco-Coach", () => {
  it("udara tidak sehat mengalahkan saran lain", () => {
    expect(ecoTip({ page: "misi", ispu: { value: 150 } })).toMatch(/kurang sehat/i);
  });
  it("cuaca panas diprioritaskan sebelum saran halaman", () => {
    expect(ecoTip({ page: "koridor", temperature: 35 })).toMatch(/panas/i);
  });
  it("saran misi mengikuti tingkat kupon berikutnya", () => {
    const tier = { nama: "Pelari Niat", targetKm: 3, status: "terkunci" };
    expect(ecoTip({ page: "misi", progressKm: 1.5, tier, hour: 10 })).toMatch(/1,5 km.*Pelari Niat/);
    expect(ecoTip({ page: "misi", progressKm: 3, tier: { ...tier, status: "bisa_diklaim" }, hour: 10 })).toMatch(/bisa diklaim/i);
    expect(ecoTip({ page: "misi", tier: null, hour: 10 })).toMatch(/cooldown/i);
  });
});
