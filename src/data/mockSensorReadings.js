// Data contoh (mock) — merepresentasikan tabel `sensor_devices` & `sensor_readings`.
// metric_type: 1=suhu(°C) 2=kelembaban(%) 3=uv_index 4=kebisingan(dB) 5=pm2.5(µg/m³)

export const sensorDevices = [
  { id: 1, green_space_id: 1, device_code: "ESP32-SRT-01", device_type: "esp32_node", is_active: true },
  { id: 2, green_space_id: 2, device_code: "ESP32-BLB-01", device_type: "esp32_node", is_active: true },
  { id: 3, green_space_id: 1, device_code: "ESP32-KOR1-DIORAMA", device_type: "esp32_node", is_active: true },
];

// Snapshot pembacaan terbaru per koridor/diorama (dipakai untuk demo dashboard)
export const latestReadingsByKoridor = {
  1: {
    suhu: 29.4,
    kelembaban: 68,
    uv_index: 6.1,
    kebisingan: 61,
    pm25: 34,
    shade_reduction_c: 8,
    noise_reduction_db: 10,
    uv_block_percent: 75,
    recorded_at: new Date().toISOString(),
    sensor_status: "online", // online | offline | stale
  },
};

// Konsentrasi polutan (µg/m³) untuk kartu ISPU di Home — cadangan kalau API
// sensor Laravel belum aktif. Nilai contoh: sebagian Baik, sebagian Sedang.
export const latestPollutantsByKoridor = {
  1: { pm10: 82, so2: 21, co: 2400, o3: 140, no2: 46 },
};
