import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PassportData.css";

export default function PassportData() {
  const location = useLocation();
  const navigate = useNavigate();
  const passport = location.state?.passport;

  if (!passport)
    return <p style={{ textAlign: "center", marginTop: 50 }}>❌ No passport data provided</p>;

  // ✅ فورماتر تواريخ آمن لتفادي "Invalid Date"
  const fmt = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d) ? "-" : d.toLocaleDateString("en-GB");
  };

  // ✅ خذ الحقل المتوفر سواء كان الاسم القديم أو الجديد
  const placeOfBirth = passport.placeOfBirth ?? passport.birthPlace ?? "-";
  const dateOfBirth  = passport.dateOfBirth ?? passport.dob ?? null;

  return (
    <div className="passport-page">
      <header className="header">
        <span className="logo">✈</span>
        <span className="logo-text">ePassport</span>
      </header>

      <main className="passport-content">
        <h1 className="title">Passport Data</h1>
        <div className="passport-card">
          <p><b>Full Name:</b> {passport.fullName ?? "-"}</p>
          <p><b>National ID:</b> {passport.idNumber ?? "-"}</p>
          <p><b>Place of Birth:</b> {placeOfBirth}</p>
          <p><b>Date of Birth:</b> {fmt(dateOfBirth)}</p>
          <p><b>Mother Name:</b> {passport.motherName ?? "-"}</p>
          <p><b>Gender:</b> {passport.gender ?? "-"}</p>
          <p><b>Passport Number:</b> {passport.passportNumber ?? "-"}</p>
          <p><b>Issue Date:</b> {fmt(passport.issueDate)}</p>
          <p><b>Expiry Date:</b> {fmt(passport.expiryDate)}</p>

          <button className="home-button" onClick={() => navigate("/")}>
            go home
          </button>
        </div>
      </main>
    </div>
  );
}
