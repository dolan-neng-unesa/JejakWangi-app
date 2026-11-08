import { BrowserRouter, Routes, Route } from "react-router-dom";

import { GeofenceProvider } from "./context/GeofenceContext";
import { useGeofence } from "./hooks/useGeofence";
import GeofenceAlert from "./components/geofencing/GeofenceAlert";

import SplashScreen from "./pages/SplashScreen";
import OnboardingCarousel from "./pages/OnboardingCarousel";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import KoridorListPage from "./pages/KoridorListPage";
import KoridorDetailPage from "./pages/KoridorDetailPage";
import MapPage from "./pages/MapPage";
import SmartGreenRoutePage from "./pages/SmartGreenRoutePage";
import RouteDetailPage from "./pages/RouteDetailPage";
import NavigationPage from "./pages/NavigationPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import MoodHistoryPage from "./pages/MoodHistoryPage";
import SoundscapeTherapyPage from "./pages/SoundscapeTherapyPage";
import GeofencingPage from "./pages/GeofencingPage";
import BwiFestPage from "./pages/BwiFestPage";
import UmkmPage from "./pages/UmkmPage";
import NotFoundPage from "./pages/NotFoundPage";

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
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<OnboardingCarousel />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />

          <Route path="/koridor" element={<KoridorListPage />} />
          <Route path="/koridor/:id" element={<KoridorDetailPage />} />

          <Route path="/map" element={<MapPage />} />

          <Route path="/route" element={<SmartGreenRoutePage />} />
          <Route path="/route/:id" element={<RouteDetailPage />} />
          <Route path="/route/:id/navigasi" element={<NavigationPage />} />

          <Route path="/mood" element={<MoodTrackerPage />} />
          <Route path="/mood/riwayat" element={<MoodHistoryPage />} />
          <Route path="/soundscape" element={<SoundscapeTherapyPage />} />
          <Route path="/geofencing" element={<GeofencingPage />} />
          <Route path="/bfest" element={<BwiFestPage />} />
          <Route path="/umkm" element={<UmkmPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <GeofenceOverlay />
      </GeofenceProvider>
    </BrowserRouter>
  );
}
