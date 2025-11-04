// src/firebaseConfig.js - **FORCE FIX: Hardcoded Credentials for Immediate Deployment**
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The required configuration from your .env.txt, directly hardcoded for guaranteed access.
// As a security best practice (Chanakya's wisdom: trust nothing, verify everything),
// these values should eventually be loaded via Vercel's environment variables and accessed
// using process.env.REACT_APP_..., but this ensures the app runs *now*.
const firebaseConfig = {
  apiKey: "AIzaSyDlSbQHd_yyXu8n16SJD0QKxMYETcgl4bY",
  authDomain: "web3-ledger.firebaseapp.com",
  projectId: "web3-ledger",
  storageBucket: "web3-ledger.firebasestorage.app",
  messagingSenderId: "266257006380",
  appId: "1:266257006380:web:5abfc5b02512b611937689",
  measurementId: "G-CS5BC9LYH1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auto anonymous login
// This line can also cause a crash if the app initialization failed, but should work now.
signInAnonymously(auth).catch((err) => {
  console.error("Firebase anonymous auth failed:", err);
});

export default app;
