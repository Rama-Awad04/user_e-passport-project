// src/PassportData.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./temp.css";

export default function PassportData() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const passport = state?.passport;

  if (!passport) {
    return <h1 style={{ textAlign: "center" }}>No passport data found</h1>;
  }

  return (
    <>
      <Header />
      <div className="simple-passport-container">

        <div className="simple-passport-box">

          {/* 🔹 العنوان داخل البوكس */}
          <h1 className="simple-title-inside">Passport Data</h1>

          <p><strong>Full Name:</strong> {passport.fullName}</p>
          <p><strong>National ID:</strong> {passport.idNumber}</p>
          <p><strong>Place of Birth:</strong> {passport.birthPlace}</p>
          <p><strong>Mother Name:</strong> {passport.motherName}</p>
          <p><strong>Date of Birth:</strong> {passport.dob?.slice(0,10)}</p>
          <p><strong>Gender:</strong> {passport.gender}</p>
          <p><strong>Passport Number:</strong> {passport.passportNumber}</p>
          <p><strong>Issue Date:</strong> {passport.issueDate}</p>
          <p><strong>Expiry Date:</strong> {passport.expiryDate}</p>

          <div className="home-btn-wrapper">
            <button className="home-btn" onClick={() => navigate("/UserPage")}>
              go home
            </button>
          </div>

        </div>

      </div>
    </>
  );
}
