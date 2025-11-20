//newpassport.jsx
import React, { useState } from "react";
import "./NewPassport.css";
import enrollImg from "./image/this.png";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

// ✅ استيرادات ethers v6
import { BrowserProvider, Contract } from "ethers";

// ===== إعدادات عامة =====
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const CONTRACT_ADDRESS = "0x9aBdC666C6886a571ab5EA5aA432aA7e82F38b0c";

// ✅ ABI الحقيقي الذي زوّدتني به
const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "anonymous": false, "inputs": [
      { "indexed": false, "internalType": "string", "name": "NationalityNumber", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "PassportNumber", "type": "string" }
    ], "name": "PassportAdded", "type": "event"
  },
  { "anonymous": false, "inputs": [
      { "indexed": false, "internalType": "string", "name": "NationalityNumber", "type": "string" },
      { "indexed": false, "internalType": "bool", "name": "Active", "type": "bool" }
    ], "name": "PassportStatusChanged", "type": "event"
  },
  { "inputs": [
      { "internalType": "string", "name": "FullName", "type": "string" },
      { "internalType": "string", "name": "NationalityNumber", "type": "string" },
      { "internalType": "string", "name": "PassportNumber", "type": "string" },
      { "internalType": "string", "name": "DateOfIssue", "type": "string" },
      { "internalType": "string", "name": "DateOfExpiry", "type": "string" },
      { "internalType": "string", "name": "FingerPrint", "type": "string" },
      { "internalType": "uint256", "name": "SensorIdNumber", "type": "uint256" }
    ], "name": "addPassport", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  },
  { "inputs": [{ "internalType": "string", "name": "NationalityNumber", "type": "string" }],
    "name": "getPassport", "outputs": [
      { "internalType": "string", "name": "FullName", "type": "string" },
      { "internalType": "string", "name": "PassportNumber", "type": "string" },
      { "internalType": "string", "name": "DateOfIssue", "type": "string" },
      { "internalType": "string", "name": "DateOfExpiry", "type": "string" },
      { "internalType": "string", "name": "FingerPrint", "type": "string" },
      { "internalType": "uint256", "name": "SensorIdNumber", "type": "uint256" },
      { "internalType": "bool", "name": "Active", "type": "bool" }
    ], "stateMutability": "view", "type": "function"
  },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view", "type": "function"
  },
  { "inputs": [
      { "internalType": "string", "name": "NationalityNumber", "type": "string" },
      { "internalType": "bool", "name": "Active_", "type": "bool" }
    ], "name": "setActive", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  },
  { "inputs": [
      { "internalType": "string", "name": "NationalityNumber", "type": "string" },
      { "internalType": "string", "name": "FullName", "type": "string" },
      { "internalType": "string", "name": "PassportNumber", "type": "string" },
      { "internalType": "string", "name": "DateOfExpiry", "type": "string" }
    ], "name": "verifyPassport", "outputs": [{ "internalType": "bool", "name": "valid", "type": "bool" }],
    "stateMutability": "view", "type": "function"
  }
];

