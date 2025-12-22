// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import NewPassport from "./NewPassport";
import Fingerprint from "./Fingerprint";
import FingerprintLogin from "./FingerprintLogin";
import PassportData from "./PassportData";
import UserPage from "./UserPage"; // استدعاء الصفحة الجديدة
import TempPassportPage from "./TempPassportPage";
import CivilLogin from "./CivilLogin";
import BorderLogin from "./BorderLogin";
import PassportEmp from "./passport-emp"; 
import StampForm from "./StampForm";
import StampData from "./StampData";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/newpassport" element={<NewPassport />} />
        <Route path="/fingerprint" element={<Fingerprint />} /> 
        <Route path="/fingerprint-login" element={<FingerprintLogin />} /> 
        <Route path="/passport-data" element={<PassportData />} />
        <Route path="/UserPage" element={<UserPage />} />
        <Route path="/loading-passport" element={<TempPassportPage />} />
        <Route path="/civil-login" element={<CivilLogin />} />
        <Route path="/border-login" element={<BorderLogin />} />
        <Route path="/passport-emp" element={<PassportEmp />} /> 
        <Route path="/stamp-form" element={<StampForm />} />
        <Route path="/StampData" element={<StampData />} />

      </Routes>
    </Router>
  </React.StrictMode>
);
