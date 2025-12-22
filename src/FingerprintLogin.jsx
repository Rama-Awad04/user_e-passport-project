// FingerprintLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FingerprintLogin.css";
import fingerprintImg from "./image/fingerprint.png";
import Header from "./Header";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function FingerprintLogin() {
  const TEXT = {
    ready: "Place your finger on the sensor to verify identity.",
    scanning: "Scanning fingerprint...",
    verifying: "Verifying identity...",
    notRecognized: "Fingerprint not recognized. Please try again.",
    notLinked: "No passport is linked to this fingerprint.",
    deviceError:
      "Cannot reach the device or server. Check connection and try again.",
    buttonIdle: "Scan Fingerprint",
    buttonLoading: "Verifying...",
  };

  const [status, setStatus] = useState(TEXT.ready);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const goToFingerprint = () => {
    navigate("/border-login");
  };

  const handleScan = async () => {
    setLoading(true);
    setStatus(TEXT.scanning);

    try {
      // 1) Verify fingerprint on device
      const espRes = await fetch(`${API_BASE}/api/device/verify`);
      const espData = await espRes.json();

    

      if (espData?.status === "success" && espData?.id) {
        setStatus(TEXT.verifying);

        // 2) Fetch passport data linked to sensor id
        const apiRes = await fetch(
          `${API_BASE}/api/fingerprints/by-sensor/${espData.id}`
        );

        if (apiRes.ok) {
          const passport = await apiRes.json();
          navigate("/passport-data", { state: { passport } });
        } else {
          setStatus(TEXT.notLinked);
        }
      } else {
        setStatus(TEXT.notRecognized);
      }
    } catch (err) {
      console.error(err);
      setStatus(TEXT.deviceError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-login-scope">
      <Header />

      <button className="logout-btn" onClick={goToFingerprint}>
        Logout
      </button>

      <div className="page fingerprint-page">
        <div className="fingerprint-box fade-in">
          <h2>Traveler Identity Verification</h2>

          <img src={fingerprintImg} alt="Fingerprint" className="fingerprint-img" />

          <p style={{ minHeight: 48 }}>{status}</p>

          <button className="btn enroll" onClick={handleScan} disabled={loading}>
            {loading ? TEXT.buttonLoading : TEXT.buttonIdle}
          </button>
        </div>
      </div>
    </div>
  );
}
