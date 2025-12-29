// StampData.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";
import Header from "./Header";
import "./StampData.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CONTRACT_ADDRESS = "0x00b390cab5863af012558a6829d4066280b860c5";
const CONTRACT_ABI = [
  "function getAllMovements(uint256 idNumber) view returns (tuple(uint256 movementId,uint256 idNumber,(uint8 movementType,string country,string borderPoint,string stampNumber,string stampDate,string passportNumber,string officerStaffCode) core,uint256 recordedAt,address recordedBy)[])",
];

export default function StampData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idNumber, from, lastMovement } = location.state || {};

  const [lastStamp, setLastStamp] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!idNumber) {
          setLastStamp(null);
          return;
        }

        const isBlockchainOnlyHost = window.location.hostname.endsWith("user.e-passport.me");

        // ✅ blockchain-only: اعرضي اللي جاي من الصفحة السابقة فوراً
        if (isBlockchainOnlyHost && lastMovement) {
          setLastStamp({
            country: lastMovement.country,
            movementType: lastMovement.movementType,
            stampDate: lastMovement.stampDate,
            stampNumber: lastMovement.stampNumber,
            borderPoint: lastMovement.borderPoint,
            createdAt: lastMovement.recordedAt ? new Date(lastMovement.recordedAt * 1000).toISOString() : null,
          });
          return;
        }

        // ✅ blockchain-only: إذا ما في lastMovement اقرأي من العقد
        if (isBlockchainOnlyHost) {
          if (!window.ethereum) throw new Error("MetaMask not found");

          const provider = new BrowserProvider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

          const list = await contract.getAllMovements(BigInt(idNumber));
          if (list && list.length > 0) {
            const m = list[list.length - 1];
            setLastStamp({
              country: m.core.country,
              movementType: Number(m.core.movementType) === 0 ? "ENTRY" : "EXIT",
              stampDate: m.core.stampDate,
              stampNumber: m.core.stampNumber,
              borderPoint: m.core.borderPoint,
              createdAt: new Date(Number(m.recordedAt) * 1000).toISOString(),
            });
          } else {
            setLastStamp(null);
          }
          return;
        }

        // ✅ لوكال: نفس ما كان (Backend)
        const res = await fetch(`${API_BASE_URL}/api/passports/${idNumber}/movements`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load movements");
        setLastStamp(Array.isArray(data) && data.length > 0 ? data[0] : null);
      } catch (e) {
        console.error(e);
        setLastStamp(null);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    load();
  }, [idNumber, lastMovement]);

  return (
    <div className="sd-scope">
      <div className={`sd-page ${from === "STAFF" ? "sd-from-staff" : ""}`}>
        <Header />

        <main className="sd-content sd-fade-in">
          <div className="sd-card">
            <h2>Stamp Details</h2>

            {loading ? (
              <p className="sd-muted">Loading stamp...</p>
            ) : lastStamp ? (
              <div className="sd-info">
                <p><strong>Country:</strong> {lastStamp.country}</p>
                <p><strong>Direction:</strong> {lastStamp.movementType}</p>
                <p><strong>Date:</strong> {formatDate(lastStamp.stampDate || lastStamp.createdAt)}</p>
                <p><strong>Stamp Number:</strong> {lastStamp.stampNumber}</p>
                <p><strong>Border Point:</strong> {lastStamp.borderPoint}</p>
              </div>
            ) : (
              <p className="sd-muted">No stamp data available.</p>
            )}

            <div className="sd-actions">
              <button
                className="sd-back-btn"
                type="button"
                onClick={() => navigate(from === "USER" ? "/UserPage" : "/fingerprint-login")}
              >
                Logout
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
