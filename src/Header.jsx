// Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaPassport } from "react-icons/fa";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="ep-header">
      <div
        className="ep-header-left"
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
        style={{ cursor: "pointer" }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/");
        }}
      >
        <FaPassport className="ep-logo" />
        <span className="ep-header-text">e-passport</span>
      </div>
    </header>
  );
}
