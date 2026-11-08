// SVARGA — Konfigurasi Firebase (stub)
// Isi env di .env.local dengan kredensial project Firebase asli sebelum deploy.
// Selama kredensial belum diisi, services/* otomatis jatuh ke mock data (lihat config.js).

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const hasFirebaseCredentials = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const firebaseApp = hasFirebaseCredentials
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

// Instance Firestore siap pakai oleh services/*.js. Bernilai null selama
// USE_MOCK aktif (kredensial belum diisi) — setiap fungsi service sudah
// menjaga supaya `db` tidak pernah dipakai dalam kondisi itu.
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
