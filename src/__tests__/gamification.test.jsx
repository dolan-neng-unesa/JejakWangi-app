import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const konfirmasi = vi.fn();
const terbitkan = vi.fn();
const board = vi.fn();
vi.mock("../services/journeySync", async (orig) => ({
  ...(await orig()),
  konfirmasiTempatSendiri: (...a) => konfirmasi(...a),
  terbitkanQrTempatSendiri: (...a) => terbitkan(...a),
  fetchLeaderboard: () => board(),
  syncJourney: () => Promise.resolve({ ok: false }),
}));

const { default: ScanPage } = await import("../pages/ScanPage");
const { default: KasirPage } = await import("../pages/KasirPage");
const { default: ChallengePage } = await import("../pages/ChallengePage");
const { default: ProfilePage } = await import("../pages/ProfilePage");
const { resetJourney, applyServerState } = await import("../services/journeyStore");

beforeEach(() => {
  localStorage.clear();
  resetJourney();
  konfirmasi.mockReset();
  terbitkan.mockReset();
  board.mockReset().mockResolvedValue(null);
});
afterEach(cleanup);

const TOKEN = "k".repeat(40);
const ui = (path, routes) => (<MemoryRouter initialEntries={[path]}><Routes>{routes}</Routes></MemoryRouter>);

