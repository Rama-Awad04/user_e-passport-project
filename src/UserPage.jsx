// src/UserPage.jsx
import React, { useState } from "react";
import "./UserPage.css";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import { FaInstagram, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function UserPage() {
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const navigate = useNavigate();

  const handleShowPassport = async () => {
    if (nationalId.length !== 10) {
      alert("National ID must be exactly 10 digits.");
      return;
    }

    if (!birthDate) {
      alert("Please enter your Date of Birth.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/passports/${nationalId}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Passport not found");
        return;
      }

      // التأكد من تاريخ الميلاد
      if (data.dob) {
        const dbDob = data.dob.slice(0, 10);
        if (dbDob !== birthDate) {
          alert("Date of Birth does not match our records.");
          return;
        }
      }

     navigate("/loading-passport", { state: { passport: data } });


    } catch (err) {
      console.error(err);
      alert("Cannot reach server. Please try again later.");
    }
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div className="login-box">
          <h2 className="inside-title">Welcome to Your Digital Passport</h2>
          <h1>Login</h1>

          <div className="input-group">
            <label htmlFor="nationalId">National ID</label>
            <input
              id="nationalId"
              type="text"
              value={nationalId}
              onChange={(e) => {
                const v = e.target.value;
                if (/^\d{0,10}$/.test(v)) setNationalId(v);
              }}
              maxLength="10"
            />
          </div>

          <div className="input-group">
            <label htmlFor="birthDate">Date of Birth</label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <button className="primary-btn" onClick={handleShowPassport}>
            Show Passport
          </button>

          <div className="social-icons">
            <a
              href="https://www.instagram.com/traveler_epassport/"
              className="icon instagram"
              target="_blank"
            >
              <FaInstagram />
            </a>
            <a
              href="https://x.com/travelerep46510"
              className="icon twitter"
              target="_blank"
            >
              <FaXTwitter />
            </a>
            <a
              href="https://www.linkedin.com/in/traveler-epassport-06066a394/"
              className="icon linkedin"
              target="_blank"
            >
              <FaLinkedin />
            </a>
          </div>
        </div>

        <img
          src="/cleanIMAGE.png"
          alt="passport"
          className="big-passport-img"
        />
      </div>
    </>
  );
}

export default UserPage;
