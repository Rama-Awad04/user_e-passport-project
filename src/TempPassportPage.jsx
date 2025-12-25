// TempPassportPage.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./TempPassportPage.css";

export default function TempPassportPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const passport = state?.passport;

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date)) return d;
    return date.toLocaleDateString("en-GB");
  };

  if (!passport) {
    return <h1 style={{ textAlign: "center" }}>No passport data found</h1>;
  }

  const photoUrl = (passport.photoUrl || "").replace(/\s+/g, "");
  const hasPhoto = Boolean(photoUrl);

  return (
    <div className="tp-scope">
      <Header />

      <div className="tp-page">
        <div className="tp-layout">
          <div className="tp-box">
            <div className="tp-content">
              <div className="tp-text">
                <h1 className="tp-title">Passport Data</h1>

                <p><strong>Full Name:</strong> {passport.fullName}</p>
                <p><strong>National ID:</strong> {passport.idNumber}</p>
                <p><strong>Place of Birth:</strong> {passport.birthPlace}</p>
                <p><strong>Mother Name:</strong> {passport.motherName}</p>
                <p><strong>Date of Birth:</strong> {formatDate(passport.dob)}</p>
                <p><strong>Gender:</strong> {passport.gender}</p>
                <p><strong>Passport Number:</strong> {passport.passportNumber}</p>
                <p><strong>Issue Date:</strong> {formatDate(passport.issueDate)}</p>
                <p><strong>Expiry Date:</strong> {formatDate(passport.expiryDate)}</p>

                <div className="tp-btn-wrap">
                  <button
                    className="tp-btn"
                    onClick={() =>
                      navigate("/StampData", {
                        state: { idNumber: passport.idNumber, from: "USER" },
                      })
                    }
                  >
                    View Stamp
                  </button>
                </div>
              </div>

              {hasPhoto && (
                <div className="tp-photo">
                  <img
                    src={`${photoUrl}?v=${Date.now()}`}
                    alt="passport owner"
                    className="tp-img"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
