import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import Icon from "../components/global/Icon";
import { terbitkanQrTempatSendiri } from "../services/journeySync";

/** Mode kasir UMKM: tombol "Customer membawa tempat sendiri" → QR sekali pakai untuk dipindai pelanggan. */
export default function KasirPage() {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "idle" }); // idle | loading | ready | error
  const [img, setImg] = useState(null);
  const [sisa, setSisa] = useState(0);

  async function buat() {
    setState({ status: "loading" });
    setImg(null);
    const r = await terbitkanQrTempatSendiri();
    if (!r.ok) return setState({ status: "error", error: r.error });
    const url = await QRCode.toDataURL(r.qr_payload, { margin: 1, width: 280, errorCorrectionLevel: "M" });
    setImg(url);
    setState({ status: "ready", expiresAt: r.expires_at });
  }

  useEffect(() => {
    if (state.status !== "ready") return undefined;
    const tick = () => setSisa(Math.max(0, Math.round((new Date(state.expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [state]);

  const habis = state.status === "ready" && sisa === 0;

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"><Icon name="chevronLeft" size={19} /></button>
          <h1 className="font-semibold text-ink-900">Mode Kasir UMKM</h1>
        </div>
        <p className="text-sm text-ink-700 mt-5">Saat pelanggan membayar dan membawa tempat makan/minum sendiri, tekan tombol di bawah lalu minta pelanggan memindai QR-nya.</p>

        {state.status !== "ready" && (
          <button onClick={buat} disabled={state.status === "loading"} className="w-full mt-5 bg-canopy-700 text-sand-50 rounded-2xl py-4 font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            <Icon name="leaf" size={18} /> {state.status === "loading" ? "Membuat QR…" : "Customer membawa tempat sendiri"}
          </button>
        )}
        {state.status === "error" && <p role="alert" className="mt-3 text-sm rounded-xl bg-ochre-100 text-ochre-600 px-3 py-2">{state.error}</p>}

        {state.status === "ready" && (
          <div className="mt-5 bg-white border border-canopy-800/10 rounded-3xl p-5 text-center">
            <img src={img} alt="QR untuk pelanggan" className={`mx-auto h-64 w-64 ${habis ? "opacity-20" : ""}`} />
            <p className="mt-3 text-sm text-ink-700">{habis ? "QR kedaluwarsa." : `Berlaku ${Math.floor(sisa / 60)}:${String(sisa % 60).padStart(2, "0")} · sekali pakai`}</p>
            <button onClick={buat} className="w-full mt-4 border border-canopy-700 text-canopy-700 rounded-xl py-3 font-medium">{habis ? "Buat QR baru" : "Transaksi berikutnya (QR baru)"}</button>
          </div>
        )}
        <p className="text-xs text-ink-500 mt-4">Hanya akun yang ditautkan admin ke UMKM yang dapat membuat QR ini.</p>
      </div>
    </div>
  );
}
