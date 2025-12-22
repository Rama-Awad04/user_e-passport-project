// src/PassportData.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./temp.css";

export default function PassportData() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const passport = state?.passport;

  const formatDate = (d) => {
    if (!d) return "";
   
    const date = new Date(d);
    if (isNaN(date)) return d; // لو كان string بصيغة مختلفة
    return date.toLocaleDateString("en-GB");
  };

  if (!passport) {
    return <h1 style={{ textAlign: "center" }}>No passport data found</h1>;
  }

  const photoUrl = (passport.photoUrl || "").replace(/\s+/g, "");
  const hasPhoto = !!photoUrl;

  return (
    <>
      <Header />

      <div className="passport-data-page">
        <div className="pd-layout">
          <div className="pd-box">
            <div className="pd-content">
              {/* النص */}
              <div className="pd-text">
                <h1 className="pd-title">Passport Data</h1>

                <p>
                  <strong>Full Name:</strong> {passport.fullName}
                </p>
                <p>
                  <strong>National ID:</strong> {passport.idNumber}
                </p>
                <p>
                  <strong>Place of Birth:</strong> {passport.birthPlace}
                </p>
                <p>
                  <strong>Mother Name:</strong> {passport.motherName}
                </p>
                <p>
                  <strong>Date of Birth:</strong> {formatDate(passport.dob)}
                </p>
                <p>
                  <strong>Gender:</strong> {passport.gender}
                </p>
                <p>
                  <strong>Passport Number:</strong> {passport.passportNumber}
                </p>
                <p>
                  <strong>Issue Date:</strong> {formatDate(passport.issueDate)}
                </p>
                <p>
                  <strong>Expiry Date:</strong> {formatDate(passport.expiryDate)}
                </p>

                <div className="pd-btn-wrap">
                  <button
                    className="pd-btn"
                    onClick={() =>
                      navigate("/StampData", {
                        state: { idNumber: passport.idNumber, from: "USER" },
                      })
                    }
                  >
                    view stamp
                  </button>
                </div>
              </div>

              {/* الصورة */}
              {hasPhoto && (
                <div className="pd-photo">
                  <img
                    src={`${photoUrl}?v=${Date.now()}`}
                    alt="passport owner"
                    className="pd-img"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
