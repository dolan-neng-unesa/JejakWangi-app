// Ikon marker bawaan Leaflet memakai path gambar relatif yang pecah setelah
// di-bundle Vite (marker tampil sebagai gambar rusak). Diarahkan ke file
// yang di-bundle Vite secara eksplisit. Diimpor sekali lewat lib/mapTiles.js.
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
