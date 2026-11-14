import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import BottomNav from "../components/layout/BottomNav";
import { getToken } from "../services/sessionStore";
import { fetchMyReports, fetchReportMeta, respondReport, sendReport } from "../services/wasteService";

const TONE = { menunggu: "bg-sand-100 text-ink-700", diproses: "bg-amber-100 text-amber-800", selesai: "bg-canopy-100 text-canopy-800", ditolak: "bg-red-50 text-red-700" };
const tgl = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function LaporKoridorPage() {
  const navigate = useNavigate();
  const loggedIn = Boolean(getToken());
  const [meta, setMeta] = useState({ kategori: [], koridor: [] });
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ koridor_id: "", location: "", category: "", title: "", description: "" });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    if (!loggedIn) return setRows([]);
    try { setRows((await fetchMyReports()).data ?? []); } catch { setRows([]); }
  }, [loggedIn]);
  useEffect(() => { load(); if (loggedIn) fetchReportMeta().then((r) => setMeta(r.data)).catch(() => {}); }, [load, loggedIn]);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type) || f.size > 5 * 1048576) { setErrors({ file: "Berkas harus JPG, PNG, atau PDF maksimal 5 MB." }); e.target.value = ""; return; }
    setErrors({}); setFile(f);
  }
  async function submit(e) {
    e.preventDefault();
    const miss = Object.entries(form).filter(([, v]) => !String(v).trim()).map(([k]) => k);
    if (miss.length) return setErrors(Object.fromEntries(miss.map((k) => [k, "Wajib diisi."])));
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    if (file) body.append("evidence[]", file);
    setBusy(true); setErrors({});
    try {
      const r = await sendReport(body);
      setMsg({ ok: true, text: `Laporan ${r.data.code} terkirim. Status awal: Menunggu verifikasi.` });
      setForm({ koridor_id: "", location: "", category: "", title: "", description: "" }); setFile(null); if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (ex) { setMsg({ ok: false, text: ex.friendlyMessage || ex.message }); } finally { setBusy(false); }
  }
  async function tanggapi(id, action) {
    try { await respondReport(id, action); setMsg({ ok: true, text: action === "konfirmasi" ? "Terima kasih atas konfirmasimu." : "Permintaan peninjauan ulang dikirim." }); load(); } catch (ex) { setMsg({ ok: false, text: ex.friendlyMessage || ex.message }); }
  }
  const field = "w-full mt-1 rounded-xl border border-canopy-800/15 bg-white px-3 py-2.5 text-sm";

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center"><Icon name="chevronLeft" size={19} /></button>
          <h1 className="font-semibold text-ink-900">Lapor Koridor</h1>
        </div>
        <h2 className="font-display font-bold text-2xl text-ink-900 mt-5">Ada yang mengganggu?</h2>
        <p className="text-sm text-ink-500 mt-1">Laporanmu diverifikasi admin lalu diteruskan ke Dinas Lingkungan Hidup. Jangan kirim laporan darurat lewat layanan ini.</p>

        {!loggedIn ? <button onClick={() => navigate("/login")} className="w-full mt-5 bg-canopy-700 text-white rounded-2xl py-3 font-medium">Masuk untuk melapor</button> : (
          <form onSubmit={submit} noValidate className="mt-4 bg-white border border-canopy-800/10 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-ink-700">Koridor *
              <select value={form.koridor_id} onChange={set("koridor_id")} className={field}><option value="">Pilih koridor</option>{meta.koridor.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</select>
              {errors.koridor_id && <span className="text-red-600 font-normal">{errors.koridor_id}</span>}</label>
            <label className="block text-xs font-semibold text-ink-700">Kategori *
              <select value={form.category} onChange={set("category")} className={field}><option value="">Pilih kategori</option>{meta.kategori.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select>
              {errors.category && <span className="text-red-600 font-normal">{errors.category}</span>}</label>
            <label className="block text-xs font-semibold text-ink-700">Lokasi kejadian *<input value={form.location} onChange={set("location")} maxLength={200} placeholder="Jl. Diponegoro, dekat halte" className={field} />{errors.location && <span className="text-red-600 font-normal">{errors.location}</span>}</label>
            <label className="block text-xs font-semibold text-ink-700">Judul laporan *<input value={form.title} onChange={set("title")} maxLength={120} className={field} />{errors.title && <span className="text-red-600 font-normal">{errors.title}</span>}</label>
            <label className="block text-xs font-semibold text-ink-700">Deskripsi *<textarea rows={3} value={form.description} onChange={set("description")} maxLength={2000} className={field} />{errors.description && <span className="text-red-600 font-normal">{errors.description}</span>}</label>
            <label className="block text-xs font-semibold text-ink-700">Foto/dokumen (opsional, maks. 5 MB)<input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={pick} className="block w-full mt-1 text-sm" />{errors.file && <span className="text-red-600 font-normal">{errors.file}</span>}</label>
            <p className="text-[0.7rem] text-ink-500">Hindari wajah, nomor telepon, dan informasi pribadi pada bukti.</p>
            <button disabled={busy} className="w-full bg-canopy-700 text-white rounded-xl py-3 font-medium disabled:opacity-60">{busy ? "Mengirim…" : "Kirim untuk verifikasi"}</button>
          </form>
        )}
        {msg && <p role="status" className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm ${msg.ok ? "bg-canopy-100 text-canopy-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

        {rows?.length > 0 && <h2 className="text-sm font-semibold text-ink-900 mt-6 mb-2">Laporanmu</h2>}
        <div className="space-y-3">
          {(rows ?? []).map((r) => (
            <article key={r.id} className="bg-white border border-canopy-800/10 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2"><div><p className="text-xs text-ink-500">{r.code} · {tgl(r.created_at)} · {r.koridor}</p><p className="font-semibold text-ink-900">{r.title}</p></div><span className={`text-[0.7rem] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${TONE[r.status]}`}>{r.status_label}</span></div>
              {r.admin_note && <p className="text-sm text-ink-700 mt-2"><b>Kabar dari {r.assignee ?? "admin"}:</b> {r.admin_note}</p>}
              <ol className="mt-2 border-l-2 border-canopy-100 pl-3 space-y-1">{(r.history ?? []).map((h, i) => <li key={i} className="text-xs text-ink-500"><b className="text-ink-700">{h.title}</b> · {tgl(h.at)}</li>)}</ol>
              {["selesai", "ditolak"].includes(r.status) && <div className="flex gap-2 mt-3"><button onClick={() => tanggapi(r.id, "tinjau_ulang")} className="flex-1 border border-canopy-700 text-canopy-700 rounded-xl py-2.5 text-sm font-medium">Minta tinjau ulang</button><button onClick={() => tanggapi(r.id, "konfirmasi")} className="flex-1 bg-canopy-700 text-white rounded-xl py-2.5 text-sm font-medium">Konfirmasi hasil</button></div>}
            </article>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
