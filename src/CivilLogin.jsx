// CivilLogin.jsx
import React, { useState } from "react";
import "./CivilLogin.css";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

export default function CivilLogin() {
  const navigate = useNavigate();

  const [staffCode, setStaffCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!staffCode.trim() || !password) {
      setError("الرجاء إدخال رقم الموظف وكلمة السر");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/staff-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffCode: staffCode.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "فشل تسجيل الدخول");
        return;
      }

      localStorage.setItem("staff", JSON.stringify(data.employee));
      navigate("/newpassport");
    } catch (err) {
      console.error("Login error:", err);
      setError("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civil-login-page">
      <Header />

      <div className="civil-login-container">
        <div className="civil-login-illustration">
          <img src="/ahwal.png" alt="Civil registry illustration" />
        </div>

        <div className="civil-login-box fade-slide">
          <h2 className="civil-title">Civil Registry Portal</h2>
          <p className="civil-subtitle">Staff Login</p>

          <form onSubmit={handleSubmit} autoComplete="new-password">

            <div className="input-group">
              <label htmlFor="staffCode">Staff Code</label>
              <input
                id="staffCode"
                name="staffCode"
                type="text"
                placeholder="Enter your staff code (CIV-1001)"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                className="civil-input"
               autoComplete="new-password"


              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="civil-input"
                  autoComplete="new-password"

                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="civil-login-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
