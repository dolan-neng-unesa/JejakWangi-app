import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Modul service membaca import.meta.env saat dimuat, jadi dimuat ulang per test setelah env di-stub.
async function load(path, { api = true } = {}) {
  vi.resetModules();
  vi.stubEnv("VITE_LARAVEL_API_URL", api ? "http://api.test/api" : "");
  return import(/* @vite-ignore */ path);
}

const json = (body, init = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" }, ...init });

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sessionStore", () => {
  it("menyimpan dan membaca sesi, lalu menghapusnya", async () => {
    const s = await load("../services/sessionStore.js");
    s.writeSession({ id: 1, name: "A" }, "tok", null);
    expect(s.readSession()).toEqual({ token: "tok", user: { id: 1, name: "A" } });
    s.clearSession();
    expect(s.readSession()).toBeNull();
  });

  it("menganggap sesi kedaluwarsa sebagai tidak ada dan membersihkannya", async () => {
    const s = await load("../services/sessionStore.js");
    s.writeSession({ id: 1 }, "tok", new Date(Date.now() - 1000).toISOString());
    expect(s.readSession()).toBeNull();
    expect(localStorage.getItem("jejak_wangi_laravel_token")).toBeNull();
  });

  it("tidak melempar saat localStorage diblokir (mode privat)", async () => {
    const s = await load("../services/sessionStore.js");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(s.readSession()).toBeNull();
    expect(() => s.writeSession({ id: 1 }, "tok")).not.toThrow();
  });
});

