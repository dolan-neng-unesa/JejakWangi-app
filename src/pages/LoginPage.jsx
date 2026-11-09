import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/global/Button";
import Icon from "../components/global/Icon";
import SocialLoginButtons from "../components/auth/SocialLoginButtons";
import {
  signInWithEmail,
  registerWithEmail,
  MIN_PASSWORD_LENGTH,
} from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);

  const isRegister = mode === "register";

  /** Validasi sisi klien: pesan langsung tanpa menunggu round-trip ke server. */
  function validate() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Masukkan alamat email yang valid.";
    if (!password) return "Kata sandi wajib diisi.";
    if (isRegister && password.length < MIN_PASSWORD_LENGTH) {
      return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || socialBusy) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      navigate("/scan");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50 px-6 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="max-w-md mx-auto w-full flex flex-col items-center">
        <span className="h-14 w-14 rounded-2xl bg-canopy-700 text-sand-50 flex items-center justify-center">
          <Icon name="leaf" size={26} />
        </span>
        <h1 className="font-display font-bold text-xl text-ink-900 mt-3 tracking-wide">SVARGA</h1>
        <p className="text-ink-500 text-sm mt-1">
          {isRegister ? "Buat akun baru" : "Selamat datang kembali!"}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-md mx-auto w-full mt-8 flex flex-col gap-4">
        {isRegister && (
          <div>
            <label htmlFor="name" className="text-sm font-medium text-ink-900">
              Nama
            </label>
            <div className="flex items-center gap-2 mt-1.5 bg-white rounded-2xl border border-canopy-800/10 px-3.5 py-3 focus-within:border-canopy-700">
              <input
                id="name"
                type="text"
                placeholder="Nama panggilan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-500/60"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="identifier" className="text-sm font-medium text-ink-900">
            Email
          </label>
          <div className="flex items-center gap-2 mt-1.5 bg-white rounded-2xl border border-canopy-800/10 px-3.5 py-3 focus-within:border-canopy-700">
            <input
              id="identifier"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="contoh@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-500/60"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink-900">
            Kata Sandi
          </label>
          <div className="flex items-center gap-2 mt-1.5 bg-white rounded-2xl border border-canopy-800/10 px-3.5 py-3 focus-within:border-canopy-700">
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-500/60"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>
          {isRegister && (
            <p className="text-xs text-ink-500 mt-1.5">Minimal {MIN_PASSWORD_LENGTH} karakter.</p>
          )}
        </div>

        {error && (
          <p className="text-xs text-alert-600 bg-alert-600/10 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full mt-1" disabled={loading || socialBusy}>
          {loading ? "Memproses…" : isRegister ? "Daftar" : "Masuk"}
        </Button>
      </form>

      <div className="max-w-md mx-auto w-full mt-5">
        <SocialLoginButtons
          disabled={loading}
          onBusyChange={setSocialBusy}
          onError={setError}
          onSuccess={() => navigate("/scan")}
        />
      </div>

      <div className="max-w-md mx-auto w-full flex flex-col items-center gap-4 mt-6">
        <p className="text-sm text-ink-700">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? "login" : "register");
              setError("");
            }}
            className="text-canopy-700 font-semibold"
          >
            {isRegister ? "Masuk" : "Daftar"}
          </button>
        </p>
        <Link to="/home" className="text-xs text-ink-500 underline underline-offset-2">
          Lewati, jelajahi sebagai tamu
        </Link>
      </div>
    </div>
  );
}
