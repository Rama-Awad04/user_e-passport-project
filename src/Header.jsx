import React from "react";
import { useNavigate } from "react-router-dom";
import { FaPassport } from "react-icons/fa";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header
      className="header"
      onClick={() => navigate("/")}
      style={{ cursor: "pointer" }}
    >
      <span className="logo">
        <FaPassport />
      </span>

      {/* 👇 شلنا الكلاس، واستعملنا inline style عشان نقطع أي تضارب */}
      <span
        style={{
          fontWeight: 700,
          fontSize: "22px",
          color: "#ffffff",
          letterSpacing: "0.5px",
          position: "relative",
          top: "-5px",
          whiteSpace: "nowrap",
        }}
      >
        e-passport
      </span>
    </header>
  );
}
