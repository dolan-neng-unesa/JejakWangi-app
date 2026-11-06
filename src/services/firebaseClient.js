// SVARGA — Konfigurasi Firebase
// Isi env di .env.local dengan kredensial project Firebase asli sebelum deploy.
// Selama kredensial belum diisi, services/* otomatis jatuh ke mock data (lihat config.js).
//
// SDK Firebase (~500 kB) SENGAJA dimuat dinamis, bukan lewat `import` statis: pada mode
// default (Laravel/mock, tanpa kredensial) SDK ini tidak pernah dipakai, tapi impor statis
// membuatnya ikut diunduh & di-parse di setiap kunjungan pertama. Sekarang ia hanya
// diunduh saat ada kredensial DAN fiturnya benar-benar dipanggil.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const hasFirebaseCredentials = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let appPromise = null;

/** Instance FirebaseApp (diinisialisasi sekali), atau null bila kredensial belum diisi. */
export function getFirebaseApp() {
  if (!hasFirebaseCredentials) return Promise.resolve(null);
  appPromise ??= import("firebase/app").then(({ initializeApp, getApps }) =>
    getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  );
  return appPromise;
}

let firestorePromise = null;

/**
 * Muat Firestore sekali pakai: `const { db, getDocs, collection, ... } = await loadFirestore();`
 * `db` bernilai null bila kredensial belum diisi — setiap fungsi service sudah menjaga
 * supaya Firestore tidak dipanggil dalam kondisi itu (cabang USE_MOCK).
 */
export function loadFirestore() {
  firestorePromise ??= Promise.all([getFirebaseApp(), import("firebase/firestore")]).then(([app, fns]) => ({
    ...fns,
    db: app ? fns.getFirestore(app) : null,
  }));
  return firestorePromise;
}
