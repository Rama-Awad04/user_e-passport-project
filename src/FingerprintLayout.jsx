// FingerprintLayout.jsx
import React from "react";
import "./FingerprintLayout.css";
import fingerprintImg from "./image/fingerprint.png";

export default function FingerprintLayout({ title, status, onClick, buttonText, loading }) {
  return (
    <div className="fingerprint-page">
      {/* Header */}
      <header className="header">
        <span className="logo">✈</span>
        <span className="logo-text">ePassport</span>
      </header>

      {/* Box */}
      <div className="fingerprint-box fade-in">
        <h2>{title}</h2>
        <img src={fingerprintImg} alt="Fingerprint" className="fingerprint-img" />
        <p>{status}</p>

        <button
          className="btn enroll"
          onClick={onClick}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Processing..." : buttonText}
        </button>
      </div>
    </div>
  );
}
