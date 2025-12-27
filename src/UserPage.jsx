// src/UserPage.jsx
import React, { useState } from "react";
import "./UserPage.css";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import { FaInstagram, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { ethers } from "ethers";

const RPC_URL = import.meta.env.VITE_BSC_RPC_URL;
const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x4f0F6b00894e8069C56cb55C4A167966Ff6592e2";

// ABI مصغّر للـ getPassport فقط
const ABI = [
  {
    inputs: [
      { internalType: "string", name: "_idNumber", type: "string" },
      { internalType: "string", name: "_dateOfBirth", type: "string" },
    ],
    name: "getPassport",
    outputs: [
      { internalType: "string", name: "fullName", type: "string" },
      { internalType: "string", name: "motherName", type: "string" },
      { internalType: "string", name: "passportNumber", type: "string" },
      { internalType: "string", name: "gender", type: "string" },
      { internalType: "string", name: "dateOfBirth", type: "string" },
      { internalType: "string", name: "placeOfBirth", type: "string" },
      { internalType: "string", name: "issueDate", type: "string" },
      { internalType: "string", name: "expiryDate", type: "string" },
      { internalType: "string", name: "fingerprintHash", type: "string" },
      { internalType: "uint256", name: "sensorId", type: "uint256" },
      { internalType: "string", name: "photoUrl", type: "string" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

function UserPage() {
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const navigate = useNavigate();

  const handleShowPassport = async () => {
   if (nationalId.length !== 10) {
  alert("Please enter a valid ID Number (exactly 10 digits).");
  return;
}


    if (!birthDate) {
      alert("Please enter your Date of Birth.");
      return;
    }

    try {
      if (!RPC_URL) {
        alert("Missing RPC URL. Please set VITE_BSC_RPC_URL in .env");
        return;
      }

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      // birthDate لازم نفس صيغة المخزنة بالعقد (يفضل YYYY-MM-DD)
      const r = await contract.getPassport(nationalId, birthDate);

      const passport = {
        fullName: r.fullName,
        motherName: r.motherName,
        idNumber: nationalId,
        passportNumber: r.passportNumber,
        gender: r.gender,
        dob: r.dateOfBirth,
        birthPlace: r.placeOfBirth,
        issueDate: r.issueDate,
        expiryDate: r.expiryDate,
        fingerprintHash: r.fingerprintHash,
        sensorId: r.sensorId?.toString?.() ?? String(r.sensorId),
        photoUrl: (r.photoUrl || "").replace(/\s+/g, ""),
        active: r.active,
      };

      if (!passport.active) {
        alert("This passport is not active.");
        return;
      }

      navigate("/loading-passport", { state: { passport } });
    } catch (err) {
      console.error(err);
      const msg = (err?.shortMessage || err?.message || "").toLowerCase();

      if (msg.includes("passport not found")) {
        alert("Passport not found on blockchain.");
      } else if (msg.includes("date of birth mismatch")) {
        alert("Date of Birth does not match our records.");
      } else {
        alert("Blockchain/RPC error. Please try again later.");
      }
    }
  };

  return (
    <div className="up-scope">
      <Header />

      <div className="page-wrapper">
        <div className="login-box">
          <h2 className="inside-title">Welcome to Your Digital Passport</h2>
          <h1>Login</h1>

          <div className="input-group">
  <label htmlFor="nationalId">National ID</label>
  <input
    id="nationalId"
    name="nationalId"
    type="text"
    placeholder="Enter your ID Number (10 digits)"
    value={nationalId}
    onChange={(e) => {
      // يسمح فقط بالأرقام وبحد أقصى 10
      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
      setNationalId(v);
    }}
    inputMode="numeric"
    pattern="\d{10}"
    maxLength={10}
    autoComplete="off"
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
              rel="noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://x.com/travelerep46510"
              className="icon twitter"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
            >
              <FaXTwitter />
            </a>
            <a
              href="https://www.linkedin.com/in/traveler-epassport-06066a394/"
              className="icon linkedin"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              <FaLinkedin />
            </a>
          </div>
        </div>

        <img src="/cleanIMAGE.png" alt="passport" className="big-passport-img" />
      </div>
    </div>
  );
}

export default UserPage;
