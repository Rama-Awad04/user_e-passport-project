// App.jsx
import React from "react";
import "./App.css";
import planeLine from "./image/planeLine-removebg-preview.png";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
export default function App() {
  const navigate = useNavigate();

  return (
    <div className="page">
      {/* HEADER */}
      <Header />
     {/* <header className="header">
        <span className="logo">✈</span>
        <span className="logo-text">ePassport</span>
      </header>*/}

      {/* MAIN */}
      <main className="content fade-in">
        {/* صورة الطيارة فوق النص */}
        <img src={planeLine} alt="Plane Line" className="plane-line" />

        <h1 className="title">Explore the Future of Travel</h1>

        <div className="buttons-vertical">
          <button
            className="btn primary"
            onClick={() => navigate("/newpassport")} // ⬅ ينقلك على صفحة NewPassport
          >
            Create New Passport
          </button>

          <button 
            className="btn outline" 
            onClick={() => navigate("/fingerprint-login")} // ⬅ الآن يفتح صفحة Login
          >
            Login with Fingerprint
          </button>
        </div>
      </main>
    </div>
  );
}
