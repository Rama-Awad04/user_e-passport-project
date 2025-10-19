import React, { useState } from "react";
import "./NewPassport.css";
import enrollImg from "./image/en.png";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function NewPassport() {
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    birthPlace: "",
    motherName: "",
    dob: "",
    gender: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = value;
    if (type === "radio" && !checked) return;
    setFormData((prev) => ({ ...prev, [name]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // تحقق من الحقول المطلوبة
    const required = ["fullName","idNumber","birthPlace","motherName","dob","gender"];
    for (const k of required) {
      if (!formData[k] || formData[k].toString().trim() === "") {
        alert(`⚠️ الحقل ${k} فارغ`);
        return;
      }
    }

    const payload = {
      ...formData,
      passportNumber: `P${Date.now()}`,
      issueDate: new Date().toISOString().slice(0,10),
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear()+10))
                      .toISOString().slice(0,10)
    };

    try {
      const res = await fetch(`${API_BASE}/api/passports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // بعد النجاح ننتقل مع رقم الهوية
        navigate("/fingerprint", { state: { idNumber: formData.idNumber } });
      } else {
        const errorData = await res.json().catch(() => null);
        alert("❌ خطأ: " + (errorData?.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("⚠ لم يتم الاتصال بالسيرفر");
    }
  };

  return (
    <div className="new-passport-page">
      <header className="header">
        <span className="logo">✈</span>
        <span className="logo-text">ePassport</span>
      </header>

      <div className="image-container fade-in">
        <img src={enrollImg} alt="Enroll" className="enroll-img" />
      </div>

      <div className="passport-form-container fade-in">
        <h2>New Passport</h2>
        <form onSubmit={handleSubmit} className="passport-form">
          <input type="text" name="fullName" placeholder="Full Name"
                 value={formData.fullName} onChange={handleChange} required />
          <input type="text" name="idNumber" placeholder="National ID Number"
                 value={formData.idNumber} onChange={handleChange} required />
          <input type="text" name="birthPlace" placeholder="Place of Birth"
                 value={formData.birthPlace} onChange={handleChange} required />
          <input type="text" name="motherName" placeholder="Mother's Name"
                 value={formData.motherName} onChange={handleChange} required />
          <input type="date" name="dob" value={formData.dob}
                 onChange={handleChange} required />

          <div className="gender-row">
            <span className="gender-label">Select Gender</span>
            <label>
              <input type="radio" name="gender" value="male"
                     checked={formData.gender === "male"}
                     onChange={handleChange} required />
              Male
            </label>
            <label>
              <input type="radio" name="gender" value="female"
                     checked={formData.gender === "female"}
                     onChange={handleChange} required />
              Female
            </label>
          </div>

          <button type="submit">Next</button>
        </form>
      </div>
    </div>
  );
}
