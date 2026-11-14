import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../services/ecoCoachService", () => ({ askEcoCoach: vi.fn() }));

import EcoCoach from "../components/global/EcoCoach";
import EcoCoachChatPage from "../pages/EcoCoachChatPage";
import { askEcoCoach } from "../services/ecoCoachService";
import { ecoTip } from "../lib/ecoCoach";

const wrap = (ui, path = "/") => <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>;

beforeEach(() => askEcoCoach.mockReset());
afterEach(cleanup);

describe("Kartu EcoCoach", () => {
  it("tanpa prop ai: hanya saran aturan, server tidak dipanggil", () => {
    render(wrap(<EcoCoach page="koridor" />));
    expect(screen.getByText(ecoTip({ page: "koridor" }))).toBeTruthy();
    expect(askEcoCoach).not.toHaveBeenCalled();
    expect(screen.queryByTestId("eco-coach-sumber")).toBeNull();
  });

  it("dengan ai: saran aturan tampil dulu, lalu diganti jawaban AI berlabel 'Dijelaskan AI'", async () => {
    let selesai;
    askEcoCoach.mockReturnValue(new Promise((r) => { selesai = r; }));
    render(wrap(<EcoCoach page="hasil" ai={{ mode: "ringkasan", koridorId: 2 }} />));
    expect(screen.getByText(ecoTip({ page: "hasil" }))).toBeTruthy(); // tidak pernah kosong saat menunggu
    expect(askEcoCoach).toHaveBeenCalledWith({ mode: "ringkasan", koridorId: 2, pertanyaan: undefined });

    selesai({ teks: "Kamu berjalan 450 m.", sumber: "ai" });
    await waitFor(() => expect(screen.getByText("Kamu berjalan 450 m.")).toBeTruthy());
    expect(screen.getByTestId("eco-coach-sumber").textContent).toBe("Dijelaskan AI");
    expect(screen.queryByText(ecoTip({ page: "hasil" }))).toBeNull();
  });

  it("jawaban template diberi label 'Ringkasan otomatis'", async () => {
    askEcoCoach.mockResolvedValue({ teks: "Pada kunjungan terakhir kamu berjalan 450 m.", sumber: "template" });
    render(wrap(<EcoCoach page="hasil" ai={{ mode: "ringkasan" }} />));
    await waitFor(() => expect(screen.getByTestId("eco-coach-sumber").textContent).toBe("Ringkasan otomatis"));
  });


  it("prop message tetap menggantikan saran aturan; tautan tanya hanya tampil bila diminta", () => {
    const { rerender } = render(wrap(<EcoCoach message="Saran khusus koridor ini." />));
    expect(screen.getByText("Saran khusus koridor ini.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /tanya eco-coach/i })).toBeNull();
    rerender(wrap(<EcoCoach message="x" tanyaLink="/eco-coach?koridor=3" />));
    expect(screen.getByRole("link", { name: /tanya eco-coach/i }).getAttribute("href")).toBe("/eco-coach?koridor=3");
  });
});

describe("Halaman chat Eco-Coach", () => {
  const halaman = (path = "/eco-coach") => wrap(<Routes><Route path="/eco-coach" element={<EcoCoachChatPage />} /></Routes>, path);

  it("mengirim pertanyaan beserta koridor dari URL dan menampilkan jawaban berlabel", async () => {
    const user = userEvent.setup();
    askEcoCoach.mockResolvedValue({ teks: "ISPU koridor saat ini 39 (Baik).", sumber: "ai" });
    render(halaman("/eco-coach?koridor=3"));
    await user.type(screen.getByLabelText(/pertanyaan untuk eco-coach/i), "Udara sekarang bagaimana?");
    await user.click(screen.getByRole("button", { name: "Kirim" }));

    await waitFor(() => expect(screen.getByText("ISPU koridor saat ini 39 (Baik).")).toBeTruthy());
    expect(askEcoCoach).toHaveBeenCalledWith({ mode: "tanya", pertanyaan: "Udara sekarang bagaimana?", koridorId: "3" });
    expect(screen.getByText("Udara sekarang bagaimana?")).toBeTruthy();
    expect(screen.getByText("Dijelaskan AI")).toBeTruthy();
    expect(screen.getByLabelText(/pertanyaan untuk eco-coach/i).value).toBe("");
  });

  it("tombol kirim nonaktif untuk pertanyaan kosong/terlalu pendek", async () => {
    const user = userEvent.setup();
    render(halaman());
    const kirim = screen.getByRole("button", { name: "Kirim" });
    expect(kirim.disabled).toBe(true);
    await user.type(screen.getByLabelText(/pertanyaan untuk eco-coach/i), "a");
    expect(kirim.disabled).toBe(true);
    await user.type(screen.getByLabelText(/pertanyaan untuk eco-coach/i), "b");
    expect(kirim.disabled).toBe(false);
  });

  it("contoh pertanyaan bisa diklik langsung", async () => {
    const user = userEvent.setup();
    askEcoCoach.mockResolvedValue({ teks: "ISPU adalah indeks pencemar udara.", sumber: "template" });
    render(halaman());
    await user.click(screen.getByRole("button", { name: "Apa arti ISPU?" }));
    await waitFor(() => expect(screen.getByText("ISPU adalah indeks pencemar udara.")).toBeTruthy());
    expect(askEcoCoach.mock.calls[0][0]).toMatchObject({ pertanyaan: "Apa arti ISPU?" });
  });


  it("server tidak tersedia (null) → pesan tidak bisa dihubungi, bukan layar kosong", async () => {
    const user = userEvent.setup();
    askEcoCoach.mockResolvedValue(null);
    render(halaman());
    await user.type(screen.getByLabelText(/pertanyaan untuk eco-coach/i), "Halo Eco-Coach");
    await user.click(screen.getByRole("button", { name: "Kirim" }));
    await waitFor(() => expect(screen.getByText(/sedang tidak bisa dihubungi/)).toBeTruthy());
  });
});
