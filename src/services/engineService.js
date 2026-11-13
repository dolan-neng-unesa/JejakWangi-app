import { apiRequest } from "./laravelClient";

// Alur QR flowchart (aplikasi warga): QR parkir → check-in lapak → QR tujuan kedua; kartu dampak; tukar poin.
export const cekParkir = (kode) => apiRequest(`/qr/parkir/${encodeURIComponent(kode)}`);
export const mulaiCheckin = (body) => apiRequest("/checkins/start", { method: "POST", auth: true, body });
export const selesaiCheckin = (id, code) => apiRequest(`/checkins/${id}/finish`, { method: "POST", auth: true, body: { code } });
export const fetchMyCheckins = () => apiRequest("/me/checkins", { auth: true });
export const fetchImpact = () => apiRequest("/me/impact", { auth: true });
export const fetchRewards = () => apiRequest("/rewards", { auth: true });
export const redeemReward = (hadiah) => apiRequest("/rewards/redeem", { method: "POST", auth: true, body: { hadiah } });

/** Kode demo (data seder backend) supaya alur bisa dicoba tanpa mencetak QR. */
export const KODE_DEMO = { parkir: ["PRK-SRI", "PRK-BLB", "PRK-PSR"], lapak: ["LPK-PSR-01", "LPK-PSR-02"], tujuan: ["TJN-SRI"] };
