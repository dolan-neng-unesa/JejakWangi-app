import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import KoridorDetailPage from "../pages/KoridorDetailPage";
import KoridorListPage from "../pages/KoridorListPage";

// Tanpa backend: services/* jatuh ke data mock (data/mockGreenSpaces.js).
beforeEach(() => vi.stubEnv("VITE_LARAVEL_API_URL", ""));
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const detail = (id) => (
  <MemoryRouter initialEntries={[`/koridor/${id}`]}>
    <Routes>
      <Route path="/koridor/:id" element={<KoridorDetailPage />} />
    </Routes>
  </MemoryRouter>
);

describe("Koridor Pasar Induk", () => {
  it("daftar koridor: Pasar di posisi 2 dan jumlah wilayah dinamis", async () => {
    render(
      <MemoryRouter>
        <KoridorListPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Corridor Pasar")).toBeTruthy());
    const nama = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(nama[0]).toBe("RTH Sritanjung");
    expect(nama[1]).toBe("Corridor Pasar");
    expect(screen.getByText(/7 wilayah pemantauan/)).toBeTruthy();
  });

  it("detail: judul, kunjungan hari ini, saran Eco-Coach, dan dampak bersama", async () => {
    render(detail(7));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Koridor Pasar Induk" })).toBeTruthy());
    expect(screen.getByText("Pasar Induk Banyuwangi")).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Kunjunganmu hari ini" })).toBeTruthy();
    expect(screen.getByText("Parkir sekali, jalan 450 m")).toBeTruthy();
    expect(screen.getByText("Hemat 120 g CO₂")).toBeTruthy();
    expect(screen.getByText("Bawa tas sendiri di 2 lapak")).toBeTruthy();
    expect(screen.getByText("ISPU 45 · Baik")).toBeTruthy();
    expect(screen.getByText("SDG 3 & 11")).toBeTruthy();

    // Saran Eco-Coach khusus koridor ini menggantikan saran generik (tidak muncul dua kali).
    expect(screen.getAllByLabelText("Saran Eco-Coach")).toHaveLength(1);
    expect(screen.getByText(/sebelum pukul 07\.00/)).toBeTruthy();

    const dampak = screen.getByRole("heading", { name: "Dampak bersama kita" }).closest("section");
    expect(within(dampak).getByText("Bulan ini")).toBeTruthy();
    expect(within(dampak).getByText("Warga Sritanjung–Blambangan")).toBeTruthy();
    expect(within(dampak).getByText("85")).toBeTruthy();
    expect(within(dampak).getByText("1.240")).toBeTruthy(); // format id-ID
    expect(within(dampak).getByText(/300 kg sampah sayur pasar/)).toBeTruthy();
  });

  it("koridor tanpa highlights tetap memakai tampilan standar", async () => {
    render(detail(2));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Kalilo/ })).toBeTruthy());
    expect(screen.queryByRole("heading", { name: "Kunjunganmu hari ini" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Dampak bersama kita" })).toBeNull();
    expect(screen.getAllByLabelText("Saran Eco-Coach")).toHaveLength(1);
  });
});
