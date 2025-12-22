// BorderLogin.jsx
import React, { useState } from "react";
import "./BorderLogin.css";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import empImg from "/b3deen-removebg-preview.png";
import { FiEye, FiEyeOff } from "react-icons/fi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

export default function BorderLogin() {
  const navigate = useNavigate();

  const [staffCode, setStaffCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!staffCode.trim() || !password) {
      setError("الرجاء إدخال رقم الموظف وكلمة السر");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/officer-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffCode: staffCode.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "فشل تسجيل الدخول");
        return;
      }

      // ✅ حفظ بيانات الضابط
      localStorage.setItem("officer", JSON.stringify(data.employee));

      // (اختياري) تنظيف الحقول
      setPassword("");

      navigate("/fingerprint-login");
    } catch (err) {
      console.error("Border login error:", err);
      setError("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-login-page">
      <Header />

      <div className="border-login-container">
        <img src={empImg} alt="Border Employee" className="border-img-left" />

        <div className="border-login-box slide-fade">
          <h2 className="border-title">Border Transit Authority</h2>
          <p className="border-subtitle">Employee Login</p>

          <form autoComplete="off" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="borderStaffCode">Employee Code</label>
              <input
                id="borderStaffCode"
                type="text"
                placeholder="Enter your ID (BTA-2001)"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="borderPassword">Password</label>

              <div className="password-wrapper">
                <input
                  id="borderPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="password-input"
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="border-login-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
