import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/global/Icon";
import Skeleton from "../components/global/Skeleton";
import BottomNav from "../components/layout/BottomNav";
import { getFestivalsByMonth } from "../services/contentService";
import route1 from "../assets/pages/home/route1.png";
import route2 from "../assets/pages/home/route2.png";

const FALLBACK_IMAGES = [route1, route2];
const WEEKDAYS = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];
const CATEGORIES = [
  { id: "budaya", label: "Budaya", emoji: "🏛️", text: "text-amber-600" },
  { id: "pariwisata", label: "Pariwisata", emoji: "🌿", text: "text-canopy-700" },
  { id: "seni", label: "Seni", emoji: "🎭", text: "text-violet-600" },
];
const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const BOOKMARK_KEY = "svarga_bfest_bookmarks";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYearMonth(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}
function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatTimeRange(start, end) {
  if (!start) return null;
  const fmt = (t) => t.slice(0, 5).replace(":", ".");
  return end ? `${fmt(start)} – ${fmt(end)} WIB` : `${fmt(start)} WIB`;
}

export default function BwiFestPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [category, setCategory] = useState(null); // null = "Semua"
  const [events, setEvents] = useState(null); // null = loading
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    setEvents(null);
    getFestivalsByMonth(toYearMonth(currentMonth), category)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [currentMonth, category]);

  useEffect(() => {
    setSelectedDate(null); // bulan/kategori berganti -> reset tanggal terpilih
  }, [currentMonth, category]);

  function toggleBookmark(id) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  const eventsByDay = useMemo(() => {
    const map = new Map();
    (events ?? []).forEach((e) => {
      const day = Number(e.date.split("-")[2]);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(e);
    });
    return map;
  }, [events]);

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7; // grid mulai Senin
  const cells = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const visibleEvents = useMemo(() => {
    let list = events ?? [];
    if (selectedDate) {
      list = list.filter((e) => Number(e.date.split("-")[2]) === selectedDate.getDate());
    } else {
      const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
      list = list.filter((e) => e.date >= todayStr);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (e) => e.bfest_name.toLowerCase().includes(q) || (e.address ?? e.location_name ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, selectedDate, searchText]);

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center shrink-0"
          >
            <Icon name="chevronLeft" size={19} className="text-ink-900" />
          </button>
          <h1 className="font-display font-bold text-lg text-canopy-800">Kalender BWI Fest</h1>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Cari event"
            className="h-9 w-9 rounded-full bg-white border border-canopy-800/10 flex items-center justify-center shrink-0"
          >
            <Icon name="search" size={18} className="text-ink-900" />
          </button>
        </div>

        {searchOpen && (
          <input
            autoFocus
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Cari nama event atau lokasi..."
            className="w-full mt-3 rounded-xl border border-canopy-800/15 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-canopy-600"
          />
        )}

        {/* Kartu kalender */}
        <div className="bg-white rounded-2xl border border-canopy-800/10 p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold text-ink-900">
              {currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                aria-label="Bulan sebelumnya"
                className="h-7 w-7 rounded-full flex items-center justify-center text-ink-500 hover:bg-sand-100"
              >
                <Icon name="chevronLeft" size={16} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                aria-label="Bulan berikutnya"
                className="h-7 w-7 rounded-full flex items-center justify-center text-ink-500 hover:bg-sand-100"
              >
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-1.5 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-[0.65rem] font-medium text-ink-400">
                {w}
              </span>
            ))}
            {cells.map((day, i) => {
              if (day == null) return <div key={`b${i}`} />;
              const date = new Date(year, month, day);
              const hasEvent = eventsByDay.has(day);
              const isToday = isSameDate(date, today);
              const isSelected = selectedDate && isSameDate(date, selectedDate);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                  className={`mx-auto flex flex-col items-center justify-center h-9 w-9 rounded-full text-sm transition-colors ${
                    isSelected
                      ? "ring-2 ring-violet-500 text-violet-700 font-semibold"
                      : isToday
                      ? "bg-ochre-100 text-ochre-600 font-semibold"
                      : hasEvent
                      ? "bg-canopy-100 text-canopy-800"
                      : "text-ink-700"
                  }`}
                >
                  {day}
                  {hasEvent && <span className="h-1 w-1 rounded-full bg-canopy-600 -mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter kategori */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 py-4 no-scrollbar">
          <button
            onClick={() => setCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === null ? "bg-canopy-800 text-white" : "bg-white border border-canopy-800/10 text-ink-700"
            }`}
          >
            Semua
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id === category ? null : c.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === c.id ? "bg-canopy-800 text-white" : "bg-white border border-canopy-800/10 text-ink-700"
              }`}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Daftar event */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-ink-900">
            {selectedDate
              ? selectedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long" })
              : "Event Mendatang"}
          </h2>
          {selectedDate && (
            <button onClick={() => setSelectedDate(null)} className="text-sm font-medium text-canopy-700 flex items-center gap-1">
              Lihat Semua <Icon name="chevronRight" size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {events === null && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}

          {events !== null && visibleEvents.length === 0 && (
            <div className="bg-white rounded-2xl border border-canopy-800/10 p-6 text-center text-sm text-ink-500">
              Tidak ada event{selectedDate ? " pada tanggal ini" : " mendatang"} di bulan ini.
            </div>
          )}

          {visibleEvents.map((e, i) => {
            const meta = CATEGORY_BY_ID[e.category];
            const isBookmarked = bookmarks.has(e.id);
            return (
              <div key={e.id} className="bg-white rounded-2xl border border-canopy-800/10 overflow-hidden flex gap-3 p-3">
                <img
                  src={e.image ?? FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                  alt={e.bfest_name}
                  className="h-20 w-20 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                  {meta && <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>}
                  <p className="font-medium text-ink-900 leading-snug truncate">{e.bfest_name}</p>
                  <p className="text-xs text-ink-500 flex items-center gap-1.5 truncate">
                    <Icon name="pin" size={12} className="shrink-0" />
                    <span className="truncate">{e.address ?? e.location_name}</span>
                  </p>
                  {formatTimeRange(e.start_time, e.end_time) && (
                    <p className="text-xs text-ink-500 flex items-center gap-1.5">
                      <Icon name="clock" size={12} className="shrink-0" />
                      {formatTimeRange(e.start_time, e.end_time)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleBookmark(e.id)}
                  aria-label={isBookmarked ? "Hapus dari tersimpan" : "Simpan event"}
                  className={`self-start shrink-0 ${isBookmarked ? "text-canopy-700" : "text-ink-300"}`}
                >
                  <Icon name="bookmark" size={18} className={isBookmarked ? "fill-current" : ""} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
