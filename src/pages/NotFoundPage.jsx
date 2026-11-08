import { Link } from "react-router-dom";
import Button from "../components/global/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 text-center px-6 bg-sand-50">
      <p className="font-display text-2xl text-canopy-950">Halaman tidak ditemukan</p>
      <p className="text-sm text-ink-500">Jalur ini belum ada di peta koridor SVARGA.</p>
      <Button as={Link} to="/home" variant="primary" className="mt-2">
        Kembali ke Beranda
      </Button>
    </div>
  );
}
