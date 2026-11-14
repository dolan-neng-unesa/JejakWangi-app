import { apiRequest } from "./laravelClient";

// Setoran sampah/pangan: pindai QR lokasi → petugas menimbang → pengguna mengonfirmasi (poin masuk) atau minta koreksi.
export const checkinStation = (code) => apiRequest("/waste/checkin", { method: "POST", auth: true, body: { station_code: code } });
export const fetchMyWaste = () => apiRequest("/waste/mine", { auth: true });
export const confirmWaste = (id) => apiRequest(`/waste/${id}/confirm`, { method: "POST", auth: true, body: {} });
export const requestCorrection = (id, note) => apiRequest(`/waste/${id}/correction`, { method: "POST", auth: true, body: { note } });

// Lapor Koridor (warga → admin → DLH → kabar kembali ke pelapor).
export const fetchReportMeta = () => apiRequest("/reports/meta", { auth: true });
export const fetchMyReports = () => apiRequest("/me/reports", { auth: true });
export const sendReport = (form) => apiRequest("/reports", { method: "POST", auth: true, body: form });
export const respondReport = (id, action, note) => apiRequest(`/reports/${id}/respond`, { method: "POST", auth: true, body: { action, note } });
