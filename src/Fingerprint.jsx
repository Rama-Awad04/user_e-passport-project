import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Fingerprint.css";
import fingerprintImg from "./image/fingerprint.png";
import Header from "./Header";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Fingerprint() {
  const [status, setStatus] = useState("Press Start Enrollment to begin.");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [enrolled, setEnrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // رقم الهوية القادم من صفحة الجواز
  const idNumber = location.state?.idNumber || "";

  const ESP_IP = "192.168.1.28"; // غيّر IP جهاز الاستشعار

  const classifyMessage = (msg = "", status = "") => {
    if (status === "success") return "success";
    if (
      msg.toLowerCase().includes("first scan") ||
      msg.toLowerCase().includes("remove finger") ||
      msg.toLowerCase().includes("waiting") ||
      msg.toLowerCase().includes("place")
    ) {
      return "info";
    }
    return "error";
  };

  // ✅ تعديل: حفظ Mapping بين idNumber و sensorId
  const saveFingerprintToDB = async (sensorId) => {
    try {
      const res = await fetch(`${API_BASE}/api/fingerprint-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idNumber: idNumber,
          sensorId: sensorId
        })
      });

      if (res.ok) {
        console.log("✅ Mapping saved successfully");
      } else {
        const err = await res.json().catch(() => null);
        console.error("❌ DB Save Error:", err?.error || "Unknown error");
      }
    } catch (e) {
      console.error("⚠️ DB connection error:", e);
    }
  };

  const handleEnroll = async () => {
    setLoading(true);

    try {
      if (step === 1) {
        setStatus("Place your finger on the sensor...");
        setStatusType("info");
        const res = await fetch(`http://${ESP_IP}/enroll?step=1`);
        const data = await res.json();
        setStatus(data.message || "Step 1 response");
        setStatusType(classifyMessage(data.message, data.status));
        if (data.status === "success" || data.status === "info") setStep(2);
      } else if (step === 2) {
        setStatus("Place the same finger again...");
        setStatusType("info");
        const res = await fetch(`http://${ESP_IP}/enroll?step=2`);
        const data = await res.json();
        setStatus(data.message || "Step 2 response");
        setStatusType(classifyMessage(data.message, data.status));
        if (data.status === "success") {
          setEnrolled(true);
          // ✅ تعديل: حفظ sensorId بدل fingerprint_data
          await saveFingerprintToDB(data.id || data.sensorId);
        } else if (data.status === "error") {
          setStep(1);
        }
      }
    } catch (err) {
      setStatus("Cannot reach device. Check Wi-Fi and IP.");
      setStatusType("error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Header />
      <header className="header">
        <span className="logo">✈</span>
        <span className="logo-text">ePassport</span>
      </header>

      <div className="fingerprint-box fade-in">
        <h2>Fingerprint Enrollment</h2>
        <img src={fingerprintImg} alt="Fingerprint" className="fingerprint-img" />

        <p
          style={{
            minHeight: 48,
            color:
              statusType === "success"
                ? "green"
                : statusType === "error"
                ? "red"
                : "#333",
            fontWeight: statusType === "info" ? "500" : "600",
          }}
        >
          {statusType === "success"
            ? `✅ ${status}`
            : statusType === "error"
            ? `❌ ${status}`
            : `ℹ️ ${status}`}
        </p>

        {!enrolled ? (
          <button
            className="btn enroll"
            onClick={handleEnroll}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? step === 1
                ? "Saving first scan..."
                : "Saving confirmation..."
              : step === 1
              ? "Start Enrollment"
              : "Confirm Fingerprint"}
          </button>
        ) : (
          <button className="btn success" onClick={() => navigate("/")}>
            Go to Home
          </button>
        )}
      </div>
    </div>
  );
}
