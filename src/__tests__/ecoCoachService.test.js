import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Modul memakai import.meta.env saat dimuat → muat ulang per tes dengan env yang dikunci.
async function load(url = "http://api.test/api") {
  vi.resetModules();
  vi.stubEnv("VITE_LARAVEL_API_URL", url);
  const session = await import("../services/sessionStore");
  const eco = await import("../services/ecoCoachService");
  const client = await import("../services/laravelClient");
  return { session, eco, client };
}
const json = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("askEcoCoach", () => {
  it("mode tanya: mengirim pertanyaan & koridor_id numerik, tanpa token bila tamu", async () => {
    const { eco } = await load();
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ data: { teks: "ISPU koridor 39.", sumber: "ai" } }));
    const h = await eco.askEcoCoach({ mode: "tanya", pertanyaan: "  Udara bagaimana?  ", koridorId: "3" });
    expect(h).toEqual({ teks: "ISPU koridor 39.", sumber: "ai" });
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("http://api.test/api/eco-coach");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ mode: "tanya", pertanyaan: "Udara bagaimana?", koridor_id: 3 });
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("koridor yang bukan angka positif tidak dikirim; pertanyaan dipotong 300 karakter", async () => {
    const { eco } = await load();
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ data: { teks: "ok", sumber: "template" } }));
    await eco.askEcoCoach({ mode: "tanya", pertanyaan: "a".repeat(400), koridorId: "pasar" });
    const body = JSON.parse(spy.mock.calls[0][1].body);
    expect(body.koridor_id).toBeUndefined();
    expect(body.pertanyaan).toHaveLength(300);
  });

  it("mode ringkasan: menyertakan token login dan tidak mengirim pertanyaan", async () => {
    const { eco, session } = await load();
    session.writeSession({ id: 1, name: "Uji" }, "tok-123");
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ data: { teks: "Ringkasan.", sumber: "template" } }));
    const h = await eco.askEcoCoach({ mode: "ringkasan" });
    expect(h.sumber).toBe("template");
    const [, init] = spy.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ mode: "ringkasan" });
    expect(init.headers.Authorization).toBe("Bearer tok-123");
  });

  it("ringkasan tanpa login → null tanpa memanggil server", async () => {
    const { eco } = await load();
    const spy = vi.spyOn(globalThis, "fetch");
    expect(await eco.askEcoCoach({ mode: "ringkasan" })).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("tanpa alamat API (mode mock) → null tanpa memanggil server", async () => {
    const { eco } = await load("");
    const spy = vi.spyOn(globalThis, "fetch");
    expect(await eco.askEcoCoach({ mode: "tanya", pertanyaan: "Halo" })).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("sumber selain 'ai' dianggap template; respons tanpa teks → null", async () => {
    const { eco } = await load();
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => json({ data: { teks: "x", sumber: "aneh" } }));
    expect((await eco.askEcoCoach({ mode: "tanya", pertanyaan: "Halo" })).sumber).toBe("template");
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => json({ data: {} }));
    expect(await eco.askEcoCoach({ mode: "tanya", pertanyaan: "Halo" })).toBeNull();
  });

  it("429 dilempar sebagai ApiError dengan pesan ramah", async () => {
    const { eco, client } = await load();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ message: "Too Many" }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "30" } })));
    const err = await eco.askEcoCoach({ mode: "tanya", pertanyaan: "Halo" }).catch((e) => e);
    expect(err).toBeInstanceOf(client.ApiError);
    expect(err.status).toBe(429);
    expect(err.friendlyMessage).toMatch(/30 detik/);
  });
});
