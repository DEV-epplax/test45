import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase web application configuration supplied by user
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCHmNub04qpY4E-9-n6Y1GBJ9eZ7X4B7to",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "iffl-a8665.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://iffl-a8665-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "iffl-a8665",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "iffl-a8665.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "989249075591",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:989249075591:web:9eeed62568ce3faa1abb22",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EGCSP14CFB"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Analytics safely (if supported in browser context)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics unavailable or blocked
  });
}
