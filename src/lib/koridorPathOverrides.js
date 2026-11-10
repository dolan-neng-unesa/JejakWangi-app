// Jalur koridor hasil gambar tim lewat mode edit peta (/map?edit=1). Disimpan di
// localStorage perangkat ini saja sebagai pratinjau; supaya permanen & dipakai
// semua pengguna, salin JSON-nya ke KoridorSeeder.php (kolom `path`) dan
// data/mockGreenSpaces.js — lihat README bagian "Jalur koridor".

const KEY = "svarga:koridor-path-overrides:v1";

export function loadPathOverrides() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function savePathOverrides(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage diblokir — abaikan */
  }
}
