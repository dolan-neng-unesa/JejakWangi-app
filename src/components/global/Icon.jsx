// Kumpulan ikon garis sederhana bergaya konsisten (stroke, 1.6px, rounded).
// Dipakai lintas komponen global agar tidak bergantung pada asset PNG eksternal.

const paths = {
  home: "M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9",
  leaf: "M5 19c8-1 12-6 13-14-8 1-12 6-13 14Zm0 0c1-4 3-7 6-9",
  route: "M5 19c3 0 3-4 6-4s3 4 6 4 3-4 6-4M5 5a2 2 0 1 0 0 .01M19 5a2 2 0 1 0 0 .01",
  map: "M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Zm0 0v14m6-12v14",
  mood: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-9.5.01.01M15.5 11.5l.01.01M8 15c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5",
  sound: "M4 10v4h4l5 4V6L8 10H4Zm12.5-2a5 5 0 0 1 0 8M19 6a9 9 0 0 1 0 12",
  festival: "M4 20V10l4-6 4 6-4 6Zm8 0V10l4-6 4 6-4 6Z",
  store: "M4 9V6l2-2h12l2 3v3M4 9h16M4 9l1 10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1l1-10M9 13v4M15 13v4",
  gauge: "M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-3-1-6 1-2 1 2Z",
  wind: "M3 8h11a2.5 2.5 0 1 0-2.2-3.6M3 12h15a2.5 2.5 0 1 1-2.2 3.6M3 16h8",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z",
  bell: "M6 17h12l-1.4-2.8V10a4.6 4.6 0 0 0-9.2 0v4.2L6 17Zm4-14.5a2 2 0 0 1 4 0M10 19a2 2 0 0 0 4 0",
  qr: "M4 4h5v5H4V4Zm0 11h5v5H4v-5ZM15 4h5v5h-5V4Zm0 7h2v2h-2v-2Zm3 0h2v2h-2v-2Zm-3 3h2v2h-2v-2Zm3 0h2v5h-5v-2",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  chevronLeft: "M15 5 8 12l7 7",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v6M12 8v.01",
  weather: "M7 17a4 4 0 1 1 1.2-7.83A5 5 0 0 1 18 11a3.5 3.5 0 0 1-.5 6.98H7Zm10.5-12v2M22 8.5h-2M20.6 4.9l-1.4 1.4",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3-13-4 3-2 5 4-3 2-5Z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18Z",
  calendar: "M5 9h14M8 4v3M16 4v3M6 6h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z",
  cutlery: "M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 3c-1.5 1-2 2.5-2 5s1 3 2 3v10",
  star: "m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L12 16.9 6.4 20l1.4-6.2L3 9.5l6.4-.6L12 3Z",
  meal: "M4 12h16M4 12a8 8 0 0 0 16 0M4 12a8 8 0 0 1 16 0M9 7V4M15 7V4",
  thermometer: "M12 3a2 2 0 0 0-2 2v9.17a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2Zm0 4v6",
  sensorChip: "M8 3v2M16 3v2M8 19v2M16 19v2M3 8h2M3 16h2M19 8h2M19 16h2M7 7h10v10H7z",
  humidity: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3-9 6 6m0-6-6 6",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h13M21 18h0M8 4v4M15 10v4M17 16v4",
  check: "m5 13 4 4L19 7",
  share: "M12 16V4M8 8l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6",
  navigation: "m3 11 18-8-8 18-2-8-8-2Z",
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 18.5A2.5 2.5 0 0 1 6.5 16H20",
  briefcase: "M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm4 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 13h16",
  dots: "M6 12h.01M12 12h.01M18 12h.01",
  chevronDown: "m6 9 6 6 6-6",
  close: "M6 6l12 12M18 6 6 18",
  play: "M8 5.5v13l11-6.5-11-6.5Z",
  pin: "M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  plus: "M12 5v14M5 12h14",
  activity: "M3 12h4l2-7 4 14 2-7h6",
  barChart: "M4 20V10M10 20V4M16 20v-7M4 20h16",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9c0-3 2.5-5 6-5s6 2 6 5M17 11a3 3 0 1 0 0-6M17 20c0-2.5-1-4-2.5-4.7",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.15-1.55l2.02-1.57-2-3.46-2.38.96a8 8 0 0 0-2.68-1.55L14.4 2h-4l-.4 2.83a8 8 0 0 0-2.68 1.55l-2.38-.96-2 3.46 2.02 1.57a8 8 0 0 0 0 3.1L2.55 15.6l2 3.46 2.38-.96a8 8 0 0 0 2.68 1.55L10 22h4l.4-2.35a8 8 0 0 0 2.68-1.55l2.38.96 2-3.46-2.02-1.57A8 8 0 0 0 20 12Z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  pencil: "M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14 6l4 4",
  trash: "M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  logout: "M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 17l5-5-5-5M21 12H9",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-4-9 2.5 2.5L16 9",
  wifiOff: "M2 8.5A16 16 0 0 1 7 5.5M22 8.5a16 16 0 0 0-5.5-3.2M5 12a11 11 0 0 1 3-2M19 12a11 11 0 0 0-3-2M8.5 15.5a6 6 0 0 1 3-1.2M12 19v.01M3 3l18 18",
  wrench: "M14.7 6.3a4 4 0 0 0-5.6 5.1L4 16.5V20h3.5l5.1-5.1a4 4 0 0 0 5.1-5.6l-2.6 2.6-2-2 2.6-2.6Z",
};

export default function Icon({ name, size = 22, className = "", strokeWidth = 1.7 }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
