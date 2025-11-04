// src/App.jsx - FINAL VERSION (Changes highlighted with a comment)
import React, { useEffect, useState, useMemo, useCallback } from "react";
// Import auth along with db
import { db, auth } from "./firebaseConfig"; 
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ethers } from "ethers";

// === Constants and Utility Functions ===
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const CONTRACT_ABI = [];

const RUPEES_IN_CRORE = 10000000;
const formatCurrency = (n) => {
    // Convert raw number (in Rupees) to Crores (Cr.)
    const valueInCrores = (n || 0) / RUPEES_IN_CRORE;
    
    // Use Intl.NumberFormat for Indian Rupee symbol and two decimal places
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valueInCrores);

    // Append " Cr." for clarity
    return `${formatted} Cr.`;
};


const formatDate = (t) =>
  t?.toDate ? t.toDate().toLocaleDateString("en-IN") : new Date(t).toLocaleDateString("en-IN");

const App = () => {
  const [wallet, setWallet] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [status, setStatus] = useState("Disconnected");
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [txForm, setTxForm] = useState({
    memberId: "",
    type: "deposit",
    amount: "",
    description: "",
  });
  const [message, setMessage] = useState(null);

  // CRITICAL FIX: NEW useEffect for Anonymous Login
  useEffect(() => {
    if (auth) {
      // The auth object is guaranteed to be non-null if initialized in firebaseConfig.js
      signInAnonymously(auth).catch((err) => {
        console.error("Firebase anonymous auth failed (safely handled):", err);
        // User data features will be broken, but UI will load.
      });
    }
  }, []); // Run only once on component mount

  // --- Firestore realtime data ---
  useEffect(() => {
    // CRITICAL FIX: Ensure db is initialized before attempting Firestore calls
    if (!db) {
        console.warn("Firestore not available. Cannot fetch data.");
        return; 
    }

    const mq = query(collection(db, "members"), orderBy("createdAt", "asc"));
    const tq = query(collection(db, "transactions"), orderBy("timestamp", "desc"));

    const unsubM = onSnapshot(mq, (snap) =>
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubT = onSnapshot(tq, (snap) =>
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubM();
      unsubT();
    };
  }, []); 

  // --- Web3 Connect ---
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask first.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const account = accounts[0];
      setWallet(account);
      const bal = await provider.getBalance(account);
      setEthBalance(ethers.formatEther(bal));
      setStatus("Connected");
    } catch (err) {
      console.error(err);
      setStatus("Error");
    }
  };

  // --- Add member ---
  const addMember = async (e) => {
    e.preventDefault();
    if (!db) { setMessage("Error: Database not connected."); return; }
    if (!newMember.trim()) return;
    // ... rest of logic
    await addDoc(collection(db, "members"), {
      name: newMember.trim(),
      createdAt: serverTimestamp(),
    });
    setNewMember("");
  };

  // --- Record transaction ---
  const recordTransaction = async (e) => {
    e.preventDefault();
    if (!db) { setMessage("Error: Database not connected."); return; }
    if (!txForm.memberId || !txForm.amount) return;
    const amt =
      txForm.type === "deposit"
        ? Math.abs(Number(txForm.amount))
        : -Math.abs(Number(txForm.amount));

    // ... rest of logic
    await addDoc(collection(db, "transactions"), {
      memberId: txForm.memberId,
      type: txForm.type,
      amount: amt,
      description: txForm.description || txForm.type,
      timestamp: serverTimestamp(),
    });

    setTxForm({ ...txForm, amount: "", description: "" });
    setMessage("Transaction added.");
  };

  // --- Delete transaction ---
  const deleteTx = async (id) => {
    if (!db) { setMessage("Error: Database not connected."); return; }
    await deleteDoc(doc(db, "transactions", id));
  };

  // --- Derived metrics ---
  const { totalIn, totalOut, net } = useMemo(() => {
    let tin = 0,
      tout = 0;
    transactions.forEach((t) => {
      if (t.amount > 0) tin += t.amount;
      else tout += Math.abs(t.amount);
    });
    return { totalIn: tin, totalOut: tout, net: tin - tout };
  }, [transactions]);

  const cardStyle = { 
      flex: 1, 
      background: "#111827", 
      padding: 16, 
      borderRadius: 12, 
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
      border: "1px solid #1F2937" 
  };
  const inputStyle = {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    background: "#0B1220",
    border: "1px solid #374151",
    color: "#fff",
    marginBottom: 8,
  };
  const buttonStyle = {
    padding: "8px 14px",
    borderRadius: 8,
    background: "#059669",
    color: "#fff",
    border: "none",
    fontWeight: "bold",
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        background: "#0A0E13", // Solid Dark Background
        color: "#E5E7EB", // High contrast text
        minHeight: "100vh",
        padding: 32,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "auto" }}>
        <h1 style={{ textAlign: "center", color: "#1E90FF" }}>Web3 Ledger</h1>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, borderBottom: "1px solid #1F2937", paddingBottom: 16 }}>
          <button
            onClick={connectWallet}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: wallet ? "#006400" : "#004080", // High contrast colors
              color: "#fff",
              border: "1px solid #374151",
              fontWeight: "bold",
              cursor: 'pointer',
            }}
          >
            {wallet ? "Connected" : "Connect MetaMask"}
          </button>
          <div style={{ textAlign: "right", fontSize: 14, background: "#111827", padding: 10, borderRadius: 6, border: "1px solid #1F2937" }}>
            <div style={{color: status === 'Connected' ? '#10B981' : '#EF4444'}}>Status: {status}</div>
            <div>
              Wallet: {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "N/A"}
            </div>
            <div>Balance: {ethBalance ? `${Number(ethBalance).toFixed(4)} ETH` : "—"}</div>
          </div>
        </div>

        {/* Display an error message if Firebase failed to initialize */}
        {!db && (
            <div style={{ padding: 16, background: '#8B0000', color: '#fff', borderRadius: 8, marginBottom: 20 }}>
                <strong style={{fontSize: 16}}>CRITICAL WARNING: </strong> 
                Firebase/Database services are unavailable. Please check the browser console for configuration errors. 
                The UI is rendering, but all data-related functionality is disabled.
            </div>
        )}

        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {/* Add Member Card */}
          <div style={{ ...cardStyle, flex: 1 }}>
            <h3 style={{color: '#38BDF8'}}>Add Member</h3>
            <form onSubmit={addMember} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Member name"
                style={inputStyle}
              />
              <button
                type="submit"
                style={buttonStyle}
                disabled={!db}
              >
                Add
              </button>
            </form>
            <div style={{ marginTop: 16, maxHeight: 150, overflowY: 'auto' }}>
              {members.map((m) => (
                <div key={m.id} style={{ padding: 4, borderBottom: "1px dashed #1F2937", color: '#9CA3AF' }}>{m.name}</div>
              ))}
            </div>
          </div>

          {/* Record Transaction Card */}
          <div style={{ ...cardStyle, flex: 2 }}>
            <h3 style={{color: '#38BDF8'}}>Record Transaction</h3>
            {message && <div style={{ color: "#10B981", marginBottom: 8 }}>{message}</div>}
            <form onSubmit={recordTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select
                value={txForm.memberId}
                onChange={(e) => setTxForm({ ...txForm, memberId: e.target.value })}
                style={inputStyle}
                disabled={!db}
              >
                <option value="">Select Member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                value={txForm.type}
                onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                style={inputStyle}
                disabled={!db}
              >
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
              <input
                value={txForm.amount}
                onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                placeholder="Amount (₹)"
                type="number"
                min="0.01"
                step="0.01"
                style={inputStyle}
                disabled={!db}
              />
              <input
                value={txForm.description}
                onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                placeholder="Description"
                style={inputStyle}
                disabled={!db}
              />
              <button
                type="submit"
                style={buttonStyle}
                disabled={!db}
              >
                Record
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {/* Transactions Card */}
          <div style={{ ...cardStyle, flex: 1.5, maxHeight: 350, overflowY: 'auto' }}>
            <h3 style={{color: '#38BDF8'}}>Transactions</h3>
            {transactions.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#0B1220",
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 8,
                  borderLeft: `4px solid ${t.amount < 0 ? "#EF4444" : "#10B981"}`,
                  color: '#fff'
                }}
              >
                <div>
                  <div style={{ fontSize: 14 }}>
                    {t.description}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {formatDate(t.timestamp)}
                  </div>
                </div>
                <div style={{ textAlign: "right", display: 'flex', alignItems: 'center' }}>
                  <div style={{ color: t.amount < 0 ? "#EF4444" : "#10B981", fontWeight: 'bold', fontSize: 16, marginRight: 10 }}>
                    {formatCurrency(t.amount)}
                  </div>
                  <button
                    onClick={() => deleteTx(t.id)}
                    style={{
                      fontSize: 10,
                      color: "#fff",
                      background: "#EF4444",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 8px",
                      cursor: 'pointer',
                    }}
                    disabled={!db}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card */}
          <div style={{ ...cardStyle, flex: 0.5 }}>
            <h3 style={{color: '#38BDF8'}}>Summary</h3>
            <div style={{ padding: 8, borderBottom: "1px solid #374151" }}>
                Total In: <strong style={{color: '#10B981'}}>{formatCurrency(totalIn)}</strong>
            </div>
            <div style={{ padding: 8, borderBottom: "1px solid #374151" }}>
                Total Out: <strong style={{color: '#EF4444'}}>{formatCurrency(totalOut)}</strong>
            </div>
            <div style={{ padding: 8, fontSize: 18, marginTop: 8, background: '#0A0E13', borderRadius: 6, border: '1px solid #1E90FF' }}>
                Net: <strong style={{color: net >= 0 ? '#1E90FF' : '#EF4444'}}>{formatCurrency(net)}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#9CA3AF" }}>
          © Navneet Chaudhary | All financial data in Crores (Cr.)
        </div>
      </div>
    </div>
  );
};

export default App;
