import { Component } from "react";

/**
 * Menangkap galat render (termasuk gagal memuat chunk halaman setelah deploy baru, saat
 * nama file lama sudah tidak ada) supaya pengguna melihat pesan + tombol muat ulang,
 * bukan layar putih. `resetKey` (mis. pathname) membersihkan galat saat pengguna pindah halaman.
 */
export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  // Pindah halaman (resetKey berubah) → buang galat lama supaya halaman baru dirender normal.
  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error) {
    console.error("[JEJAK WANGI] Galat tak tertangani di UI:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-sand-50 px-6 text-center">
        <h1 className="font-display font-bold text-lg text-ink-900">Halaman tidak dapat dimuat</h1>
        <p className="text-sm text-ink-500 max-w-xs">
          Terjadi kendala saat membuka halaman ini. Periksa koneksi internet, lalu coba muat ulang.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-canopy-700 text-sand-50 rounded-2xl px-6 py-3 font-medium"
        >
          Muat Ulang
        </button>
      </div>
    );
  }
}
