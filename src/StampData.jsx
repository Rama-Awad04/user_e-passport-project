// StampData.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import "./StampData.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function StampData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idNumber, from } = location.state || {};

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
          setLoading(false);
          return;
        }

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

    load();
  }, [idNumber]);

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
