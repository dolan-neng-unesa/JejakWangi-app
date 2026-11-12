// Data contoh (mock) — merepresentasikan baris tabel `green_space` & `koridor`.
// Dipakai sementara oleh services/* selagi backend Laravel belum tersambung / tidak terjangkau.

import thumbSritanjung from "../assets/pages/koridor/thumb-sritanjung.png";
import thumbKalilo from "../assets/pages/koridor/thumb-kalilo.png";
import thumbPerliman from "../assets/pages/koridor/thumb-perliman.png";
import thumbBlambangan from "../assets/pages/koridor/thumb-blambangan.png";
import thumbPecinan from "../assets/pages/koridor/thumb-pecinan.png";
import thumbMarinaBoom from "../assets/pages/koridor/thumb-marinaboom.png";
import heroKoridor1 from "../assets/pages/koridor/hero-koridor1.png";

export const greenSpaces = [
  {
    id: 1,
    name: "Taman Sritanjung",
    location_type: "taman",
    description: "Pusat aktivitas sosial aktif di jantung Kabupaten Banyuwangi.",
    latitude: -8.21944,
    longitude: 114.36972,
    address: "Jl. Jaksa Agung Suprapto, Banyuwangi",
    shade_score: 62,
    is_active: true,
  },
  {
    id: 2,
    name: "Taman Blambangan",
    location_type: "taman",
    description: "Kawasan olahraga dan panggung festival pariwisata daerah.",
    latitude: -8.2175,
    longitude: 114.3675,
    address: "Jl. Ahmad Yani, Banyuwangi",
    shade_score: 58,
    is_active: true,
  },
];

