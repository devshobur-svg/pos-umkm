import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// TODO: Ganti dengan kredensial asli dari Firebase Console milikmu (Project Settings > Web Apps)
const firebaseConfig = {
  apiKey: "AIzaSyC4Mjt9Kb_yWBA25hqj_R2hpub5wbwpds4",
  authDomain: "makepro-41eab.firebaseapp.com",
  projectId: "makepro-41eab",
  storageBucket: "makepro-41eab.firebasestorage.app",
  messagingSenderId: "715004001054",
  appId: "1:715004001054:web:3a62414285e1072e97270f",
  measurementId: "G-HXCKMETEFR"
};

// Inisialisasi Firebase App (Mencegah error re-initialization saat Vite HMR / Fast Refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore dengan fitur Sinkronisasi Offline Cache otomatis
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export { app, db };