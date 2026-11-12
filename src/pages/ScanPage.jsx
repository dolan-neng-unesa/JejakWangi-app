import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/global/Icon";
import { MODA, parseByoToken, parseKoridorFromQr } from "../lib/journey";
import { konfirmasiTempatSendiri } from "../services/journeySync";
import { markVerified, setArrival } from "../services/journeyStore";

function TransportSheet({ koridorId, onSubmit }) {
  const [pilih, setPilih] = useState(null);
  return (
    <div className="fixed inset-0 z-[900] flex items-end sm:items-center justify-center bg-canopy-950/55 px-4 pb-6" role="dialog" aria-modal="true" aria-labelledby="tr-title">
      <div className="w-full max-w-md bg-white rounded-[1.75rem] p-5 shadow-xl">
        <p className="text-xs font-semibold tracking-wide uppercase text-canopy-700 flex items-center gap-1.5">
          <Icon name="pin" size={14} /> Titik awal koridor {koridorId ?? ""}
        </p>
        <h2 id="tr-title" className="font-display font-bold text-xl text-ink-900 mt-1">Kamu kesini naik apa?</h2>
        <p className="text-sm text-ink-500 mt-1">Jawabanmu dipakai untuk menghitung emisi yang berhasil kamu hindari.</p>
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          {Object.entries(MODA).map(([key, m]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPilih(key)}
              aria-pressed={pilih === key}
              className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-sm font-medium text-left transition-colors ${
                pilih === key ? "border-canopy-700 bg-canopy-100 text-canopy-800" : "border-canopy-800/10 bg-sand-50 text-ink-900"
              }`}
            >
              <Icon name={m.icon} size={20} />
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!pilih}
          onClick={() => onSubmit(pilih)}
          className="w-full mt-4 bg-canopy-700 text-sand-50 rounded-2xl py-3.5 font-medium disabled:bg-canopy-200 disabled:text-canopy-500"
        >
          Kirim & masuk beranda
        </button>
      </div>
    </div>
  );
}

/**
 * mode "awal": scan di titik awal koridor (+ pop-up moda). mode "akhir": scan di titik akhir untuk menutup aktivitas.
 * mode "byo": pelanggan memindai QR kasir "membawa tempat sendiri" (memangkas cooldown kupon).
 */
export default function ScanPage({ mode = "awal" }) {
  const navigate = useNavigate();
  const { koridorId: paramId, id: actId } = useParams();
  const akhir = mode === "akhir";
  const byo = mode === "byo";
  const parse = byo ? parseByoToken : parseKoridorFromQr;
  const hasil = `/aktivitas/selesai/${actId}`;
  const videoRef = useRef(null);
  const [koridorId, setKoridorId] = useState(paramId && mode === "awal" ? Number(paramId) : null); // untuk mode byo: berisi token
  const [byoHasil, setByoHasil] = useState(null);
  const [camera, setCamera] = useState("idle"); // idle | on | unsupported | denied
  const [manual, setManual] = useState("");
  const [error, setError] = useState("");

  // Kamera + BarcodeDetector (Chrome/Android). Safari/Firefox belum punya → pakai kode manual/demo.
  useEffect(() => {
    if (koridorId != null) return undefined;
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
      setCamera("unsupported");
      return undefined;
    }
    let stream;
    let raf;
    let stopped = false;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
        setCamera("on");
        const tick = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const id = parse(codes[0]?.rawValue);
            if (id != null) {
              setKoridorId(id);
              return;
            }
          } catch {
            // frame belum siap
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => setCamera("denied"));
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [koridorId, parse]);

  useEffect(() => {
    if (akhir && koridorId != null) {
      markVerified(actId);
      navigate(hasil, { replace: true });
    }
  }, [akhir, koridorId, actId, hasil, navigate]);

  // Mode byo: kirim token ke server begitu terbaca.
  useEffect(() => {
    if (!byo || koridorId == null) return undefined;
    let off = false;
    setByoHasil({ loading: true });
    konfirmasiTempatSendiri(koridorId).then((r) => !off && setByoHasil(r));
    return () => { off = true; };
  }, [byo, koridorId]);

  function submitManual(e) {
    e.preventDefault();
    const id = parse(manual);
    if (id == null) return setError(byo ? "QR tidak dikenali. Pindai QR dari kasir atau tempel kodenya." : "Kode tidak dikenali. Contoh: 1 atau svarga:koridor:1");
    setError("");
    setKoridorId(id);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canopy-950 text-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold tracking-wide text-lg">JEJAK WANGI</span>
          <button onClick={() => navigate(akhir ? hasil : byo ? "/misi" : "/home")} className="text-sm text-sand-100/80 underline underline-offset-2">Lewati</button>
        </div>
        <h1 className="font-display font-bold text-2xl mt-6">{byo ? "Scan QR tempat sendiri" : akhir ? "Scan QR di titik akhir" : "Scan QR di titik awal koridor"}</h1>
        <p className="text-sm text-sand-100/80 mt-1">{byo ? "Pindai QR dari kasir setelah membayar dengan membawa tempat makan sendiri." : akhir ? "Pindai QR di ujung koridor untuk memverifikasi perjalananmu." : "Arahkan kamera ke kode QR untuk memulai Jejak Wangi."}</p>

        <div className="relative mt-5 aspect-square w-full rounded-[1.75rem] overflow-hidden bg-canopy-900 border border-white/10">
          <video ref={videoRef} muted playsInline className={`h-full w-full object-cover ${camera === "on" ? "" : "hidden"}`} />
          {camera !== "on" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center text-sand-100/80">
              <Icon name="camera" size={34} />
              <p className="text-sm">
                {camera === "denied" && "Izin kamera ditolak. Gunakan kode manual di bawah."}
                {camera === "unsupported" && "Peramban ini belum mendukung pemindai QR. Gunakan kode manual di bawah."}
                {camera === "idle" && "Menyiapkan kamera…"}
              </p>
            </div>
          )}
          <span className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-sand-50/70" />
        </div>

        <form onSubmit={submitManual} className="mt-5">
          <label htmlFor="kode" className="text-xs text-sand-100/70">{byo ? "Atau tempel kode dari kasir" : "Atau masukkan kode koridor"}</label>
          <div className="flex gap-2 mt-1.5">
            <input
              id="kode"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              inputMode="text"
              placeholder={byo ? "svarga:byo:…" : "mis. 1"}
              className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3.5 py-2.5 text-sm placeholder:text-sand-100/40 focus:outline-none focus:border-sand-50/60"
            />
            <button className="rounded-xl bg-sand-50 text-canopy-800 px-4 text-sm font-semibold">Lanjut</button>
          </div>
          {error && <p role="alert" className="text-xs text-ochre-100 mt-1.5">{error}</p>}
        </form>
      </div>

      {koridorId != null && mode === "awal" && (
        <TransportSheet
          koridorId={koridorId}
          onSubmit={(transport) => {
            setArrival({ transport, koridorId });
            navigate("/home", { replace: true });
          }}
        />
      )}
      {byo && byoHasil && (
        <div className="fixed inset-0 z-[900] flex items-end justify-center bg-canopy-950/55 px-4 pb-6" role="dialog" aria-modal="true" aria-label="Hasil scan">
          <div className="w-full max-w-md bg-white rounded-[1.75rem] p-5 text-ink-900">
            {byoHasil.loading ? (
              <p className="text-sm text-ink-500 text-center py-4">Memeriksa QR…</p>
            ) : (
              <>
                <h2 className="font-display font-bold text-xl">{byoHasil.ok && byoHasil.applied ? "Cooldown berkurang!" : byoHasil.ok ? "Terima kasih!" : "QR tidak dapat dipakai"}</h2>
                <p className="text-sm text-ink-700 mt-1">{byoHasil.ok ? byoHasil.message : byoHasil.error}</p>
                {byoHasil.ok && byoHasil.cooldowns?.length > 0 && (
                  <ul className="mt-3 text-sm rounded-xl bg-canopy-100/70 px-3 py-2 flex flex-col gap-1">
                    {byoHasil.cooldowns.map((c) => (
                      <li key={c.tier}>{c.nama}: {c.sudah_bisa_diklaim ? "sudah bisa diklaim" : `bisa diklaim ${new Date(c.cooldown_until).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}</li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2.5 mt-4">
                  {!(byoHasil.ok && byoHasil.applied) && <button onClick={() => { setByoHasil(null); setKoridorId(null); }} className="flex-1 border border-canopy-700 text-canopy-700 rounded-xl py-3 font-medium">Scan lagi</button>}
                  <button onClick={() => navigate("/misi")} className="flex-1 bg-canopy-700 text-sand-50 rounded-xl py-3 font-medium">Ke Misi</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
