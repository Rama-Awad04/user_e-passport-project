import React from "react";
import "./CivilLogin.css";
import Header from "./Header";
import { useNavigate } from "react-router-dom";

export default function CivilLogin() {
    const navigate = useNavigate();

  return (
    <div className="civil-login-page">
      <Header />

      <div className="civil-login-container">
        <div className="civil-login-box fade-slide">

          <h2 className="civil-title">Civil Registry Portal</h2>
          <p className="civil-subtitle">Staff Login</p>

          <div className="input-group">
            <label>Staff Code</label>
            <input 
  type="text" 
  placeholder="Enter your staff code (EMP-1234)" 
/>

          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" />
          </div>

          <button 
  className="civil-login-btn" 
  onClick={() => navigate("/newpassport")}
>
  Login
</button>

        </div>
      </div>
    </div>
  );
}