// hijau_level: paling_hijau | agak_hijau | setengah_hijau | tidak_hijau (sesuai mockup "Pilih Koridor Hijau")
// hijau_score: jumlah daun terisi dari 5 (representasi visual hijau_level)
export const koridors = [
  {
    id: 1,
    short_name: "RTH Sritanjung",
    formal_name: "Koridor 1: Sritanjung",
    route_label: "Taman Sritanjung - Kampung Melayu",
    desc: "Taman Sritanjung asri dan kuliner",
    thumbnail: thumbSritanjung,
    hero_image: heroKoridor1,
    hijau_level: "paling_hijau",
    hijau_score: 5,
    umkm_count: 5,
    status: "pilot",
    // Jalur koridor [lat, lng] — koordinat perkiraan (titik awal = Taman Sritanjung,
    // titik akhir = Taman Blambangan dari data green_space). Ganti dengan hasil survei.
    path: [
      [-8.21944, 114.36972],
      [-8.21833, 114.36951],
      [-8.21748, 114.36869],
      [-8.2175, 114.3675],
    ],
    distance_meter: 400,
    estimate_minutes: 6,
    shade_score: 82,
    // Estimasi kontribusi lingkungan koridor (kg/hari) — angka perkiraan, ganti dengan hasil kajian.
    oxygen_kg_day: 11.7,
    co2_reduced_kg_day: 16,
    // Masukan neraca karbon (lib/carbonBalance.js). Angka di bawah CONTOH — ganti dengan hasil survei.
    // oxygen_kg_day & co2_reduced_kg_day di atas dihitung ulang dari sini; keduanya hanya cadangan.
    carbon_inputs: {
      "pohon": [
        {
          "jenis": "mahoni",
          "jumlah": 18
        },
        {
          "jenis": "tanjung",
          "jumlah": 12
        },
        {
          "jenis": "angsana",
          "jumlah": 10
        }
      ],
      "kendaraanPerHari": {
        "motor": 1200,
        "mobil": 150
      },
      "toko": [
        {
          "nama": "UMKM A",
          "unitAC": 1,
          "kWPerUnit": 0.8,
          "jamOperasi": 10,
          "faktorBeban": 0.7
        },
        {
          "nama": "UMKM B",
          "unitAC": 1,
          "kWPerUnit": 0.8,
          "jamOperasi": 10,
          "faktorBeban": 0.7
        }
      ],
      "sumberData": {
        "kendaraan": "ILUSTRASI",
        "pohon": "ILUSTRASI",
        "ac": "ILUSTRASI"
      }
    },
    condition_title: "Kondisi Koridor Terpilih",
    condition_desc:
      "Koridor ini memiliki cakupan pohon yang rimbun dan kualitas udara paling bersih di pusat kota. Dilengkapi infrastruktur pedestrian teduh.",
    sensor: {
      pm25: 12, pm25_status: "Sehat",
      suhu: 26.4, suhu_status: "Sejuk",
      kelembaban: 65, kelembaban_status: "Nyaman",
      kebisingan: 52, kebisingan_status: "Tenang",
      uv_index: 2.1, uv_status: "Rendah",
      pm10: 28, so2: 18, co: 1.1, o3: 45, no2: 22,
      sensor_status: "online",
      recorded_at: new Date().toISOString(),
    },
  },
  {
    id: 2,
    short_name: "Corridor 1 Kalilo",
    formal_name: "Koridor 2: Kalilo",
    route_label: "Kalilo - Jembatan Merah",
    desc: "Kawasan sungai dan spot foto",
    thumbnail: thumbKalilo,
    hero_image: thumbKalilo,
    hijau_level: "agak_hijau",
    hijau_score: 4,
    umkm_count: 8,
    status: "rencana",
    distance_meter: 620,
    estimate_minutes: 9,
    // Jalur koridor [lat, lng] — koordinat perkiraan, ganti dengan hasil survei / gambar di mode edit peta (/map?edit=1).
    path: [
      [-8.2108, 114.3702],
      [-8.2102, 114.3724],
      [-8.2095, 114.3742],
      [-8.209, 114.3758],
    ],
    shade_score: 64,
    // Estimasi kontribusi lingkungan koridor (kg/hari) — angka perkiraan, ganti dengan hasil kajian.
    oxygen_kg_day: 9.1,
    co2_reduced_kg_day: 12.5,
    // Masukan neraca karbon (lib/carbonBalance.js). Angka di bawah CONTOH — ganti dengan hasil survei.
    // oxygen_kg_day & co2_reduced_kg_day di atas dihitung ulang dari sini; keduanya hanya cadangan.
    carbon_inputs: {
      "pohon": [
        {
          "jenis": "mahoni",
          "jumlah": 14
        },
        {
          "jenis": "angsana",
          "jumlah": 20
        },
        {
          "jenis": "tanjung",
          "jumlah": 6
        }
      ],
      "kendaraanPerHari": {
        "motor": 1800,
        "mobil": 260
      },
      "toko": [
        {
          "nama": "Kafe",
          "unitAC": 2,
          "kWPerUnit": 0.8,
          "jamOperasi": 12,
          "faktorBeban": 0.7
        },
        {
          "nama": "UMKM",
          "unitAC": 1,
          "kWPerUnit": 0.75,
          "jamOperasi": 10,
          "faktorBeban": 0.7
        }
      ],
      "sumberData": {
        "kendaraan": "ILUSTRASI",
        "pohon": "ILUSTRASI",
        "ac": "ILUSTRASI"
      }
    },
    condition_title: "Kondisi Koridor Terpilih",
    condition_desc:
      "Koridor menyusuri tepi sungai dengan pepohonan sedang. Ramai dikunjungi sore hari untuk berfoto dan bersantai.",
    sensor: {
      pm25: 24, pm25_status: "Sedang",
      suhu: 28.1, suhu_status: "Hangat",
      kelembaban: 58, kelembaban_status: "Nyaman",
      kebisingan: 61, kebisingan_status: "Ramai",
      uv_index: 4.3, uv_status: "Sedang",
      pm10: 46, so2: 30, co: 1.8, o3: 70, no2: 38,
      sensor_status: "online",
      recorded_at: new Date().toISOString(),
    },
  },
  {
    id: 3,
    short_name: "Corridor 2 Perliman",
    formal_name: "Koridor 3: Perliman",
    route_label: "Simpang Lima - Terminal",
    desc: "Kawasan padat lalu lintas perkotaan",
    thumbnail: thumbPerliman,
    hero_image: thumbPerliman,
    hijau_level: "setengah_hijau",
    hijau_score: 3,
    umkm_count: 3,
    status: "rencana",
    distance_meter: 510,
    estimate_minutes: 8,
    // Jalur koridor [lat, lng] — koordinat perkiraan, ganti dengan hasil survei / gambar di mode edit peta (/map?edit=1).
    path: [
      [-8.2228, 114.3612],
      [-8.2239, 114.363],
      [-8.2252, 114.3646],
      [-8.2262, 114.366],
    ],
    shade_score: 41,
    // Estimasi kontribusi lingkungan koridor (kg/hari) — angka perkiraan, ganti dengan hasil kajian.
    oxygen_kg_day: 3.3,
    co2_reduced_kg_day: 4.5,
    // Masukan neraca karbon (lib/carbonBalance.js). Angka di bawah CONTOH — ganti dengan hasil survei.
    // oxygen_kg_day & co2_reduced_kg_day di atas dihitung ulang dari sini; keduanya hanya cadangan.
    carbon_inputs: {
      "pohon": [
        {
          "jenis": "angsana",
          "jumlah": 15
        },
        {
          "jenis": "mahoni",
          "jumlah": 5
        }
      ],
      "kendaraanPerHari": {
        "motor": 4200,
        "mobil": 900,
        "bus": 40,
        "truk": 25
      },
      "toko": [
        {
          "nama": "Minimarket",
          "unitAC": 3,
          "kWPerUnit": 0.9,
          "jamOperasi": 16,
          "faktorBeban": 0.8
        }
      ],
      "sumberData": {
        "kendaraan": "ILUSTRASI",
        "pohon": "ILUSTRASI",
        "ac": "ILUSTRASI"
      }
    },
    condition_title: "Kondisi Koridor Terpilih",
    condition_desc:
      "Koridor padat lalu lintas dengan pohon peneduh terbatas. Disarankan berjalan pada jam bukan puncak.",
    sensor: {
      pm25: 38, pm25_status: "Sedang",
      suhu: 30.2, suhu_status: "Panas",
      kelembaban: 52, kelembaban_status: "Kering",
      kebisingan: 74, kebisingan_status: "Bising",
      uv_index: 6.8, uv_status: "Tinggi",
      pm10: 68, so2: 42, co: 2.6, o3: 95, no2: 55,
      sensor_status: "online",
      recorded_at: new Date().toISOString(),
    },
  },
  {
    id: 4,
    short_name: "Koridor 3 Blambangan",
    formal_name: "Koridor 4: Blambangan",
    route_label: "Taman Blambangan - GOR",
    desc: "Kawasan hijau dan pusat kuliner",
    thumbnail: thumbBlambangan,
    hero_image: thumbBlambangan,
    hijau_level: "paling_hijau",
    hijau_score: 5,
    umkm_count: 6,
    status: "rencana",
    distance_meter: 350,
    estimate_minutes: 5,
    // Jalur koridor [lat, lng] — koordinat perkiraan, ganti dengan hasil survei / gambar di mode edit peta (/map?edit=1).
    path: [
      [-8.2175, 114.3675],
      [-8.219, 114.3662],
      [-8.2206, 114.365],
      [-8.222, 114.3638],
    ],
    shade_score: 79,
    // Estimasi kontribusi lingkungan koridor (kg/hari) — angka perkiraan, ganti dengan hasil kajian.
    oxygen_kg_day: 16.2,
    co2_reduced_kg_day: 22.3,
    // Masukan neraca karbon (lib/carbonBalance.js). Angka di bawah CONTOH — ganti dengan hasil survei.
    // oxygen_kg_day & co2_reduced_kg_day di atas dihitung ulang dari sini; keduanya hanya cadangan.
    carbon_inputs: {
      "pohon": [
        {
          "jenis": "mahoni",
          "jumlah": 25
        },
        {
          "jenis": "tanjung",
          "jumlah": 14
        },
        {
          "jenis": "flamboyan",
          "jumlah": 6
        }
      ],
      "kendaraanPerHari": {
        "motor": 900,
        "mobil": 120
      },
      "toko": [
        {
          "nama": "Kantin",
          "unitAC": 1,
          "kWPerUnit": 0.75,
          "jamOperasi": 8,
          "faktorBeban": 0.6
        }
      ],
      "sumberData": {
        "kendaraan": "ILUSTRASI",
        "pohon": "ILUSTRASI",
        "ac": "ILUSTRASI"
      }
    },
    condition_title: "Kondisi Koridor Terpilih",
    condition_desc:
      "Kawasan taman kota dengan kanopi pohon luas dan banyak pilihan kuliner di sekelilingnya.",
    sensor: {
      pm25: 15, pm25_status: "Sehat",
      suhu: 27.0, suhu_status: "Sejuk",
      kelembaban: 63, kelembaban_status: "Nyaman",
      kebisingan: 55, kebisingan_status: "Tenang",
      uv_index: 2.8, uv_status: "Rendah",
      pm10: 33, so2: 20, co: 1.3, o3: 50, no2: 26,
      sensor_status: "online",
      recorded_at: new Date().toISOString(),
    },
  },
  {
    id: 5,
    short_name: "Corridor 4 Pecinan",
    formal_name: "Koridor 5: Pecinan",
    route_label: "Klenteng - Pasar Lama",
    desc: "Kawasan padat industri dan permukiman",
    thumbnail: thumbPecinan,
    hero_image: thumbPecinan,
    hijau_level: "tidak_hijau",
    hijau_score: 1,
    umkm_count: 4,
    status: "rencana",
    distance_meter: 480,
    estimate_minutes: 7,
    // Jalur koridor [lat, lng] — koordinat perkiraan, ganti dengan hasil survei / gambar di mode edit peta (/map?edit=1).
    path: [
      [-8.216, 114.3742],
      [-8.2169, 114.3754],
      [-8.2178, 114.3765],
      [-8.2187, 114.3776],
    ],
    shade_score: 22,
    // Estimasi kontribusi lingkungan koridor (kg/hari) — angka perkiraan, ganti dengan hasil kajian.
    oxygen_kg_day: 0.3,
    co2_reduced_kg_day: 0.5,
    // Masukan neraca karbon (lib/carbonBalance.js). Angka di bawah CONTOH — ganti dengan hasil survei.
    // oxygen_kg_day & co2_reduced_kg_day di atas dihitung ulang dari sini; keduanya hanya cadangan.
    carbon_inputs: {
      "pohon": [
        {
          "jenis": "angsana",
          "jumlah": 6
        },
        {
          "jenis": "tanjung",
          "jumlah": 3
        }
      ],
      "kendaraanPerHari": {
        "motor": 3800,
        "mobil": 700,
        "truk": 30
      },
      "toko": [
        {
          "nama": "Toko A",
          "unitAC": 2,
          "kWPerUnit": 0.8,
          "jamOperasi": 10,
          "faktorBeban": 0.7
        },
        {
          "nama": "Toko B",
          "unitAC": 2,
          "kWPerUnit": 0.8,
          "jamOperasi": 10,
          "faktorBeban": 0.7
        }
      ],
      "sumberData": {
        "kendaraan": "ILUSTRASI",
        "pohon": "ILUSTRASI",
        "ac": "ILUSTRASI"
      }
    },
    condition_title: "Kondisi Koridor Terpilih",
    condition_desc:
      "Kawasan padat bangunan dengan sedikit vegetasi. Kualitas udara perlu dipantau lebih ketat pada jam sibuk.",
    sensor: {
      pm25: 52, pm25_status: "Tidak Sehat",
      suhu: 31.5, suhu_status: "Panas",
      kelembaban: 48, kelembaban_status: "Kering",
      kebisingan: 79, kebisingan_status: "Bising",
      uv_index: 7.5, uv_status: "Tinggi",
      pm10: 92, so2: 58, co: 3.4, o3: 130, no2: 72,
      sensor_status: "online",
      recorded_at: new Date().toISOString(),
    },
  },
  {
    id: 6,
    short_name: "Corridor 5 Marina Boom",
    formal_name: "Koridor 6: Marina Boom",
    route_label: "Pelabuhan - Pantai Boom",
    desc: "Kawasan padat industri dan permukiman",
    thumbnail: thumbMarinaBoom,
    hero_image: thumbMarinaBoom,
    hijau_level: "agak_hijau",
    hijau_score: 4,
    umkm_count: 4,
    status: "rencana",
    distance_meter: 610,
    estimate_minutes: 9,
    // Jalur koridor [lat, lng] — koordinat perkiraan, ganti dengan hasil survei / gambar di mode edit peta (/map?edit=1).
    path: [
      [-8.2142, 114.3812],
      [-8.2135, 114.3828],
      [-8.2128, 114.3845],
      [-8.2122, 114.3862],
    ],
    shade_score: 60,
    // Estimasi kontribusi lingkungan koridor (kg/hari) — angka perkiraan, ganti dengan hasil kajian.
    oxygen_kg_day: 5.7,
    co2_reduced_kg_day: 7.8,
    // Masukan neraca karbon (lib/carbonBalance.js). Angka di bawah CONTOH — ganti dengan hasil survei.
    // oxygen_kg_day & co2_reduced_kg_day di atas dihitung ulang dari sini; keduanya hanya cadangan.
    carbon_inputs: {
      "pohon": [
        {
          "jenis": "angsana",
          "jumlah": 18
        },
        {
          "jenis": "mahoni",
          "jumlah": 8
        },
        {
          "jenis": "tanjung",
          "jumlah": 8
        }
      ],
      "kendaraanPerHari": {
        "motor": 1500,
        "mobil": 300,
        "bus": 10,
        "truk": 60
      },
      "toko": [
        {
          "nama": "Warung",
          "unitAC": 1,
          "kWPerUnit": 0.75,
          "jamOperasi": 8,
          "faktorBeban": 0.6
        }
      ],
      "sumberData": {
        "kendaraan": "ILUSTRASI",
        "pohon": "ILUSTRASI",
        "ac": "ILUSTRASI"
      }
    },
    condition_title: "Kondisi Koridor Terpilih",
    condition_desc:
      "Koridor pesisir dengan angin laut sejuk. Vegetasi peneduh sedang, cocok untuk jalan sore.",
    sensor: {
      pm25: 20, pm25_status: "Sehat",
      suhu: 28.6, suhu_status: "Hangat",
      kelembaban: 70, kelembaban_status: "Lembab",
      kebisingan: 58, kebisingan_status: "Tenang",
      uv_index: 5.1, uv_status: "Sedang",
      pm10: 40, so2: 25, co: 1.5, o3: 60, no2: 30,
      sensor_status: "online",
      recorded_at: new Date().toISOString(),
    },
  },
];
