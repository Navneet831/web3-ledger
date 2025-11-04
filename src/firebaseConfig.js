// src/firebaseConfig.js - FINAL VERSION
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth"; // Keep import but move execution
import { getFirestore } from "firebase/firestore";

// Configuration loaded from Vercel Environment Variables (REACT_APP prefix is key for CRA)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

let app;
let auth;
let db;

// Mandatory check: Only initialize if the critical API key exists
if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // REMOVED: signInAnonymously(auth).catch((err) => { ... });
    // This asynchronous call is now handled inside App.jsx

  } catch (err) {
    console.error("FATAL: Firebase App Initialization Failed:", err);
    // On failure, set exports to null to prevent downstream component crashes
    app = null;
    auth = null;
    db = null;
  }
} else {
  console.error("FATAL ERROR: Firebase API Key is missing. Check Vercel Environment Variables.");
  app = null;
  auth = null;
  db = null;
}

// Export the initialized (or null) objects
export { auth, db };
export default app;
