// Daftar ikon custom untuk menggantikan SVG bawaan di Icon.jsx.
//
// CARA PAKAI:
// 1. Taruh file gambar ikonmu (SVG/PNG) di folder src/assets/icons/
// 2. Import di sini, lalu daftarkan pakai nama ikon yang SAMA PERSIS
//    seperti nama yang dipakai di <Icon name="..." /> (lihat daftar nama
//    yang tersedia di Icon.jsx, object `paths`, mis. "home", "leaf", "route").
// 3. Selesai — tidak perlu ubah kode di halaman manapun, karena semua
//    <Icon name="home" /> otomatis pakai gambar ini begitu didaftarkan.
//
// Contoh:
//   import homeIcon from "../../assets/icons/home.svg";
//   import leafIcon from "../../assets/icons/leaf.png";
//   export const customIcons = {
//     home: homeIcon,
//     leaf: leafIcon,
//   };
//
// Nama yang TIDAK didaftarkan di sini otomatis tetap pakai SVG bawaan
// (garis sederhana) dari Icon.jsx — jadi bisa diganti bertahap, tidak
// harus sekaligus semua ikon.

export const customIcons = {};
