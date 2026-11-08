import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/global/Button";
import Icon from "../components/global/Icon";
import {
  signInWithEmail,
  registerWithEmail,
  signInWithGoogle,
} from "../services/authService";

function SocialButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={disabled ? "Segera hadir" : label}
      onClick={onClick}
      disabled={disabled}
      className="h-11 w-11 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center shadow-sm hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(fn) {
    setError("");
    setLoading(true);
    try {
      await fn();
      navigate("/home");
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

      <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full mt-8 flex flex-col gap-4">
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
            Email atau Nomor Telepon
          </label>
          <div className="flex items-center gap-2 mt-1.5 bg-white rounded-2xl border border-canopy-800/10 px-3.5 py-3 focus-within:border-canopy-700">
            <input
              id="identifier"
              type="text"
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
          {!isRegister && (
            <div className="text-right mt-1.5">
              <button type="button" className="text-xs text-canopy-700 font-medium">
                Lupa kata sandi?
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-alert-600 bg-alert-600/10 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full mt-1" disabled={loading}>
          {loading ? "Memproses…" : isRegister ? "Daftar" : "Masuk"}
        </Button>
      </form>

      <div className="max-w-md mx-auto w-full flex flex-col items-center gap-4 mt-6">
        <p className="text-xs text-ink-500">Atau masuk dengan</p>
        <div className="flex items-center gap-4">
          <SocialButton label="Masuk dengan Google" onClick={() => handleSocial(signInWithGoogle)} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z" />
            </svg>
          </SocialButton>
          <SocialButton label="Masuk dengan Apple" disabled>
            <Icon name="drop" size={18} className="text-ink-900" />
          </SocialButton>
          <SocialButton label="Masuk dengan Facebook" disabled>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
            </svg>
          </SocialButton>
        </div>
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
