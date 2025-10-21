import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Fingerprint.css";
import fingerprintImg from "./image/fingerprint.png";


const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const ESP_IP = "167.172.111.146"; // IP جهاز ESP32 عندك
console.log(import.meta.env.VITE_API_BASE);

// ⚡ IP جهاز الـ ESP32

export default function FingerprintLogin() {
  const [status, setStatus] = useState("Press button to scan finger.");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScan = async () => {
    setLoading(true);
    setStatus("Scanning...");
    try {
      // ✅ استدعاء جهاز الـ ESP للحصول على sensorId
       const espRes = await fetch(`http://${ESP_IP}/verify`);


      const espData = await espRes.json();
console.log('ESP verify ->', espData);
console.log('API base ->', API_BASE);
      if (espData.status === "success" && espData.id) {
        // ✅ طلب بيانات الجواز من الباك إند باستخدام sensorId
        
       const apiRes = await fetch(`${API_BASE}/api/fingerprints/by-sensor/${espData.id}`);

        if (apiRes.ok) {
          const passport = await apiRes.json();
          // نرسل بيانات الجواز مباشرة للصفحة التالية
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
    <div className="page Fingerprint-page">
      <header className="header">
        <span className="logo">✈</span>
        <span className="logo-text">ePassport</span>
      </header>

      <div className="fingerprint-box fade-in">
        <h2>Fingerprint Login</h2>
        <img src={fingerprintImg} alt="Fingerprint" className="fingerprint-img" />
        <p style={{ minHeight: 48 }}>{status}</p>

        <button className="btn enroll" onClick={handleScan} disabled={loading}>
          {loading ? "Verifying..." : "Scan Finger"}
        </button>
      </div>
    </div>
  );
}
