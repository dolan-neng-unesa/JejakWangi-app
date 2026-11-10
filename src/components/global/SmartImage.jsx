import { useState } from "react";

// Placeholder bawaan (daun hijau di latar krem) — inline, jadi tidak butuh file
// atau jaringan. Dipakai saat src kosong atau gambar gagal dimuat (404, server
// Laravel mati, host berbeda, dst.), supaya tidak muncul ikon gambar rusak.
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#dfe8e0"/>` +
      `<path d="M48 70c-14 0-22-9-22-22 0-12 10-22 30-24 0 22-6 36-8 46z" fill="#3f6e45" opacity=".85"/>` +
      `<path d="M48 70c0-12 3-22 10-32" stroke="#faf9f6" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`
  );

/**
 * <img> dengan fallback. Urutan: src -> fallbackSrc (mis. aset yang dibundel app)
 * -> placeholder. `hideOnError` menyembunyikan gambar sama sekali (untuk latar
 * dekoratif yang sudah punya cadangan, seperti gradasi di GeofenceAlert).
 */
export default function SmartImage({ src, fallbackSrc, hideOnError = false, alt = "", ...rest }) {
  const [stage, setStage] = useState(0); // 0 = src, 1 = fallbackSrc, 2 = placeholder
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setStage(0);
  }

  const chain = [src, fallbackSrc].filter(Boolean);
  const current = stage < chain.length ? chain[stage] : null;

  if (!current) {
    if (hideOnError) return null;
    return <img src={PLACEHOLDER} alt={alt} {...rest} />;
  }
  return <img src={current} alt={alt} onError={() => setStage((s) => s + 1)} {...rest} />;
}
