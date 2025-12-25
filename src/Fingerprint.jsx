// Fingerprint.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Fingerprint.css";
import fingerprintImg from "./image/fingerprint.png";
import Header from "./Header";

const API_BASE = import.meta.env.VITE_API_BASE || "http://10.125.98.7:5000";

export default function Fingerprint() {
  const TEXT = useMemo(
    () => ({
      idle: "Press Start Enrollment to begin fingerprint capture.",
      scan1Prep: "Place your finger on the sensor.",
      scan2Prep: "Place the same finger again to confirm.",
      scanning: "Scanning fingerprint...",
      processing: "Processing scan...",
      saving: "Finalizing enrollment...",
      enrolled: "Fingerprint enrollment completed successfully.",
      deviceError: "Cannot reach the device. Check Wi-Fi and IP.",
      mappingError: "Enrollment succeeded, but saving the mapping failed.",
      missingId: "Missing ID Number. Please go back and start again.",
    }),
    []
  );

  const [status, setStatus] = useState(TEXT.idle);
  const [statusType, setStatusType] = useState("info"); // info | success | error
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [enrolled, setEnrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // لازم يجي من الصفحة السابقة
  const idNumber = location.state?.idNumber || "";

  // نحاول نجيب بيانات الشخص لو متوفرة (من الصفحة السابقة)
  const passedUser = location.state?.user || null; // optional
  const passedPassport = location.state?.passport || null; // optional

  const classifyMessage = (msg = "", st = "") => {
    if (st === "success") return "success";
    const m = String(msg || "").toLowerCase();
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
      return null;
    }
  };

  const readErrorMessage = async (res) => {
    // نحاول JSON أولًا، وإلا نص
    const j = await safeJson(res);
    if (j && (j.error || j.message)) return j.error || j.message;
    try {
      const t = await res.text();
      return t || `Request failed (${res.status})`;
    } catch {
      return `Request failed (${res.status})`;
    }
  };

  // 1) تأكد أن passport موجود (حتى لا يرجع "No passport found")
  //    إذا غير موجود -> ننشئ Placeholder من /api/users/:idNumber أو من state
  const ensurePassportExists = async () => {
    // جرّب GET /api/passports/:idNumber
    const getRes = await fetch(`${API_BASE}/api/passports/${encodeURIComponent(idNumber)}`);
    if (getRes.ok) return true;

    // إذا مش موجود (404) نحاول ننشئه
    if (getRes.status !== 404) {
      const err = await readErrorMessage(getRes);
      throw new Error(err || "Failed to check passport");
    }

    // نجلب بيانات الشخص من users إذا موجودة
    let user = passedUser;
    if (!user) {
      const uRes = await fetch(`${API_BASE}/api/users/${encodeURIComponent(idNumber)}`);
      if (uRes.ok) {
        user = await safeJson(uRes);
      }
    }

    // لو عندك بيانات جاهزة من state
    const p = passedPassport || {};

    // لازم نوفر الحقول الإلزامية للـ POST /api/passports:
    // fullName, idNumber, birthPlace, motherName, dob, gender
    const payload = {
      fullName: p.fullName || user?.fullName || "UNKNOWN",
      idNumber,
      birthPlace: p.birthPlace || user?.birthPlace || "UNKNOWN",
      motherName: p.motherName || user?.motherName || "UNKNOWN",
      dob: p.dob || user?.dob || "1900-01-01",
      gender: p.gender || user?.gender || "M",
      // اختياري:
      passportNumber: p.passportNumber || null,
      issueDate: p.issueDate || null,
      expiryDate: p.expiryDate || null,
      createdBy: p.createdBy || null,
    };

    const createRes = await fetch(`${API_BASE}/api/passports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!createRes.ok && createRes.status !== 409) {
      // 409 يعني موجود مسبقًا (تمام)
      const err = await readErrorMessage(createRes);
      throw new Error(err || "Failed to create passport placeholder");
    }

    return true;
  };


  // 2) حفظ mapping
  const saveFingerprintToDB = async (sensorId) => {
    const res = await fetch(`${API_BASE}/api/fingerprint-map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idNumber, sensorId }),
    });

    if (!res.ok) {
      const err = await readErrorMessage(res);
      throw new Error(err || "DB save failed");
    }
  };

  const handleEnroll = async () => {
    if (!idNumber) {
      setStatus(TEXT.missingId);
      setStatusType("error");
      return;
    }

    setLoading(true);

    try {
      console.log("API_BASE =", API_BASE, "idNumber =", idNumber);

      if (step === 1) {
        setStatus(TEXT.scan1Prep);
        setStatusType("info");

        const res = await fetch(`${API_BASE}/api/device/enroll?step=1`);
        if (!res.ok) {
          const err = await readErrorMessage(res);
          throw new Error(err || "Enroll step 1 failed");
        }
        const data = (await safeJson(res)) || {};

        const msg = data.message || TEXT.processing;
        setStatus(msg);
        setStatusType(classifyMessage(msg, data.status));

        // ننتقل للخطوة 2
        if (data.status === "success" || data.status === "info") {
          setStep(2);
          setStatus(TEXT.scan2Prep);
          setStatusType("info");
        }
      } else if (step === 2) {
        setStatus(TEXT.scan2Prep);
        setStatusType("info");

        const res2 = await fetch(`${API_BASE}/api/device/enroll?step=2`);
        if (!res2.ok) {
          const err = await readErrorMessage(res2);
          throw new Error(err || "Enroll step 2 failed");
        }
        const data2 = (await safeJson(res2)) || {};

        const msg2 = data2.message || TEXT.processing;
        setStatus(msg2);
        setStatusType(classifyMessage(msg2, data2.status));

        if (data2.status === "success") {
          // نلتقط id من الجهاز
          let finalId = data2.id ?? data2.sensorId;

          // محاولة verify لتحسين الدقة لو الجهاز يرجع id هناك
          try {
            const vRes = await fetch(`${API_BASE}/api/device/verify`);
            if (vRes.ok) {
              const vData = (await safeJson(vRes)) || {};
              if (vData?.status === "success" && vData?.id !== undefined) {
                finalId = vData.id;
              }
            }
          } catch {
            // ignore
          }

          if (finalId === undefined || finalId === null || finalId === "") {
            throw new Error("Missing final sensor id");
          }
console.log("FINAL SENSOR ID =", finalId, "ID_NUMBER =", idNumber);
          // ✅ هنا الحل: تأكدي passport موجود قبل المابينغ
          await ensurePassportExists();

          // بعد ما صار موجود -> احفظ المابينغ
          await saveFingerprintToDB(finalId);

          setStatus(TEXT.enrolled);
          setStatusType("success");
          setEnrolled(true);
        } else {
          setStatus("Enrollment failed. Please try again.");
          setStatusType("error");
          setStep(1);
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err?.message || TEXT.deviceError;

      // لو المشكلة من المابينغ خليه واضح
      if (String(msg).toLowerCase().includes("passport") || String(msg).toLowerCase().includes("mapping")) {
        setStatus(`${TEXT.mappingError} (${msg})`);
      } else {
        setStatus(msg);
      }

      setStatusType("error");
      setStep(1);
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
              color: statusType === "success" ? "green" : statusType === "error" ? "red" : "#fff",
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
            <button className="btn success" onClick={() => navigate("/passport-emp", { state: { idNumber } })}>
              Generate Passport
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
