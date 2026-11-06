import { useEffect, useRef, useState } from "react";
import { fetchAuthProviders, signInWithSocial } from "../../services/authService";
import { loadFacebookSdk, loadGoogleIdentity } from "../../services/socialSdk";

function FacebookLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#1877F2">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

/**
 * Tombol "Lanjutkan dengan Google / Facebook". Hanya penyedia yang aktif di backend
 * (GET /auth/providers) yang muncul; bila tidak ada, komponen ini tidak menampilkan apa pun.
 *
 * @param {() => void} onSuccess dipanggil setelah sesi tersimpan
 * @param {(message: string) => void} onError
 * @param {(busy: boolean) => void} [onBusyChange]
 */
export default function SocialLoginButtons({ onSuccess, onError, onBusyChange, disabled = false }) {
  const [providers, setProviders] = useState(null);
  const [busy, setBusy] = useState(false);
  const googleRef = useRef(null);

  // Callback terbaru disimpan di ref: SDK Google hanya menerima callback sekali saat initialize().
  const handlers = useRef({});
  handlers.current = { onSuccess, onError, onBusyChange };

  async function finish(provider, token) {
    setBusy(true);
    handlers.current.onBusyChange?.(true);
    try {
      await signInWithSocial(provider, token);
      handlers.current.onSuccess?.();
    } catch (err) {
      handlers.current.onError?.(err.message);
    } finally {
      setBusy(false);
      handlers.current.onBusyChange?.(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchAuthProviders().then((p) => !cancelled && setProviders(p));
    return () => {
      cancelled = true;
    };
  }, []);

  const googleClientId = providers?.google?.client_id;
  const facebookAppId = providers?.facebook?.app_id;
  const facebookVersion = providers?.facebook?.version;

  // Google: tombol resmi dirender oleh SDK ke dalam <div>.
  useEffect(() => {
    if (!googleClientId || !googleRef.current) return undefined;
    let cancelled = false;
    loadGoogleIdentity()
      .then((gid) => {
        if (cancelled || !googleRef.current) return;
        gid.initialize({
          client_id: googleClientId,
          callback: (res) => res?.credential && finish("google", res.credential),
        });
        const width = Math.min(400, Math.max(200, Math.round(googleRef.current.offsetWidth || 320)));
        googleRef.current.innerHTML = "";
        gid.renderButton(googleRef.current, { theme: "outline", size: "large", shape: "pill", text: "continue_with", locale: "id", width });
      })
      .catch((err) => !cancelled && handlers.current.onError?.(err.message));
    return () => {
      cancelled = true;
    };
  }, [googleClientId]);

  // Facebook: SDK dimuat lebih awal supaya FB.login() bisa dipanggil sinkron di handler klik
  // (kalau tidak, browser memblokirnya sebagai popup).
  useEffect(() => {
    if (!facebookAppId) return;
    loadFacebookSdk({ appId: facebookAppId, version: facebookVersion }).catch(() => {});
  }, [facebookAppId, facebookVersion]);

  function handleFacebook() {
    if (!window.FB) {
      handlers.current.onError?.("Layanan login Facebook belum siap. Coba lagi sebentar lagi.");
      return;
    }
    window.FB.login(
      (response) => {
        const token = response?.authResponse?.accessToken;
        if (token) finish("facebook", token);
        else if (response?.status !== "unknown") handlers.current.onError?.("Login Facebook dibatalkan.");
      },
      { scope: "public_profile,email" }
    );
  }

  if (!googleClientId && !facebookAppId) return null;

  return (
    <div className="flex flex-col items-center gap-3 w-full" aria-busy={busy}>
      <div className="flex items-center gap-3 w-full text-xs text-ink-500">
        <span className="flex-1 h-px bg-canopy-800/10" />
        atau
        <span className="flex-1 h-px bg-canopy-800/10" />
      </div>

      {googleClientId && (
        <div className={`w-full flex justify-center ${disabled || busy ? "pointer-events-none opacity-60" : ""}`}>
          <div ref={googleRef} className="min-h-[44px] w-full flex justify-center" />
        </div>
      )}

      {facebookAppId && (
        <button
          type="button"
          onClick={handleFacebook}
          disabled={disabled || busy}
          className="w-full max-w-[400px] flex items-center justify-center gap-2 rounded-full border border-canopy-800/15 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-sand-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <FacebookLogo />
          Lanjutkan dengan Facebook
        </button>
      )}
    </div>
  );
}