describe("Scan QR tempat sendiri (pelanggan)", () => {
  const halaman = ui("/scan/tempat-sendiri", <><Route path="/scan/tempat-sendiri" element={<ScanPage mode="byo" />} /><Route path="/misi" element={<p>MISI</p>} /></>);

  it("kode tempel valid → dikirim ke server → tampil cooldown yang berkurang", async () => {
    const user = userEvent.setup();
    konfirmasi.mockResolvedValue({ ok: true, applied: true, message: "Cooldown kuponmu berkurang 1 hari. Terima kasih!", cooldowns: [{ tier: 1, nama: "Pelari Mager", cooldown_until: "2026-12-14T00:00:00Z", sudah_bisa_diklaim: false }] });
    render(halaman);
    await user.type(screen.getByLabelText(/tempel kode/i), `jejakwangi:byo:${TOKEN}`);
    await user.click(screen.getByRole("button", { name: "Lanjut" }));
    await waitFor(() => expect(screen.getByText("Cooldown berkurang!")).toBeTruthy());
    expect(konfirmasi).toHaveBeenCalledWith(TOKEN);
    expect(screen.getByText(/Pelari Mager: bisa diklaim/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Ke Misi" }));
    expect(screen.getByText("MISI")).toBeTruthy();
  });

  it("kode tidak valid ditolak tanpa memanggil server", async () => {
    const user = userEvent.setup();
    render(halaman);
    await user.type(screen.getByLabelText(/tempel kode/i), "jejakwangi:koridor:1");
    await user.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByRole("alert").textContent).toMatch(/tidak dikenali/i);
    expect(konfirmasi).not.toHaveBeenCalled();
  });

  it("galat server (QR kedaluwarsa) ditampilkan dengan opsi scan lagi", async () => {
    const user = userEvent.setup();
    konfirmasi.mockResolvedValue({ ok: false, error: "QR sudah kedaluwarsa. Minta kasir membuat QR baru." });
    render(halaman);
    await user.type(screen.getByLabelText(/tempel kode/i), TOKEN);
    await user.click(screen.getByRole("button", { name: "Lanjut" }));
    await waitFor(() => expect(screen.getByText("QR tidak dapat dipakai")).toBeTruthy());
    expect(screen.getByText(/kedaluwarsa/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Scan lagi" }));
    expect(screen.queryByText("QR tidak dapat dipakai")).toBeNull();
  });

  it("belum ada kupon cooldown → terima kasih tanpa klaim berkurang, ada opsi scan lagi", async () => {
    const user = userEvent.setup();
    konfirmasi.mockResolvedValue({ ok: true, applied: false, message: "Belum ada kupon yang sedang cooldown.", cooldowns: [] });
    render(halaman);
    await user.type(screen.getByLabelText(/tempel kode/i), TOKEN);
    await user.click(screen.getByRole("button", { name: "Lanjut" }));
    await waitFor(() => expect(screen.getByText("Terima kasih!")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Scan lagi" })).toBeTruthy();
  });
});

describe("Mode kasir", () => {
  it("tombol menerbitkan QR sekali pakai dan menampilkan hitung mundur", async () => {
    const user = userEvent.setup();
    terbitkan.mockResolvedValue({ ok: true, qr_payload: `jejakwangi:byo:${TOKEN}`, expires_at: new Date(Date.now() + 300000).toISOString() });
    render(ui("/kasir", <Route path="/kasir" element={<KasirPage />} />));
    await user.click(screen.getByRole("button", { name: /customer membawa tempat sendiri/i }));
    await waitFor(() => expect(screen.getByAltText("QR untuk pelanggan")).toBeTruthy());
    expect(screen.getByAltText("QR untuk pelanggan").getAttribute("src")).toMatch(/^data:image\/png/);
    expect(screen.getByText(/Berlaku \d:\d\d · sekali pakai/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /QR baru/ })).toBeTruthy();
  });

  it("akun non-kasir melihat penjelasan galat", async () => {
    const user = userEvent.setup();
    terbitkan.mockResolvedValue({ ok: false, error: "Hanya akun kasir UMKM yang dapat membuat QR ini." });
    render(ui("/kasir", <Route path="/kasir" element={<KasirPage />} />));
    await user.click(screen.getByRole("button", { name: /customer membawa tempat sendiri/i }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/akun kasir/i));
  });
});

describe("Leaderboard & badge", () => {
  const baris = (n) => Array.from({ length: n }, (_, i) => ({ rank: i + 1, name: `Warga ${i + 1}`, km: 50 - i * 0.2, badge: i < 10 ? { kode: ["top-1", "top-3", "top-3", "top-5", "top-5"][i] ?? "top-10", label: "x" } : null, is_me: i === 3 }));

  it("menampilkan 10 teratas, 'tampilkan semua' membuka hingga 100, dan baris sendiri ditandai", async () => {
    const user = userEvent.setup();
    board.mockResolvedValue({ rows: baris(100), me: null, period: null });
    render(ui("/misi", <Route path="/misi" element={<ChallengePage />} />));
    await waitFor(() => expect(screen.getByText("Warga 1")).toBeTruthy());
    expect(screen.queryByText("Warga 11")).toBeNull();
    expect(screen.getByText(/Warga 4 \(kamu\)/)).toBeTruthy();
    expect(screen.getAllByText(/Top \d+|x/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /tampilkan semua \(100\)/i }));
    expect(screen.getByText("Warga 100")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ringkas" })).toBeTruthy();
  });

  it("pengguna di luar daftar melihat posisinya sendiri", async () => {
    board.mockResolvedValue({ rows: baris(5), me: { rank: 142, km: 0.8, badge: null }, period: null });
    render(ui("/misi", <Route path="/misi" element={<ChallengePage />} />));
    await waitFor(() => expect(screen.getByText(/Posisimu/)).toBeTruthy());
    expect(screen.getByText("#142")).toBeTruthy();
  });

  it("server tidak terjangkau → penjelasan, bukan galat", async () => {
    render(ui("/misi", <Route path="/misi" element={<ChallengePage />} />));
    await waitFor(() => expect(screen.getByText(/masuk dan terhubung ke server/i)).toBeTruthy());
  });

  it("badge dari server tampil di profil bersama peringkat", () => {
    applyServerState({ vouchers: [], summary: { points: 10, bulan_km: 6, rank_bulan: 3, badge: { kode: "top-3", label: "Top 3" } }, tiers: [] });
    render(ui("/profil", <Route path="/profil" element={<ProfilePage />} />));
    expect(screen.getByText("Top 3")).toBeTruthy();
    expect(screen.getByText(/peringkat #3/)).toBeTruthy();
  });

  it("tanpa badge (di luar Top 10) profil tidak menampilkan chip", () => {
    applyServerState({ vouchers: [], summary: { points: 10, bulan_km: 1, rank_bulan: 40, badge: null }, tiers: [] });
    render(ui("/profil", <Route path="/profil" element={<ProfilePage />} />));
    expect(screen.queryByText(/peringkat #/)).toBeNull();
  });
});
