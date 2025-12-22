// Fingerprint.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Fingerprint.css";
import fingerprintImg from "./image/fingerprint.png";
import Header from "./Header";

const API_BASE = import.meta.env.VITE_API_BASE || "http://10.91.130.7:5000";

export default function Fingerprint() {
  const TEXT = {
    idle: "Press Start Enrollment to begin fingerprint capture.",
    scan1Prep: "Place your finger on the sensor.",
    scan2Prep: "Place the same finger again to confirm.",
    scanning: "Scanning fingerprint...",
    processing: "Processing scan...",
    saving: "Finalizing enrollment...",
    enrolled: "Fingerprint enrollment completed successfully ",
    deviceError: "Cannot reach the device. Check Wi-Fi and IP.",
    mappingError: "Enrollment succeeded, but saving the mapping failed.",
    missingId: "Missing ID Number. Please go back and start again.",
  };

  const [status, setStatus] = useState(TEXT.idle);
  const [statusType, setStatusType] = useState("info"); // info | success | error
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [enrolled, setEnrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const idNumber = location.state?.idNumber || "";

  const classifyMessage = (msg = "", st = "") => {
    if (st === "success") return "success";

    const m = msg.toLowerCase();
    if (
      m.includes("first scan") ||
      m.includes("remove finger") ||
      m.includes("waiting") ||
      m.includes("place") ||
      m.includes("scan") ||
      m.includes("processing")
    ) {
      return "info";
    }
    return "error";
  };

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const saveFingerprintToDB = async (sensorId) => {
    if (sensorId === undefined || sensorId === null || sensorId === "") {
      throw new Error("Missing sensorId");
    }

    const res = await fetch(`${API_BASE}/api/fingerprint-map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idNumber, sensorId }),
    });

    if (!res.ok) {
      const err = await safeJson(res);
      throw new Error(err?.error || "DB save failed");
    }
  };

  const handleEnroll = async () => {
    // ✅ حماية: لازم يكون معنا idNumber
    if (!idNumber) {
      setStatus(TEXT.missingId);
      setStatusType("error");
      return;
    }

    setLoading(true);

    try {
      if (step === 1) {
        setStatus(TEXT.scan1Prep);
        setStatusType("info");

        const res = await fetch(`${API_BASE}/api/device/enroll?step=1`);
        if (!res.ok) throw new Error("Enroll step 1 failed");
        const data = await safeJson(res);

        const msg = data.message || TEXT.processing;
        setStatus(msg);
        setStatusType(classifyMessage(msg, data.status));

        if (data.status === "success" || data.status === "info") {
          setStep(2);
          setStatus(TEXT.scan2Prep);
          setStatusType("info");
        }
      } else if (step === 2) {
        setStatus(TEXT.scan2Prep);
        setStatusType("info");

        const res2 = await fetch(`${API_BASE}/api/device/enroll?step=2`);
        if (!res2.ok) throw new Error("Enroll step 2 failed");
        const data2 = await safeJson(res2);

        const msg2 = data2.message || TEXT.processing;
        setStatus(msg2);
        setStatusType(classifyMessage(msg2, data2.status));

        if (data2.status === "success") {
          let finalId = data2.id ?? data2.sensorId;

          // محاولة تأكيد الـ id من verify لو متاح
          try {
            const vRes = await fetch(`${API_BASE}/api/device/verify`);
            if (vRes.ok) {
              const vData = await safeJson(vRes);
              if (vData?.status === "success" && vData?.id !== undefined) {
                finalId = vData.id;
              }
            }
          } catch {
            // ignore
          }

          // ✅ لازم يكون معنا finalId قبل الحفظ
          if (finalId === undefined || finalId === null || finalId === "") {
            throw new Error("Missing final sensor id");
          }

          try {
            await saveFingerprintToDB(finalId);
            setStatus(TEXT.enrolled);
            setStatusType("success");
            setEnrolled(true);
          } catch (e) {
            console.error("DB Save Error:", e);
            setStatus(TEXT.mappingError);
            setStatusType("error");
            setStep(1);
          }
        } else if (data2.status === "error") {
          setStatus("Enrollment failed. Please try again.");
          setStatusType("error");
          setStep(1);
        }
      }
    } catch (err) {
      setStatus(TEXT.deviceError);
      setStatusType("error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) {
      if (step === 1) return TEXT.scanning;
      if (step === 2) return TEXT.saving;
      return TEXT.processing;
    }
    return step === 1 ? "Start Enrollment" : "Confirm Fingerprint";
  };

  return (
    <div className="fp-scope">
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
            {status}
          </p>

          {!enrolled ? (
            <button
              className="btn enroll"
              onClick={handleEnroll}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {getButtonText()}
            </button>
          ) : (
            <button
              className="btn success"
              onClick={() => navigate("/passport-emp", { state: { idNumber } })}
            >
              Generate Passport
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
