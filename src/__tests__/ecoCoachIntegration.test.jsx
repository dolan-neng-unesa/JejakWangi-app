// Alur nyata kartu & chat -> askEcoCoach -> apiRequest -> fetch (hanya fetch yang dipalsukan).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => { vi.stubEnv("VITE_LARAVEL_API_URL", "http://api.test/api"); });

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EcoCoach from "../components/global/EcoCoach";
import EcoCoachChatPage from "../pages/EcoCoachChatPage";
import { writeSession } from "../services/sessionStore";
import { ecoTip } from "../lib/ecoCoach";

const resp = (body, status = 200, headers = {}) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } }));
const wrap = (ui) => <MemoryRouter>{ui}</MemoryRouter>;

beforeEach(() => { localStorage.clear(); writeSession({ id: 1, name: "Uji" }, "tok-1"); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Eco-Coach end-to-end (fetch dipalsukan)", () => {
  it("kartu: server error 500 → saran aturan tetap tampil, tanpa label sumber", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => resp({ message: "boom" }, 500));
    render(wrap(<EcoCoach page="hasil" ai={{ mode: "ringkasan" }} />));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.getByText(ecoTip({ page: "hasil" }))).toBeTruthy();
    expect(screen.queryByTestId("eco-coach-sumber")).toBeNull();
  });

  it("kartu: sukses → memanggil /eco-coach dengan token & menampilkan jawaban berlabel", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => resp({ data: { teks: "Kamu berjalan 450 m.", sumber: "ai" } }));
    render(wrap(<EcoCoach page="hasil" ai={{ mode: "ringkasan" }} />));
    await waitFor(() => expect(screen.getByText("Kamu berjalan 450 m.")).toBeTruthy());
    expect(spy.mock.calls[0][0]).toBe("http://api.test/api/eco-coach");
    expect(spy.mock.calls[0][1].headers.Authorization).toBe("Bearer tok-1");
    expect(screen.getByTestId("eco-coach-sumber").textContent).toBe("Dijelaskan AI");
  });

  it("chat: 429 dari server tampil sebagai pesan ramah dengan waktu tunggu", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => resp({ message: "Too Many Attempts." }, 429, { "Retry-After": "20" }));
    render(wrap(<Routes><Route path="/" element={<EcoCoachChatPage />} /></Routes>));
    await user.type(screen.getByLabelText(/pertanyaan untuk eco-coach/i), "Halo Eco-Coach");
    await user.click(screen.getByRole("button", { name: "Kirim" }));
    await waitFor(() => expect(screen.getByText(/dalam 20 detik/)).toBeTruthy());
  });
});
