import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/global/Button";
import slide1 from "../assets/pages/onboarding/slide-1.png";
import slide2 from "../assets/pages/onboarding/slide-2.png";
import slide3 from "../assets/pages/onboarding/slide-3.png";

const slides = [
  {
    image: slide1,
    title: "Jelajahi Rute Hijau di Bumi Blambangan",
    desc: "Pilih rute perjalanan harianmu berdasarkan kualitas udara terbaik, keteduhan pepohonan, serta tingkat kenyamanan lingkungan sekitar.",
  },
  {
    image: slide2,
    title: "Dari Sritanjung, Mulai Langkah Sehatmu Hari Ini.",
    desc: "Pilih rute perjalanan harianmu berdasarkan kualitas udara terbaik, keteduhan pepohonan, serta tingkat kenyamanan lingkungan sekitar.",
  },
  {
    image: slide3,
    title: "Rute yang Lebih Sehat, Setiap Hari",
    desc: "Pilih rute perjalanan harianmu berdasarkan kualitas udara terbaik, keteduhan pepohonan, serta tingkat kenyamanan lingkungan sekitar.",
  },
];

const SWIPE_THRESHOLD = 60; // px minimal geser sebelum dianggap ganti slide

export default function OnboardingCarousel() {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const viewportRef = useRef(null);
  const navigate = useNavigate();

  const isLast = index === slides.length - 1;

  function goTo(nextIndex) {
    setIndex(Math.max(0, Math.min(slides.length - 1, nextIndex)));
  }

  function handleNext() {
    if (isLast) {
      navigate("/login");
    } else {
      goTo(index + 1);
    }
  }

  function handlePointerDown(e) {
    setDragging(true);
    startX.current = e.clientX;
    // Pointer capture dipasang di bingkai LUAR yang diam (bukan track yang
    // ikut ber-transform), supaya tetap konsisten di setiap slide.
    viewportRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  }

  function endDrag() {
    if (!dragging) return;
    setDragging(false);
    const width = viewportRef.current?.offsetWidth || 1;
    const threshold = Math.min(SWIPE_THRESHOLD, width * 0.2);
    if (dragX < -threshold) {
      if (!isLast) goTo(index + 1);
    } else if (dragX > threshold) {
      if (index > 0) goTo(index - 1);
    }
    setDragX(0);
  }

  const trackStyle = {
    transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
    transition: dragging ? "none" : "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <div className="min-h-dvh flex flex-col bg-sand-50 px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Jendela geser: bingkai ini DIAM (tidak ikut transform) dan memegang semua event geser */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          className="overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y"
        >
          <div className="flex" style={trackStyle}>
            {slides.map((s) => (
              <img
                key={s.title}
                src={s.image}
                alt={s.title}
                draggable={false}
                className="w-full shrink-0 rounded-[1.75rem] object-cover pointer-events-none"
              />
            ))}
          </div>
        </div>

        {/* Judul & deskripsi juga ikut animasi geser halus antar slide */}
        <div className="overflow-hidden mt-7">
          <div
            className="flex"
            style={{
              transform: `translateX(calc(${-index * 100}% + ${dragX * 0.4}px))`,
              transition: dragging ? "none" : "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {slides.map((s) => (
              <div key={s.title} className="w-full shrink-0 px-0.5">
                <h1 className="font-display font-bold text-2xl text-ink-900 text-center leading-tight">
                  {s.title}
                </h1>
                <p className="text-sm text-ink-500 text-center mt-3 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Ke slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-5 bg-canopy-700" : "w-1.5 bg-canopy-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto w-full">
        <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
          {isLast ? "Mulai" : "Selanjutnya"}
        </Button>
      </div>
    </div>
  );
}
