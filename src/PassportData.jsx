// PassportData.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PassportData.css";
import Header from "./Header";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

export default function PassportData() {
  const location = useLocation();
  const navigate = useNavigate();
  const passport = location.state?.passport;

  const [decisionMade, setDecisionMade] = useState(null); // null | "access" | "deny"
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    const id = passport?.idNumber;
    if (!id) return;

    fetch(`${API_BASE_URL}/api/passports/${id}/photo`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const clean = (data.photoUrl || "").replace(/\s+/g, "");
        setPhotoUrl(clean);
      })
      .catch(() => setPhotoUrl(""));
  }, [passport?.idNumber]);

  if (!passport) {
    return (
      <p style={{ textAlign: "center", marginTop: 50 }}>
        ❌ No passport data provided
      </p>
    );
  }

  const fmt = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d) ? "-" : d.toLocaleDateString("en-GB");
  };

  const placeOfBirth = passport.placeOfBirth ?? passport.birthPlace ?? "-";
  const dateOfBirth = passport.dateOfBirth ?? passport.dob ?? null;

  const imgSrc = photoUrl ? `${photoUrl}?v=${Date.now()}` : "";

  return (
    <div className="pd-scope">
      <div className="passport-page">
        <Header />

        <main className="passport-content pd-fade-in">
          <div className="content-wrapper">
            <div className="card-with-message">
              {decisionMade && (
                <div className={`decision-message ${decisionMade}`}>
                  {decisionMade === "access"
                    ? " Passport Approved"
                    : " Passport Rejected"}
                </div>
              )}

              <div className="passport-card passport-emp-style">
                <div className="passport-emp-content">
                  <div className="passport-emp-text">
                    <h2 className="passport-emp-title">Passport Data</h2>

                    <p>
                      <b>Full Name:</b> {passport.fullName ?? "-"}
                    </p>
                    <p>
                      <b>National ID:</b> {passport.idNumber ?? "-"}
                    </p>
                    <p>
                      <b>Place of Birth:</b> {placeOfBirth}
                    </p>
                    <p>
                      <b>Mother’s Name:</b> {passport.motherName ?? "-"}
                    </p>
                    <p>
                      <b>Date of Birth:</b> {fmt(dateOfBirth)}
                    </p>
                    <p>
                      <b>Gender:</b> {passport.gender ?? "-"}
                    </p>
                    <p>
                      <b>Passport Number:</b> {passport.passportNumber ?? "-"}
                    </p>
                    <p>
                      <b>Issue Date:</b> {fmt(passport.issueDate)}
                    </p>
                    <p>
                      <b>Expiry Date:</b> {fmt(passport.expiryDate)}
                    </p>

                    {!decisionMade && (
                      <div className="decision-buttons">
                        <button
                          type="button"
                          className="access-button"
                          onClick={() => setDecisionMade("access")}
                        >
                          Access
                        </button>

                        <button
                          type="button"
                          className="deny-button"
                          onClick={() => setDecisionMade("deny")}
                        >
                          Deny
                        </button>
                      </div>
                    )}

                    {decisionMade === "access" && (
                      <div className="back-wrapper">
                        <button
                          type="button"
                          className="go-stamp-button"
                          onClick={() =>
                            navigate("/stamp-form", {
                              state: {
                                idNumber: passport.idNumber,
                                passportNumber: passport.passportNumber || null,
                              },
                            })
                          }
                        >
                          Stamp Passport
                        </button>
                      </div>
                    )}

                    {decisionMade === "deny" && (
                      <div className="back-wrapper">
                        <button
                          type="button"
                          className="back-button go-home-btn"

                          onClick={() => navigate("/fingerprint-login")}
                        >
                          Go Home
                        </button>
                      </div>
                    )}
                  </div>

                  {imgSrc && (
                    <div className="passport-emp-photo">
                      <img
                        src={imgSrc}
                        alt="passport owner"
                        className="passport-emp-img"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
