import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { GeofenceProvider } from "./context/GeofenceContext";
import { useGeofence } from "./hooks/useGeofence";
import GeofenceAlert from "./components/geofencing/GeofenceAlert";
import ErrorBoundary from "./components/global/ErrorBoundary";

// Jalur pertama (splash -> onboarding) dan 404 dimuat langsung; sisanya dipecah per halaman
// supaya unduhan awal kecil — peta (Leaflet) hanya diunduh saat halamannya dibuka.
import SplashScreen from "./pages/SplashScreen";
import OnboardingCarousel from "./pages/OnboardingCarousel";
import NotFoundPage from "./pages/NotFoundPage";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const KoridorListPage = lazy(() => import("./pages/KoridorListPage"));
const KoridorDetailPage = lazy(() => import("./pages/KoridorDetailPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const RouteListPage = lazy(() => import("./pages/RouteListPage"));
const SmartGreenRoutePage = lazy(() => import("./pages/SmartGreenRoutePage"));
const RouteDetailPage = lazy(() => import("./pages/RouteDetailPage"));
const NavigationPage = lazy(() => import("./pages/NavigationPage"));
const MoodTrackerPage = lazy(() => import("./pages/MoodTrackerPage"));
const MoodHistoryPage = lazy(() => import("./pages/MoodHistoryPage"));
const SoundscapeTherapyPage = lazy(() => import("./pages/SoundscapeTherapyPage"));
const GeofencingPage = lazy(() => import("./pages/GeofencingPage"));
const BwiFestPage = lazy(() => import("./pages/BwiFestPage"));
const UmkmPage = lazy(() => import("./pages/UmkmPage"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const ActivityResultPage = lazy(() => import("./pages/ActivityResultPage"));
const ChallengePage = lazy(() => import("./pages/ChallengePage"));
const CouponPage = lazy(() => import("./pages/CouponPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ChargerListPage = lazy(() => import("./pages/ChargerListPage"));
const ChargerDetailPage = lazy(() => import("./pages/ChargerDetailPage"));
const ChargingPage = lazy(() => import("./pages/ChargingPage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const KasirPage = lazy(() => import("./pages/KasirPage"));

function PageLoading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-sand-50" role="status" aria-label="Memuat halaman">
      <span className="h-8 w-8 rounded-full border-2 border-canopy-700 border-t-transparent animate-spin" />
    </div>
  );
}

// Dipasang di dalam BrowserRouter agar bisa mereset ErrorBoundary tiap pindah halaman.
function RoutedBoundary({ children }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// Overlay notifikasi "Zona Aktif" — dipasang sekali, berlaku di seluruh app.
function GeofenceOverlay() {
  const { activeZone, activeSoundscape, closeAlert } = useGeofence();
  return <GeofenceAlert zone={activeZone} soundscape={activeSoundscape} onClose={closeAlert} />;
}

// SVARGA — Routing (Pekan 1 setup; Pekan 2 Onboarding/Login/Home; Pekan 3 Koridor;
// Pekan 4 Map + Smart Green Route; Pekan 5 Route Detail + Mood Tracker;
// Pekan 6 Soundscape Therapy + Geofencing)
export default function App() {
  return (
    <BrowserRouter>
      <GeofenceProvider>
        <RoutedBoundary>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<OnboardingCarousel />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />

          <Route path="/koridor" element={<KoridorListPage />} />
          <Route path="/koridor/:id" element={<KoridorDetailPage />} />

          <Route path="/map" element={<MapPage />} />

          {/* Alur Smart Green Route: daftar rute -> peta & pilih rute -> detail -> navigasi */}
          <Route path="/route" element={<RouteListPage />} />
          <Route path="/route/pilih" element={<SmartGreenRoutePage />} />
          <Route path="/route/detail/:id" element={<RouteDetailPage />} />
          <Route path="/route/detail/:id/navigasi" element={<NavigationPage />} />

          <Route path="/mood" element={<MoodTrackerPage />} />
          <Route path="/mood/riwayat" element={<MoodHistoryPage />} />
          <Route path="/soundscape" element={<SoundscapeTherapyPage />} />
          <Route path="/geofencing" element={<GeofencingPage />} />
          <Route path="/bfest" element={<BwiFestPage />} />
          <Route path="/umkm" element={<UmkmPage />} />

          {/* Alur Jejak Wangi: scan QR awal (+ moda) -> beranda -> koridor -> rute -> lacak aktivitas -> misi/kupon -> mood */}
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/q/:koridorId" element={<ScanPage />} />
          <Route path="/scan/akhir/:id" element={<ScanPage mode="akhir" />} />
          <Route path="/scan/tempat-sendiri" element={<ScanPage mode="byo" />} />
          <Route path="/kasir" element={<KasirPage />} />
          <Route path="/charger" element={<ChargerListPage />} />
          <Route path="/charger/:id" element={<ChargerDetailPage />} />
          <Route path="/charger/:id/isi" element={<ChargingPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="/aktivitas" element={<ActivityPage />} />
          <Route path="/aktivitas/selesai/:id" element={<ActivityResultPage />} />
          <Route path="/misi" element={<ChallengePage />} />
          <Route path="/kupon" element={<CouponPage />} />
          <Route path="/profil" element={<ProfilePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </RoutedBoundary>
        <GeofenceOverlay />
      </GeofenceProvider>
    </BrowserRouter>
  );
}
