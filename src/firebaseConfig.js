// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// === Your Firebase Configuration ===
const firebaseConfig = {
  apiKey: "AIzaSyDlSbQHd_yyXu8n16SJD0QKxMYETcgl4bY",
  authDomain: "web3-ledger.firebaseapp.com",
  projectId: "web3-ledger",
  storageBucket: "web3-ledger.firebasestorage.app",
  messagingSenderId: "266257006380",
  appId: "1:266257006380:web:5abfc5b02512b611937689",
  measurementId: "G-CS5BC9LYH1"
};

// === Initialize Firebase ===
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Automatically sign in anonymously
signInAnonymously(auth).catch((error) => {
  console.error("Firebase anonymous auth failed:", error);
});

export default app;
