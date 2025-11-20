import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PassportData.css";
import Header from "./Header";

export default function PassportData() {
  const location = useLocation();
  const navigate = useNavigate();
  const passport = location.state?.passport;

  const [decisionMade, setDecisionMade] = useState(null); // null | "access" | "deny"

  if (!passport)
    return (
      <p style={{ textAlign: "center", marginTop: 50 }}>
        ❌ No passport data provided
      </p>
    );

  const fmt = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d) ? "-" : d.toLocaleDateString("en-GB");
  };

  const placeOfBirth = passport.placeOfBirth ?? passport.birthPlace ?? "-";
  const dateOfBirth = passport.dateOfBirth ?? passport.dob ?? null;

  return (
    <div className="passport-page">
      <Header />

      <main className="passport-content fade-in">
        <div className="content-wrapper">
          {/* 🔹 عمود فيه الرسالة + البوكس */}
          <div className="card-with-message">
            {/* 🔔 الرسالة فوق البوكس مباشرة */}
            {decisionMade && (
              <div className={`decision-message ${decisionMade}`}>
                {decisionMade === "access"
                  ? "Passport approved"
                  : "Passport rejected"}
              </div>
            )}

            <div className="passport-card fade-in">
              <h2 className="box-title">Passport Data</h2>

              <p>
                <b>Full Name:</b> {passport.fullName ?? "-"}
              </p>
              <p>
                <b>National ID:</b> {passport.idNumber ?? "-"}
              </p>
              <p>
                <b>Place of Birth:</b> {placeOfBirth}
              </p>
              <p>
                <b>Date of Birth:</b> {fmt(dateOfBirth)}
              </p>
              <p>
                <b>Mother Name:</b> {passport.motherName ?? "-"}
              </p>
              <p>
                <b>Gender:</b> {passport.gender ?? "-"}
              </p>
              <p>
                <b>Passport Number:</b> {passport.passportNumber ?? "-"}
              </p>
              <p>
                <b>Issue Date:</b> {fmt(passport.issueDate)}
              </p>
              <p>
                <b>Expiry Date:</b> {fmt(passport.expiryDate)}
              </p>

              {/* أزرار Access / Deny قبل القرار */}
              {!decisionMade && (
                <div className="decision-buttons">
                  <button
                    className="access-button"
                    onClick={() => setDecisionMade("access")}
                  >
                    Access
                  </button>

                  <button
                    className="deny-button"
                    onClick={() => setDecisionMade("deny")}
                  >
                    Deny
                  </button>
                </div>
              )}

              {/* زر Back بعد اتخاذ القرار */}
              {decisionMade && (
                <div className="back-wrapper">
                  <button
                    className="back-button"
                    onClick={() => navigate("/fingerprint-login")}
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* الصورة على اليمين */}
          <img
            src="/airplane.png"
            className="passport-image"
            alt="passport graphic"
          />
        </div>
      </main>
    </div>
  );
}
