import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, Marker, Popup, Polyline, CircleMarker, Tooltip, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PageShell from "../components/layout/PageShell";
import BaseTileLayer from "../components/map/BaseTileLayer";
import FitBounds from "../components/map/FitBounds";
import LocateControl from "../components/map/LocateControl";
import { getGreenSpaces, getKoridorList } from "../services/koridorService";
import { getUmkmList } from "../services/contentService";
import { useSnappedPaths } from "../hooks/useSnappedPaths";
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from "../lib/mapTiles";
import { formatDistance, toLatLng } from "../lib/geo";
import { isValidPath } from "../lib/roadSnap";
import { loadPathOverrides, savePathOverrides } from "../lib/koridorPathOverrides";

const asArray = (r) => (r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []);

// Warna mengikuti tingkat kehijauan koridor (hijau_level); koridor "rencana" digaris putus.
const LEVEL_STYLE = {
  paling_hijau: { color: "#2b6339", label: "Paling hijau" },
  agak_hijau: { color: "#5f8f64", label: "Agak hijau" },
  setengah_hijau: { color: "#d4a039", label: "Setengah hijau" },
  tidak_hijau: { color: "#b3492d", label: "Tidak hijau" },
};
const styleOf = (k) => LEVEL_STYLE[k.hijau_level] ?? { color: "#7a8a7e", label: "" };

