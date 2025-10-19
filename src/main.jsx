// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import NewPassport from "./NewPassport";
import Fingerprint from "./Fingerprint";       // صفحة البصمة الأولى (enrollment)
import FingerprintLogin from "./FingerprintLogin"; // صفحة البصمة الثانية (login)
import PassportData from "./PassportData";     // صفحة البيانات

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/newpassport" element={<NewPassport />} />
        <Route path="/fingerprint" element={<Fingerprint />} /> 
        <Route path="/fingerprint-login" element={<FingerprintLogin />} /> 
        <Route path="/passport-data" element={<PassportData />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
