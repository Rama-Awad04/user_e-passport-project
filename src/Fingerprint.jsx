//fingerprint.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Fingerprint.css";
import fingerprintImg from "./image/fingerprint.png";
import Header from "./Header";



//const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
//const ESP_BASE = import.meta.env.VITE_ESP_IP   || "http://10.53.174.7";
const API_BASE = import.meta.env.VITE_API_BASE || "http://10.84.32.7:5000";
//const ESP_BASE = "http://192.168.1.16"; // بدون :5000


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
console.log('idNumber from location:', idNumber);



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
        //const res  = await fetch(`${ESP_BASE}/enroll?step=1`);
        const res  = await fetch(`${API_BASE}/api/device/enroll?step=1`);
        const data = await res.json();
        setStatus(data.message || "Step 1 response");
        setStatusType(classifyMessage(data.message, data.status));
        if (data.status === "success" || data.status === "info") setStep(2);
      } else if (step === 2) {
        setStatus("Place the same finger again...");
        setStatusType("info");
//const res2 = await fetch(`${ESP_BASE}/enroll?step=2`);
const res2 = await fetch(`${API_BASE}/api/device/enroll?step=2`);
const data2 = await res2.json();

setStatus(data2.message || "Step 2 response");
setStatusType(classifyMessage(data2.message, data2.status));
if (data2.status === "success") {
  let finalId = data2.id || data2.sensorId;

  try {
    //const vRes = await fetch(`${ESP_BASE}/verify`);
    const vRes = await fetch(`${API_BASE}/api/device/verify`);
    const vData = await vRes.json();
    if (vData?.status === "success" && vData?.id) finalId = vData.id;
  } catch {}

  await saveFingerprintToDB(finalId);
  setEnrolled(true);
  setStatus("Fingerprint enrolled & mapping updated ✅");
  setStatusType("success");
} else if (data2.status === "error") {
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
                : "#fff",
            fontWeight: statusType === "info" ? "500" : "600",
          }}
        >
          {statusType === "success"
            ? ` ${status}`
            : statusType === "error"
            ? ` ${status}`
            : ` ${status}`}
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
                ? "Processing first scan..."
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