describe("apiRequest / fetchLaravel", () => {
  it("422: ApiError membawa galat per kolom dan friendlyMessage memakai yang pertama", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "Data tidak valid", errors: { email: ["Email sudah dipakai."] } }, { status: 422 })));
    const { apiRequest, ApiError } = await load("../services/laravelClient.js");

    const err = await apiRequest("/auth/register", { method: "POST", body: {}, breaker: false }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.friendlyMessage).toBe("Email sudah dipakai.");
  });

  it("429: menyertakan Retry-After pada pesan", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "Too Many Attempts." }, { status: 429, headers: { "Retry-After": "42", "Content-Type": "application/json" } })));
    const { apiRequest } = await load("../services/laravelClient.js");

    const err = await apiRequest("/auth/login", { method: "POST", body: {}, breaker: false }).catch((e) => e);
    expect(err.retryAfter).toBe(42);
    expect(err.friendlyMessage).toContain("42 detik");
  });

  it("respons non-JSON (502 HTML dari proxy) menjadi ApiError, bukan SyntaxError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>Bad Gateway</html>", { status: 502 })));
    const { apiRequest, ApiError } = await load("../services/laravelClient.js");

    const err = await apiRequest("/koridors").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
  });

  it("401 pada request ber-token membersihkan sesi lokal", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "Unauthenticated." }, { status: 401 })));
    const session = await load("../services/sessionStore.js");
    session.writeSession({ id: 1 }, "tok");
    const { apiRequest } = await import("../services/laravelClient.js");

    await apiRequest("/auth/me", { auth: true, breaker: false }).catch(() => {});
    expect(session.readSession()).toBeNull();
  });

  it("melampirkan header Authorization hanya bila diminta", async () => {
    const fetchMock = vi.fn(async () => json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const session = await load("../services/sessionStore.js");
    session.writeSession({ id: 1 }, "tok-123");
    const { apiRequest } = await import("../services/laravelClient.js");

    await apiRequest("/koridors", { breaker: false });
    await apiRequest("/mood-logs", { method: "POST", body: {}, auth: "optional", breaker: false });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer tok-123");
  });

  it("timeout: ApiError jaringan dan pemutus sirkuit melewati request berikutnya", async () => {
    const fetchMock = vi.fn((_url, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    vi.stubGlobal("fetch", fetchMock);
    const { apiRequest } = await load("../services/laravelClient.js");

    const first = await apiRequest("/koridors", { timeoutMs: 20 }).catch((e) => e);
    expect(first.network).toBe(true);
    expect(first.message).toContain("terlalu lama");

    const second = await apiRequest("/koridors", { timeoutMs: 20 }).catch((e) => e);
    expect(second.network).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1); // request kedua tidak menyentuh jaringan
  });

  it("fetchLaravel menggabungkan GET identik yang sedang berjalan dan membuka pembungkus data", async () => {
    const fetchMock = vi.fn(async () => json({ data: [{ id: 1 }] }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchLaravel } = await load("../services/laravelClient.js");

    const [a, b] = await Promise.all([fetchLaravel("/koridors"), fetchLaravel("/koridors")]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual([{ id: 1 }]);
    expect(b).toBe(a);
  });
});

describe("authService", () => {
  it("login menyimpan sesi + masa berlaku dan mengirim email yang sudah di-trim", async () => {
    const fetchMock = vi.fn(async () => json({ user: { id: 7, name: "Levina", email: "l@x.id" }, token: "T", expires_at: new Date(Date.now() + 86400000).toISOString() }));
    vi.stubGlobal("fetch", fetchMock);
    const auth = await load("../services/authService.js");

    const user = await auth.signInWithEmail("  l@x.id ", "rahasia123");
    expect(user).toMatchObject({ uid: "laravel-7", email: "l@x.id", displayName: "Levina" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).email).toBe("l@x.id");
    expect(auth.getLaravelToken()).toBe("T");
  });

  it("login gagal 429 menampilkan pesan ramah dengan hitung mundur", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "x" }, { status: 429, headers: { "Retry-After": "30", "Content-Type": "application/json" } })));
    const auth = await load("../services/authService.js");
    await expect(auth.signInWithEmail("a@b.id", "password1")).rejects.toThrow(/30 detik/);
  });

  it("pendaftaran menolak sandi kurang dari 8 karakter tanpa menghubungi server", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const auth = await load("../services/authService.js");
    await expect(auth.registerWithEmail("a@b.id", "1234567", "A")).rejects.toThrow(/minimal 8/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validateLaravelSession: 401 menghapus sesi, galat jaringan TIDAK menghapusnya", async () => {
    const session = await load("../services/sessionStore.js");
    session.writeSession({ id: 1, name: "A", email: "a@b.id" }, "tok");

    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const auth = await import("../services/authService.js");
    await auth.validateLaravelSession();
    expect(session.readSession()).not.toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "Unauthenticated." }, { status: 401 })));
    await auth.validateLaravelSession();
    expect(session.readSession()).toBeNull();
  });

  it("validateLaravelSession: 403 (akun dinonaktifkan admin) menghapus sesi", async () => {
    const session = await load("../services/sessionStore.js");
    session.writeSession({ id: 1, name: "A", email: "a@b.id" }, "tok");
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "Akun dinonaktifkan" }, { status: 403 })));
    const auth = await import("../services/authService.js");

    await auth.validateLaravelSession();
    expect(session.readSession()).toBeNull();
  });

  it("tanpa VITE_LARAVEL_API_URL: login memakai sesi mock dan subscribeToAuthChanges melihatnya", async () => {
    const auth = await load("../services/authService.js", { api: false });
    const seen = [];
    const unsubscribe = auth.subscribeToAuthChanges((u) => seen.push(u?.uid ?? null));

    await auth.signInWithEmail("tamu@jejakwangi.app", "rahasia123");
    expect(seen).toEqual([null, "mock-tamu@jejakwangi.app"]);

    unsubscribe();
  });

  it("dengan VITE_LARAVEL_API_URL: sesi mock diabaikan, hanya sesi Laravel yang dihitung", async () => {
    localStorage.setItem("jejak_wangi_mock_user", JSON.stringify({ uid: "mock-x" }));
    vi.stubGlobal("fetch", vi.fn(async () => json({}, { status: 500 })));
    const auth = await load("../services/authService.js");
    const seen = [];
    const unsubscribe = auth.subscribeToAuthChanges((u) => seen.push(u?.uid ?? null));

    expect(seen).toEqual([null]);

    unsubscribe();
  });

  it("signOutUser membersihkan sesi Laravel DAN sesi mock, walau request logout gagal", async () => {
    const session = await load("../services/sessionStore.js");
    session.writeSession({ id: 1, name: "A", email: "a@b.id" }, "tok");
    localStorage.setItem("jejak_wangi_mock_user", JSON.stringify({ uid: "mock-x" }));
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    const auth = await import("../services/authService.js");

    await auth.signOutUser();
    expect(session.readSession()).toBeNull();
    expect(localStorage.getItem("jejak_wangi_mock_user")).toBeNull();
  });
});