// Klik peta = tambah titik jalur (hanya aktif di mode edit).
function ClickToAdd({ onAdd }) {
  useMapEvents({ click: (e) => onAdd([Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))]) });
  return null;
}

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("edit") === "1";

  const [data, setData] = useState({ spaces: [], koridors: [], umkms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [overrides, setOverrides] = useState(loadPathOverrides);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getGreenSpaces(), getKoridorList(), getUmkmList()]).then(([s, k, u]) => {
      if (cancelled) return;
      const koridors = asArray(k);
      setData({ spaces: asArray(s), koridors, umkms: asArray(u) });
      if (s.status === "rejected" || k.status === "rejected") {
        setError("Sebagian data peta gagal dimuat. Coba muat ulang halaman.");
      }
      setSelectedId((cur) => cur ?? koridors[0]?.id ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Waypoint tiap koridor: gambar tim (override lokal) > field `path` dari API/mock.
  const entries = useMemo(
    () =>
      data.koridors
        .map((k) => ({ id: k.id, path: isValidPath(overrides[k.id]) ? overrides[k.id] : k.path }))
        .filter((e) => isValidPath(e.path)),
    [data.koridors, overrides]
  );
  const snapped = useSnappedPaths(entries);

  const lines = useMemo(
    () =>
      data.koridors
        .filter((k) => snapped[k.id])
        .map((k) => ({ koridor: k, ...snapped[k.id] })),
    [data.koridors, snapped]
  );
  const withoutPath = useMemo(() => data.koridors.filter((k) => !snapped[k.id]), [data.koridors, snapped]);

  const umkmPoints = useMemo(
    () => data.umkms.map((u) => ({ umkm: u, pos: toLatLng(u.latitude, u.longitude) })).filter((x) => x.pos),
    [data.umkms]
  );
  const spacePoints = useMemo(
    () => data.spaces.map((s) => ({ space: s, pos: toLatLng(s.latitude, s.longitude) })).filter((x) => x.pos),
    [data.spaces]
  );

  const boundsPoints = useMemo(
    () => [...spacePoints.map((x) => x.pos), ...lines.flatMap((l) => l.path)],
    [spacePoints, lines]
  );

  const selected = data.koridors.find((k) => k.id === selectedId) ?? null;
  const selectedLine = lines.find((l) => l.koridor.id === selectedId) ?? null;

  // --- Mode edit ---
  const draft = useMemo(() => (selected ? overrides[selected.id] ?? [] : []), [selected, overrides]);
  const updateDraft = useCallback(
    (next) => {
      if (!selected) return;
      setOverrides((prev) => {
        const copy = { ...prev };
        if (next.length) copy[selected.id] = next;
        else delete copy[selected.id];
        savePathOverrides(copy);
        return copy;
      });
    },
    [selected]
  );
  const addPoint = useCallback((pt) => updateDraft([...draft, pt]), [draft, updateDraft]);

  const copyJson = async () => {
    const out = Object.fromEntries(Object.entries(overrides).map(([id, p]) => [id, p]));
    try {
      await navigator.clipboard.writeText(JSON.stringify(out, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin JSON jalur koridor:", JSON.stringify(out));
    }
  };

  return (
    <PageShell title="Peta Koridor" hideNav={false}>
      <div className="relative rounded-2xl overflow-hidden border border-canopy-800/10 h-[60vh]">
        <MapContainer center={MAP_CENTER} zoom={MAP_DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
          <BaseTileLayer />
          <FitBounds points={editMode ? [] : boundsPoints} />
          {editMode && <ClickToAdd onAdd={addPoint} />}

          {lines.map(({ koridor, path, snapped: isSnapped }) => {
            const st = styleOf(koridor);
            const isSel = koridor.id === selectedId;
            const planned = koridor.status !== "pilot";
            return (
              <Polyline
                key={`${koridor.id}-${isSnapped ? "s" : "w"}-${path.length}`}
                positions={path}
                pathOptions={{
                  color: st.color,
                  weight: isSel ? 7 : 4,
                  opacity: isSel ? 1 : 0.75,
                  dashArray: planned && !isSel ? "8 8" : undefined,
                }}
                eventHandlers={{ click: () => setSelectedId(koridor.id) }}
              >
                <Tooltip sticky>
                  {koridor.formal_name}
                  {koridor.route_label ? ` · ${koridor.route_label}` : ""}
                </Tooltip>
              </Polyline>
            );
          })}

          {lines.map(({ koridor, path }) => (
            <CircleMarker
              key={`start-${koridor.id}`}
              center={path[0]}
              radius={koridor.id === selectedId ? 7 : 5}
              pathOptions={{ color: styleOf(koridor).color, fillColor: "#fff", fillOpacity: 1, weight: 3 }}
              eventHandlers={{ click: () => setSelectedId(koridor.id) }}
            >
              <Tooltip direction="top">Awal · K{koridor.id}</Tooltip>
            </CircleMarker>
          ))}

          {editMode &&
            draft.map((pt, i) => (
              <CircleMarker
                key={`wp-${i}`}
                center={pt}
                radius={5}
                pathOptions={{ color: "#1e3a8a", fillColor: "#3b82f6", fillOpacity: 1, weight: 2 }}
              >
                <Tooltip direction="top">Titik {i + 1}</Tooltip>
              </CircleMarker>
            ))}

          {spacePoints.map(({ space, pos }) => (
            <Marker key={`gs-${space.id}`} position={pos}>
              <Popup>
                <strong>{space.name}</strong>
                {space.address && <div>{space.address}</div>}
              </Popup>
            </Marker>
          ))}

          {umkmPoints.map(({ umkm, pos }) => (
            <CircleMarker
              key={`umkm-${umkm.id}`}
              center={pos}
              radius={7}
              pathOptions={{ color: "#d4a039", fillColor: "#d4a039", fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <strong>{umkm.business_name}</strong>
                {umkm.business_type && <div>{umkm.business_type}</div>}
              </Popup>
            </CircleMarker>
          ))}

          <LocateControl />
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/60 text-sm text-ink-700">
            Memuat peta…
          </div>
        )}
      </div>

      {error && <p className="text-xs text-alert-600 mt-3">{error}</p>}

      {/* Pilih koridor */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 -mx-1 px-1">
        {data.koridors.map((k) => {
          const on = k.id === selectedId;
          return (
            <button
              key={k.id}
              onClick={() => setSelectedId(k.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                on ? "bg-canopy-700 text-sand-50 border-canopy-700" : "bg-white text-ink-700 border-canopy-800/15"
              }`}
            >
              K{k.id} · {k.short_name}
            </button>
          );
        })}
      </div>

      {selected && !editMode && (
        <div className="mt-3 rounded-2xl bg-white border border-canopy-800/10 p-3.5">
          <p className="font-medium text-sm text-ink-900">{selected.formal_name}</p>
          {selected.route_label && <p className="text-xs text-ink-500 mt-0.5">{selected.route_label}</p>}
          {selectedLine ? (
            <p className="text-xs text-ink-700 mt-1.5">
              {formatDistance(selectedLine.distanceMeters)} •{" "}
              {selectedLine.snapped ? "mengikuti jalan pada peta" : "jalur perkiraan (belum dicocokkan ke jalan)"}
            </p>
          ) : (
            <p className="text-xs text-ochre-600 mt-1.5">Jalur koridor ini belum digambar di peta.</p>
          )}
          <Link to={`/koridor/${selected.id}`} className="inline-block text-xs font-medium text-canopy-700 mt-2">
            Lihat detail koridor →
          </Link>
        </div>
      )}

      {editMode && selected && (
        <div className="mt-3 rounded-2xl border border-info-600/30 bg-white p-3.5 text-xs text-ink-700">
          <p className="font-medium text-sm text-ink-900">Mode edit jalur — {selected.formal_name}</p>
          <p className="mt-1">
            Ketuk peta di sepanjang jalan koridor ini, berurutan dari awal ke akhir (cukup tiap belokan/perempatan).
            Garis otomatis menempel ke jalan. Titik: {draft.length}.
          </p>
          <div className="flex flex-wrap gap-2 mt-2.5">
            <button onClick={() => updateDraft(draft.slice(0, -1))} disabled={!draft.length} className="rounded-full border border-canopy-800/20 px-3 py-1.5 disabled:opacity-40">
              Urungkan
            </button>
            <button onClick={() => updateDraft([])} disabled={!draft.length} className="rounded-full border border-canopy-800/20 px-3 py-1.5 disabled:opacity-40">
              Hapus gambar
            </button>
            <button onClick={copyJson} disabled={!Object.keys(overrides).length} className="rounded-full bg-canopy-700 text-sand-50 px-3 py-1.5 disabled:opacity-40">
              {copied ? "Tersalin ✓" : "Salin JSON semua koridor"}
            </button>
          </div>
          <p className="mt-2 text-ink-500">
            Gambar tersimpan di perangkat ini. Agar permanen, tempel JSON ke <code>KoridorSeeder.php</code> (kolom <code>path</code>) lalu{" "}
            <code>php artisan migrate:fresh --seed</code>, dan ke <code>mockGreenSpaces.js</code>.
          </p>
        </div>
      )}

      {withoutPath.length > 0 && (
        <p className="text-xs text-ink-500 mt-3">
          Belum ada jalur untuk: {withoutPath.map((k) => `K${k.id} ${k.short_name}`).join(", ")}. Gambar lewat{" "}
          <Link to="/map?edit=1" className="underline">mode edit</Link>.
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-700 mt-3">
        {Object.values(LEVEL_STYLE).map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="h-1 w-5 rounded" style={{ background: l.color }} /> {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ochre-500" /> UMKM
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600" /> Lokasi Anda
        </span>
      </div>
      <p className="text-xs text-ink-500 mt-2">
        Peta dasar: OpenStreetMap (Leaflet.js). Garis solid = koridor pilot, garis putus = koridor rencana.
      </p>
    </PageShell>
  );
}
