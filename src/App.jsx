// src/App.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "./firebaseConfig";
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

// === Basic contract placeholders ===
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const CONTRACT_ABI = [];

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

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

  // --- Firestore realtime data ---
  useEffect(() => {
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
    if (!newMember.trim()) return;
    await addDoc(collection(db, "members"), {
      name: newMember.trim(),
      createdAt: serverTimestamp(),
    });
    setNewMember("");
  };

  // --- Record transaction ---
  const recordTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.memberId || !txForm.amount) return;
    const amt =
      txForm.type === "deposit"
        ? Math.abs(Number(txForm.amount))
        : -Math.abs(Number(txForm.amount));

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

  return (
    <div
      style={{
        background: "#0B1220",
        color: "#E5E7EB",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "Inter, Arial",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "auto" }}>
        <h1 style={{ textAlign: "center" }}>Web3 Ledger</h1>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <button
            onClick={connectWallet}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "#2563EB",
              color: "#fff",
              border: "none",
            }}
          >
            {wallet ? "Connected" : "Connect MetaMask"}
          </button>
          <div style={{ textAlign: "right", fontSize: 14 }}>
            <div>Status: {status}</div>
            <div>
              Wallet: {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "N/A"}
            </div>
            <div>Balance: {ethBalance ? `${Number(ethBalance).toFixed(4)} ETH` : "—"}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "#111827", padding: 10, borderRadius: 8 }}>
            <h3>Add Member</h3>
            <form onSubmit={addMember}>
              <input
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Member name"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  background: "#0B1220",
                  border: "1px solid #1F2937",
                  color: "#fff",
                  marginBottom: 8,
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                }}
              >
                Add
              </button>
            </form>
            <div style={{ marginTop: 10 }}>
              {members.map((m) => (
                <div key={m.id}>{m.name}</div>
              ))}
            </div>
          </div>

          <div style={{ flex: 2, background: "#111827", padding: 10, borderRadius: 8 }}>
            <h3>Record Transaction</h3>
            {message && <div style={{ color: "#10B981" }}>{message}</div>}
            <form onSubmit={recordTransaction}>
              <select
                value={txForm.memberId}
                onChange={(e) => setTxForm({ ...txForm, memberId: e.target.value })}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  background: "#0B1220",
                  border: "1px solid #1F2937",
                  color: "#fff",
                  marginBottom: 8,
                }}
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
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  background: "#0B1220",
                  border: "1px solid #1F2937",
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
              <input
                value={txForm.amount}
                onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                placeholder="Amount (INR)"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  background: "#0B1220",
                  border: "1px solid #1F2937",
                  color: "#fff",
                  marginBottom: 8,
                }}
              />
              <input
                value={txForm.description}
                onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                placeholder="Description"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  background: "#0B1220",
                  border: "1px solid #1F2937",
                  color: "#fff",
                  marginBottom: 8,
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                }}
              >
                Record
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: "#111827", padding: 10, borderRadius: 8 }}>
            <h3>Transactions</h3>
            {transactions.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#0B1220",
                  padding: 8,
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                <div>
                  <div>{t.description}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {formatDate(t.timestamp)} | {t.memberId}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: t.amount < 0 ? "#EF4444" : "#10B981" }}>
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
                      padding: "2px 6px",
                      marginTop: 4,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 0.5, background: "#111827", padding: 10, borderRadius: 8 }}>
            <h3>Summary</h3>
            <div>Total In: {formatCurrency(totalIn)}</div>
            <div>Total Out: {formatCurrency(totalOut)}</div>
            <div>Net: {formatCurrency(net)}</div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#9CA3AF" }}>
          © Navneet Chaudhary
        </div>
      </div>
    </div>
  );
};

export default App;
