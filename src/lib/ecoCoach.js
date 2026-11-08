// Eco-Coach: penerjemah data jadi saran singkat untuk warga ("tools tips" di tiap halaman).
// Saat ini berbasis aturan (deterministik, bekerja offline) — bukan model bahasa. Bentuk input/outputnya
// sengaja sederhana supaya nanti bisa diganti panggilan ke layanan AI tanpa mengubah halaman.
import { saranIspu } from "./journey";

/**
 * @param {object} ctx
 * @param {"home"|"koridor"|"rute"|"aktivitas"|"hasil"|"misi"} ctx.page
 * @param {{value:number}|null} [ctx.ispu]
 * @param {number|null} [ctx.temperature] °C
 * @param {number} [ctx.hour] 0-23 (default: jam sekarang)
 * @param {string|null} [ctx.transport]
 * @param {number} [ctx.progressKm] km jalan kaki bulan ini
 * @param {{nama:string,targetKm:number,status:string}|null} [ctx.tier] tingkat kupon berikutnya
 * @returns {string}
 */
export function ecoTip({ page, ispu = null, temperature = null, hour = new Date().getHours(), transport = null, progressKm = 0, tier = null }) {
  const udara = saranIspu(ispu);
  if (!udara.sehat) return udara.pesan;
  if (temperature != null && temperature >= 33) return "Cuaca cukup panas. Pilih rute teduh, bawa air minum, dan hindari jalan di jam 11–15.";
  if (page === "aktivitas") return hour >= 17 || hour < 6 ? "Hari mulai gelap. Tetap di jalur pedestrian yang terang dan waspada kendaraan." : "Atur langkah santai agar napasmu stabil. Nikmati suara alam di sekitarmu.";
  if (page === "misi" || page === "hasil") {
    if (!tier) return "Semua kuponmu sedang cooldown. Bawa tempat makan sendiri ke UMKM untuk memangkas cooldown 1 hari tiap transaksi.";
    if (tier.status === "bisa_diklaim") return `Kupon ${tier.nama} sudah bisa diklaim! Buka halaman Misi dan tukarkan di UMKM.`;
    const sisa = Math.max(0, tier.targetKm - progressKm);
    return `Tinggal ${sisa.toFixed(1).replace(".", ",")} km lagi untuk kupon ${tier.nama}. Jalan santai dua kali sudah cukup.`;
  }
  if (page === "koridor") return "Koridor yang rimbun lebih sejuk dan udaranya lebih bersih. Mulailah dari titik awal agar jejakmu terhitung.";
  if (page === "rute") return udara.pesan ?? "Pilih rute berjalur teduh. Titik biru di peta adalah tempat mengisi daya HP gratis dengan tenaga surya.";
  if (transport === "mobil" || transport === "motor") return "Parkir sekali, lalu jelajahi koridor dengan berjalan kaki. Setiap kilometer menghindari emisi kendaraan.";
  if (hour < 9) return "Pagi hari adalah waktu terbaik berjalan: suhu sejuk dan udara masih segar.";
  return "Berjalan 20 menit sehari sudah membantu kebugaran dan mengurangi emisi perjalanan pendek.";
}
