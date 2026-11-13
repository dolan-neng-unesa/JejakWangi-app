// Setoran sampah: pindai QR lokasi → konfirmasi hasil timbang (poin) / minta koreksi. Hanya fetch yang dipalsukan.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => { vi.stubEnv("VITE_LARAVEL_API_URL", "http://api.test/api"); });

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TimbanganPage from "../pages/TimbanganPage";
import { writeSession } from "../services/sessionStore";

const resp = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
const W = { id: 9, code: "TMB-00009", station_name: "Sritanjung", total_kg: 4.5, points: 90, status: "menunggu_konfirmasi", status_label: "Menunggu konfirmasi", note: null, items: [{ label: "Sisa sayur", kg: 2, poin: 20 }, { label: "Botol plastik", kg: 1.5, poin: 60 }, { label: "Kertas", kg: 1, poin: 10 }] };

beforeEach(() => { localStorage.clear(); writeSession({ id: 1, name: "Sari" }, "tok-1"); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Setoran sampah & pangan (pengguna)", () => {
  it("menampilkan hasil timbang, lalu konfirmasi memanggil /waste/{id}/confirm dengan token", async () => {
    let status = W.status;
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).endsWith("/waste/9/confirm")) { status = "terkonfirmasi"; return resp({ message: "Terkonfirmasi. +90 poin masuk ke akunmu.", data: { ...W, status } }); }
      return resp({ data: [{ ...W, status }] });
    });
    render(<MemoryRouter><TimbanganPage /></MemoryRouter>);
    await screen.findByText("TMB-00009 · Sritanjung");
    expect(screen.getByText("Estimasi 90 poin")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Sesuai, ambil poin" }));
    await screen.findByText("Terkonfirmasi. +90 poin masuk ke akunmu.");
    const call = spy.mock.calls.find(([u]) => String(u).endsWith("/waste/9/confirm"));
    expect(call[1].method).toBe("POST");
    expect(call[1].headers.Authorization).toBe("Bearer tok-1");
    await waitFor(() => expect(screen.getByText("+90 poin masuk")).toBeTruthy());
  });

  it("minta koreksi wajib berisi catatan; QR lokasi dikirim apa adanya ke /waste/checkin", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation((url) => (String(url).endsWith("/waste/checkin")
      ? resp({ message: "Terhubung ke Sritanjung." }, 201) : resp({ data: [W] })));
    render(<MemoryRouter><TimbanganPage /></MemoryRouter>);
    await screen.findByText("TMB-00009 · Sritanjung");
    await userEvent.click(screen.getByRole("button", { name: "Minta koreksi" }));
    expect(screen.getByRole("button", { name: "Kirim koreksi" }).disabled).toBe(true);

    await userEvent.type(screen.getByLabelText("QR lokasi timbang"), "jejakwangi:timbang:BSS-001");
    await userEvent.click(screen.getByRole("button", { name: "Hubungkan" }));
    await screen.findByText("Terhubung ke Sritanjung.");
    const c = spy.mock.calls.find(([u]) => String(u).endsWith("/waste/checkin"));
    expect(JSON.parse(c[1].body)).toEqual({ station_code: "jejakwangi:timbang:BSS-001" });
  });
});
