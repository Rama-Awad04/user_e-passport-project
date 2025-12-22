import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import "./StampData.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

  useEffect(() => {
    const load = async () => {
      try {
        if (!idNumber) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}/api/passports/${idNumber}/movements`
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load movements");

        // لأنه مرتب DESC، أول عنصر هو آخر ختم
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
    <div className="stamp-page">
      <Header />

      <main className="stamp-content fade-in">
        <div className="stamp-card">
          <h2>Stamp Details</h2>

          {loading ? (
            <p style={{ textAlign: "center", color: "#eef", opacity: 0.8 }}>
              Loading stamp...
            </p>
          ) : lastStamp ? (
            <div className="stamp-info">
              <p><strong>Country:</strong> {lastStamp.country}</p>
              <p><strong>Direction:</strong> {lastStamp.movementType}</p>
             <p>
  <strong>Date:</strong>{" "}
  {formatDate(lastStamp.stampDate || lastStamp.createdAt)}
</p>

              <p><strong>Stamp Number:</strong> {lastStamp.stampNumber}</p>
              <p><strong>Border Point:</strong> {lastStamp.borderPoint}</p>
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#eef", opacity: 0.8 }}>
              No stamp data available.
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: 25 }}>
        <button
  className="back-btn"
  onClick={() => navigate(from === "USER" ? "/UserPage" : "/fingerprint-login")}
  style={{ padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}
>
  Go Home
</button>

          </div>
        </div>
      </main>
    </div>
  );
}