export default function NewPassport() {
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    birthPlace: "",
    motherName: "",
    dob: "",
    gender: "",
  });

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [sensorId, setSensorId] = useState(101); // تقدر تجيبها من الجهاز/الإعدادات
  const navigate = useNavigate();

  // تحديث الحقول
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "radio" && !checked) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // توليد Hash نصي للبصمة (مؤقتًا) باستخدام Web Crypto
  async function sha256Hex(text) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // الاتصال بالمحفظة والحصول على signer + contract
  async function getSignerAndContract() {
    if (!window.ethereum) throw new Error("الرجاء تثبيت MetaMask أولاً");
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    return { signer, contract };
    // (لو حاب ترجع العنوان) const addr = await signer.getAddress();
  }

  // الإرسال
  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من الحقول المطلوبة
    const required = ["fullName","idNumber","birthPlace","motherName","dob","gender"];
    for (const k of required) {
      if (!formData[k] || formData[k].toString().trim() === "") {
        alert(`⚠️ الحقل ${k} فارغ`);
        return;
      }
    }

    // تجهيز بيانات الجواز
    const passportNumber = `P${Date.now()}`;
    const issueDate = new Date().toISOString().slice(0,10);
    const expiryDate = new Date(new Date().setFullYear(new Date().getFullYear()+10))
                        .toISOString().slice(0,10);

    // بصمة مؤقتة (غيّرها لاحقًا ببصمة جهازك)
    const fingerprint = await sha256Hex(
      `${formData.fullName}|${formData.idNumber}|${formData.dob}`
    );

    setLoading(true);
    setTxHash("");

    try {
      // 1) استدعاء العقد الذكي: addPassport
      const { contract } = await getSignerAndContract();

      // دالة العقد تتوقع: (FullName, NationalityNumber, PassportNumber, DateOfIssue, DateOfExpiry, FingerPrint, SensorIdNumber)
      const tx = await contract.addPassport(
        formData.fullName,
        formData.idNumber,
        passportNumber,
        issueDate,
        expiryDate,
        fingerprint,
        Number(sensorId) || 0
      );

      // انتظر التأكيد
      const receipt = await tx.wait();
      setTxHash(receipt?.hash || tx?.hash || "");
      console.log("✅ TX confirmed:", receipt);

      // 2) إرسال للـ API (إن رغبت بالاحتفاظ بنسخة في السيرفر)
      const payload = {
        ...formData,
        passportNumber,
        issueDate,
        expiryDate,
        fingerprint,       // حتى تحتفظ بقيمة البصمة
        sensorId: Number(sensorId) || 0
      };

      try {
        const res = await fetch(`${API_BASE}/api/passports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.warn("API error:", errorData);
        }
      } catch (apiErr) {
        console.warn("لم يتم الاتصال بالسيرفر، لكن المعاملة على البلوكشين تمت.", apiErr);
      }

      // 3) الانتقال لصفحة أخذ البصمة/الخطوة التالية
      navigate("/fingerprint", { state: { idNumber: formData.idNumber } });

    } catch (err) {
      console.error(err);
      alert(err?.shortMessage || err?.message || "حدث خطأ أثناء إرسال المعاملة");
    } finally {
      setLoading(false);
    }
  };

return (
<div className="new-passport-page">
      <Header />

      {/* البوكس على اليسار */}
      <div className="passport-form-container fade-in">
        <h2>New Passport</h2>

        <form onSubmit={handleSubmit} className="passport-form">
       <input
  type="text"
  name="fullName"
  placeholder="Full Name"
  value={formData.fullName}
  onChange={(e) => {
    const value = e.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, "");
    setFormData((prev) => ({ ...prev, fullName: value }));
  }}
  required
/>


<input
  type="text"
  name="idNumber"
  placeholder="National ID Number"
  value={formData.idNumber}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, ""); // يمنع أي حرف مش رقم
    setFormData((prev) => ({ ...prev, idNumber: value }));
  }}
  required
  pattern="\d{10}"
  maxLength="10"
  minLength="10"
  title="The ID number must be exactly 10 digits"
/>



        <input
  type="text"
  name="birthPlace"
  placeholder="Place of Birth"
  value={formData.birthPlace}
  onChange={(e) => {
    const value = e.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, "");
    setFormData((prev) => ({ ...prev, birthPlace: value }));
  }}
  required
/>

        <input
  type="text"
  name="motherName"
  placeholder="Mother's Name"
  value={formData.motherName}
  onChange={(e) => {
    const value = e.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, "");
    setFormData((prev) => ({ ...prev, motherName: value }));
  }}
  required
/>

          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />

          <div className="gender-row">
            <span className="gender-label">Select Gender</span>
            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === "male"}
                onChange={handleChange}
                required
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === "female"}
                onChange={handleChange}
                required
              />
              Female
            </label>
          </div>

          {/* Sensor ID اختياري */}
          <input
            type="hidden"
            name="sensorId"
            placeholder="Sensor ID (اختياري)"
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            min="0"
          />

          <button type="submit" disabled={loading}>
            {loading ? "...جاري الإرسال" : "Next"}
          </button>
        </form>

        {txHash && (
          <p style={{ marginTop: 12 }}>
            ✅ تم إرسال المعاملة:{" "}
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              عرض على المستكشف
            </a>
          </p>
        )}
      </div>
      <div className="image-container fade-in">
        <img src={enrollImg} alt="Enroll" className="enroll-img" />
      </div>
    </div>
    
      
  );
}
