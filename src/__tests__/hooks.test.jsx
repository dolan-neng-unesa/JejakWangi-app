import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "../hooks/usePolling";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mounted = [];
async function render(element) {
  const container = document.createElement("div");
  const root = createRoot(container);
  mounted.push(root);
  await act(async () => root.render(element));
  return root;
}

afterEach(async () => {
  while (mounted.length) {
    const root = mounted.pop();
    await act(async () => root.unmount());
  }
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function setHidden(hidden) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setHidden(false);
  });

  function Poller({ task, interval = 1000, enabled = true, resetKey }) {
    usePolling(task, interval, enabled, resetKey);
    return null;
  }

  it("memanggil task segera lalu tiap interval", async () => {
    const task = vi.fn(async () => {});
    await render(createElement(Poller, { task }));
    expect(task).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(1000));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(task).toHaveBeenCalledTimes(3);
  });

  it("tidak menumpuk request: tick berikutnya menunggu tick yang lambat selesai", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const task = vi.fn(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 3500)); // jauh lebih lambat dari interval 1 dtk
      inFlight--;
    });
    await render(createElement(Poller, { task }));

    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(maxInFlight).toBe(1);
  });

  it("berhenti saat tab tersembunyi dan menyegarkan langsung saat kembali terlihat", async () => {
    const task = vi.fn(async () => {});
    await render(createElement(Poller, { task }));
    expect(task).toHaveBeenCalledTimes(1);

    setHidden(true);
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(task).toHaveBeenCalledTimes(1); // tidak ada request selama tersembunyi

    await act(async () => setHidden(false));
    expect(task).toHaveBeenCalledTimes(2); // segar seketika
  });

  it("backoff eksponensial saat task melempar galat", async () => {
    const task = vi.fn(async () => {
      throw new Error("down");
    });
    await render(createElement(Poller, { task }));
    expect(task).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(2000)); // 1 galat → jeda 2 dtk
    expect(task).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(2000)); // 2 galat → jeda 4 dtk, belum waktunya
    expect(task).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(task).toHaveBeenCalledTimes(3);
  });

  it("enabled=false tidak melakukan polling, resetKey memulai ulang dan membatalkan hasil lama", async () => {
    const cancelledFlags = [];
    const task = vi.fn(async ({ isCancelled }) => {
      await new Promise((r) => setTimeout(r, 500));
      cancelledFlags.push(isCancelled());
    });

    const root = await render(createElement(Poller, { task, enabled: false }));
    expect(task).not.toHaveBeenCalled();

    await act(async () => root.render(createElement(Poller, { task, resetKey: "a" })));
    expect(task).toHaveBeenCalledTimes(1);

    await act(async () => root.render(createElement(Poller, { task, resetKey: "b" }))); // ganti koridor
    expect(task).toHaveBeenCalledTimes(2); // tick langsung, tanpa menunggu interval

    await act(async () => vi.advanceTimersByTimeAsync(600));
    expect(cancelledFlags[0]).toBe(true); // hasil request "a" ditandai batal
    expect(cancelledFlags[1]).toBe(false);
  });
});

