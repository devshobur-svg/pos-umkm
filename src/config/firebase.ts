import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Definisikan cadangan ID mentah murni jika env bermasalah sewaktu di-load bundler
const FALLBACK_PROJECT_ID = "pos-umkm-pwa"; 

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // Proteksi ganda: Jika env kosong, paksa pakai fallback ID agar path projects/ tidak bergaris miring ganda (//)
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FALLBACK_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Konfigurasi cache diperkuat untuk mencegah BloomFilterError pada SDK Firebase
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export { app, db };