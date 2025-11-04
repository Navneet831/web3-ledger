// src/firebaseConfig.js - Updated to validate environment variables
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Load environment variables for Firebase configuration
// CRA automatically injects REACT_APP_ prefixed environment variables at build time.
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

// Brutal truth check: If a critical variable is missing (even if it's supposed to be there), 
// prevent the fatal crash and log the error clearly.
if (firebaseConfig.apiKey) {
  // Initialize Firebase if the API key is present
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Auto anonymous login
  signInAnonymously(auth).catch((err) => {
    console.error("Firebase anonymous auth failed:", err);
    // Suppress further errors if auth is disabled or fails gracefully
  });
} else {
  // CRITICAL FAILURE POINT: The build step or Vercel environment variable injection failed.
  console.error(
    "FATAL ERROR: Firebase API Key is missing. The application cannot initialize Firebase services."
  );
  // Assign dummy values to avoid downstream crashes in other components trying to access db/auth
  app = null;
  auth = { currentUser: null };
  db = null;
}

export { auth, db };
export default app;