describe("GeofenceProvider", () => {
  const zoneA = { id: 1, name: "A", latitude: -8.2, longitude: 114.3, radius_meter: 100, soundscape_id: 10 };
  const zoneB = { id: 2, name: "B", latitude: -8.3, longitude: 114.4, radius_meter: 100, soundscape_id: 11 };
  let services;
  let geo;
  let watchCallbacks;

  beforeEach(async () => {
    vi.resetModules();
    watchCallbacks = null;
    geo = {
      watchPosition: vi.fn((ok, fail) => {
        watchCallbacks = { ok, fail };
        return 42;
      }),
      clearWatch: vi.fn(),
    };
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: geo });
  });

  // Provider dimuat ulang dengan service ter-mock supaya jumlah panggilan bisa dihitung.
  async function setup({ zonesDelay = 0 } = {}) {
    vi.doMock("../services/geofenceService", async () => {
      const actual = await vi.importActual("../services/geofenceService");
      return {
        ...actual,
        getActiveGeofences: vi.fn(() => new Promise((r) => setTimeout(() => r([zoneA, zoneB]), zonesDelay))),
        getSoundscape: vi.fn(async (id) => ({ id, title: `Soundscape ${id}` })),
      };
    });
    services = await import("../services/geofenceService");
    const { GeofenceProvider: Provider } = await import("../context/GeofenceContext");
    const { useGeofence: useGeo } = await import("../hooks/useGeofence");

    const ref = { current: null };
    function Probe() {
      ref.current = useGeo();
      return null;
    }
    await render(createElement(Provider, null, createElement(Probe)));
    // Tunggu daftar zona selesai dimuat (kecuali test yang sengaja menguji kondisi "belum termuat").
    if (zonesDelay === 0) await act(async () => new Promise((r) => setTimeout(r, 10)));
    return ref;
  }

  const at = (zone) => ({ coords: { latitude: zone.latitude, longitude: zone.longitude } });
  const far = { coords: { latitude: 0, longitude: 0 } };

  it("mendeteksi zona walau daftar zona baru selesai dimuat SETELAH pemantauan dimulai (stale closure lama)", async () => {
    vi.useFakeTimers();
    const ref = await setup({ zonesDelay: 1000 });

    await act(async () => ref.current.startWatching()); // zona belum termuat
    await act(async () => vi.advanceTimersByTimeAsync(1000)); // sekarang termuat
    vi.useRealTimers();

    await act(async () => watchCallbacks.ok(at(zoneA)));
    expect(ref.current.activeZone?.id).toBe(1);
  });

  it("update posisi berulang di zona yang sama tidak memicu ulang alert/soundscape", async () => {
    const ref = await setup();
    await act(async () => ref.current.startWatching());

    for (let i = 0; i < 5; i++) await act(async () => watchCallbacks.ok(at(zoneA)));
    expect(services.getSoundscape).toHaveBeenCalledTimes(1);
  });

  it("setelah ditutup, alert tidak muncul lagi di zona sama, tapi muncul lagi setelah keluar dan masuk kembali", async () => {
    const ref = await setup();
    await act(async () => ref.current.startWatching());

    await act(async () => watchCallbacks.ok(at(zoneA)));
    await act(async () => ref.current.closeAlert());
    await act(async () => watchCallbacks.ok(at(zoneA)));
    expect(ref.current.activeZone).toBeNull(); // masih di zona yang sama → tetap tertutup

    await act(async () => watchCallbacks.ok(far)); // keluar zona
    await act(async () => watchCallbacks.ok(at(zoneA))); // masuk lagi
    expect(ref.current.activeZone?.id).toBe(1);
  });

  it("soundscape yang sama di-cache; zona lain memuat soundscape-nya sendiri", async () => {
    const ref = await setup();
    await act(async () => ref.current.simulateZone(zoneA));
    await act(async () => ref.current.simulateZone(zoneA));
    await act(async () => ref.current.simulateZone(zoneB));

    expect(services.getSoundscape).toHaveBeenCalledTimes(2);
    expect(ref.current.activeSoundscape.id).toBe(11);
  });

  it("galat izin lokasi membersihkan watch sehingga pemantauan bisa dimulai ulang, dan menampilkan pesan", async () => {
    const ref = await setup();
    await act(async () => ref.current.startWatching());
    await act(async () => watchCallbacks.fail({ code: 1 }));

    expect(ref.current.watching).toBe(false);
    expect(ref.current.watchError).toMatch(/izin lokasi/i);
    expect(geo.clearWatch).toHaveBeenCalledWith(42);

    await act(async () => ref.current.startWatching()); // dulu: berhenti di "sudah berjalan"
    expect(geo.watchPosition).toHaveBeenCalledTimes(2);
    expect(ref.current.watching).toBe(true);
    expect(ref.current.watchError).toBeNull();
  });
});
