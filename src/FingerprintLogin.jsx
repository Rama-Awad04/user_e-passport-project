import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FingerprintLogin.css";
import fingerprintImg from "./image/fingerprint.png";
import Header from "./Header";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function FingerprintLogin() {
  const [status, setStatus] = useState("Ready to scan fingerprint");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScan = async () => {
    setLoading(true);
    setStatus("Scanning...");
    try {
      const espRes = await fetch(`${API_BASE}/api/device/verify`);
      const espData = await espRes.json();

      console.log("ESP verify ->", espData);

      if (espData.status === "success" && espData.id) {
        const apiRes = await fetch(
          `${API_BASE}/api/fingerprints/by-sensor/${espData.id}`
        );

        if (apiRes.ok) {
          const passport = await apiRes.json();
          navigate("/passport-data", { state: { passport } });
        } else {
          setStatus("❌ No passport linked to this fingerprint");
        }
      } else {
        setStatus("❌ Fingerprint not recognized");
      }
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Cannot reach device or server");
    } finally {
      setLoading(false);
    }
  };

  return (
   <> <Header />
    <div className="page fingerprint-page">
      

      {/* حاوية البوكس + الصورة على اليمين */}
      {/*<div className="content-wrapper">*/}
        
        <div className="fingerprint-box fade-in">
          <h2>Passenger Identity Verification</h2>
          <img src={fingerprintImg} alt="Fingerprint" className="fingerprint-img" />
          <p style={{ minHeight: 48 }}>{status}</p>

          <button className="btn enroll" onClick={handleScan} disabled={loading}>
            {loading ? "Verifying..." : "Scan Fingerprint"}
          </button>
        </div>

       

      </div></>
    
  );
}