describe("moodService", () => {
  it("ID sesi tamu acak per perangkat dan stabil antar-panggilan", async () => {
    const mood = await load("../services/moodService.js");
    const a = mood.getAnonymousSessionId();
    expect(a).toMatch(/^guest-.{8,}/);
    expect(a).not.toBe("guest-session");
    expect(mood.getAnonymousSessionId()).toBe(a);

    localStorage.clear(); // perangkat lain
    expect(mood.getAnonymousSessionId()).not.toBe(a);
  });

  it("submitMood melempar untuk 422 (tidak diam-diam jatuh ke fallback)", async () => {
    const fetchMock = vi.fn(async () => json({ message: "Data tidak valid", errors: { mood_score: ["Skor tidak valid."] } }, { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);
    const mood = await load("../services/moodService.js");

    await expect(mood.submitMood({ greenSpaceId: 1, moodScore: 9 })).rejects.toMatchObject({ status: 422 });
    expect(localStorage.getItem("jejak_wangi_mood_logs_mock")).toBeNull(); // tidak ada catatan palsu tersimpan
  });

  it("submitMood jatuh ke fallback hanya untuk galat server/jaringan", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "boom" }, { status: 500 })));
    const mood = await load("../services/moodService.js");

    const entry = await mood.submitMood({ greenSpaceId: 1, moodScore: 4 });
    expect(entry.mood_score).toBe(4);
    expect(entry.anonymous_session_id).toMatch(/^guest-/); // ID tamu nyata ikut tersimpan
  });

  it("ringkasan mock memakai skala 1–5 dan membandingkan id sebagai angka", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({}, { status: 500 })));
    const mood = await load("../services/moodService.js");
    await mood.submitMood({ greenSpaceId: "1", moodScore: 5 });
    await mood.submitMood({ greenSpaceId: 1, moodScore: 5 });

    const summary = await mood.getMoodSummary(1);
    expect(summary.total_entries).toBe(2);
    expect(summary.distribution[5]).toBe(2);
  });
});

describe("login sosial", () => {
  it("fetchAuthProviders membaca penyedia aktif dari backend", async () => {
    const fetchMock = vi.fn(async () => json({ google: { client_id: "gid.apps.googleusercontent.com" }, facebook: null }));
    vi.stubGlobal("fetch", fetchMock);
    const auth = await load("../services/authService.js");
    const providers = await auth.fetchAuthProviders();
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/auth/providers");
    expect(providers.google.client_id).toBe("gid.apps.googleusercontent.com");
    expect(providers.facebook).toBeNull();
  });

  it("fetchAuthProviders tidak melempar saat server mati — tombol sosial saja yang hilang", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const auth = await load("../services/authService.js");
    await expect(auth.fetchAuthProviders()).resolves.toEqual({ google: null, facebook: null });
  });

  it("signInWithSocial mengirim provider+token lalu menyimpan sesi", async () => {
    const fetchMock = vi.fn(async () => json({ user: { id: 9, name: "Sari", email: "s@x.id" }, token: "SOC", expires_at: null }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const auth = await load("../services/authService.js");
    const user = await auth.signInWithSocial("google", "id-token");
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/auth/social");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ provider: "google", token: "id-token" });
    expect(user).toMatchObject({ uid: "laravel-9", email: "s@x.id" });
    expect(auth.getLaravelToken()).toBe("SOC");
  });

  it("signInWithSocial meneruskan pesan galat server (mis. 409/503)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "Login Google belum dikonfigurasi di server." }, { status: 503 })));
    const auth = await load("../services/authService.js");
    await expect(auth.signInWithSocial("google", "x")).rejects.toThrow(/belum dikonfigurasi/);
  });
});
