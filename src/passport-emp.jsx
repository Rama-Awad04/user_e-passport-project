// PassportEmp.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./passport-emp.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

export default function PassportEmp() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialPassport = location.state?.passport || null;
  const idNumberFromState =
    location.state?.idNumber || initialPassport?.idNumber || null;

  const photoUrlFromState = (location.state?.photoUrl || "")
    .toString()
    .replace(/\s+/g, "");

  const [passport, setPassport] = useState(initialPassport);
  const [loading, setLoading] = useState(!initialPassport && !!idNumberFromState);
  const [error, setError] = useState("");

  const [photoUrl, setPhotoUrl] = useState(photoUrlFromState);
  const [cacheBuster, setCacheBuster] = useState(() => Date.now());

  const id = useMemo(
    () => passport?.idNumber || idNumberFromState,
    [passport?.idNumber, idNumberFromState]
  );

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-GB");
  };

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  // ✅ Fetch passport if not provided
  useEffect(() => {
    if (passport || !idNumberFromState) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/api/passports/${idNumberFromState}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to fetch passport data");

        const data = await safeJson(res);

        setPassport({
          fullName: data.fullName,
          idNumber: data.idNumber,
          birthPlace: data.birthPlace,
          motherName: data.motherName,
          dob: data.dob,
          gender: data.gender,
          passportNumber: data.passportNumber,
          issueDate: data.issueDate,
          expiryDate: data.expiryDate,
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError("Failed to load passport data");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [passport, idNumberFromState]);

  // ✅ Fetch photo only if not passed via state
  useEffect(() => {
    if (!id) return;
    if (photoUrlFromState) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/passports/${id}/photo`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          setPhotoUrl("");
          return;
        }

        const data = await safeJson(res);
        const clean = (data.photoUrl || "").toString().replace(/\s+/g, "");

        setPhotoUrl(clean);
        if (clean) setCacheBuster(Date.now()); // ✅ يحدث مرة لما تتغير الصورة
      } catch (err) {
        if (err?.name === "AbortError") return;
        setPhotoUrl("");
      }
    })();

    return () => controller.abort();
  }, [id, photoUrlFromState]);

  if (loading) {
    return (
      <div className="emp-passport-page">
        <Header />
        <div className="emp-passport-container">
          <div className="emp-passport-layout">
            <div className="emp-passport-box">
              <h1 className="emp-passport-title">Loading passport data...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <h1 style={{ textAlign: "center" }}>{error}</h1>;
  if (!passport) return <h1 style={{ textAlign: "center" }}>No passport data found</h1>;

  const hasPhoto = !!photoUrl;

  return (
    <div className="emp-passport-page">
      <Header />

      <div className="emp-passport-container">
        <div className="emp-passport-layout">
          <div className="emp-passport-box">
            <div className="emp-passport-content">
              <div className="emp-passport-text">
                <h1 className="emp-passport-title">Passport Data</h1>

                <p><strong>Full Name:</strong> {passport.fullName}</p>
                <p><strong>National ID:</strong> {passport.idNumber}</p>
                <p><strong>Place of Birth:</strong> {passport.birthPlace}</p>
                <p><strong>Mother&apos;s Name:</strong> {passport.motherName}</p>
                <p><strong>Date of Birth:</strong> {formatDate(passport.dob)}</p>
                <p><strong>Gender:</strong> {passport.gender}</p>
                <p><strong>Passport Number:</strong> {passport.passportNumber}</p>
                <p><strong>Issue Date:</strong> {formatDate(passport.issueDate)}</p>
                <p><strong>Expiry Date:</strong> {formatDate(passport.expiryDate)}</p>

                <div className="emp-btn-wrap">
                  <button className="emp-btn" onClick={() => navigate("/newpassport")}>
                    Go Home
                  </button>
                </div>
              </div>

              {hasPhoto && (
                <div className="emp-passport-photo">
                  <img
                    src={`${photoUrl}?v=${cacheBuster}`}
                    alt="employee"
                    className="emp-passport-img"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
