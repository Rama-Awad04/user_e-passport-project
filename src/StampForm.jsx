// StampForm.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers"; // ethers v6
import Header from "./Header";
import "./StampForm.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CONTRACT_ADDRESS = "0x00b390cab5863af012558a6829d4066280b860c5";
// ✅ ABI مطابق للكونتراكت (MovementType: ENTRY=0, EXIT=1)
const CONTRACT_ABI = [
  "event MovementRecorded((uint256 movementId,uint256 idNumber,uint8 movementType,string country,string borderPoint,string stampNumber,string stampDate,string passportNumber,string officerStaffCode) data,address indexed recordedBy,uint256 recordedAt)",
  "function recordMovement((uint256 idNumber,string passportNumber,uint8 movementType,string country,string borderPoint,string stampNumber,string stampDate,string officerStaffCode) input) external returns (uint256 movementId)",
  "function getAllMovements(uint256 idNumber) view returns (tuple(uint256 movementId,uint256 idNumber,(uint8 movementType,string country,string borderPoint,string stampNumber,string stampDate,string passportNumber,string officerStaffCode) core,uint256 recordedAt,address recordedBy)[])",
];

export default function StampForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idNumber, passportNumber, officerStaffCode } = location.state || {};

  const [formData, setFormData] = useState({
    country: "",
    direction: "exit", // "entry" | "exit"
    borderPoint: "",
    date: "",
    stampNumber: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getLastMovementFromChain = async () => {
    if (!window.ethereum) throw new Error("No Ethereum provider");
    if (!idNumber) throw new Error("Missing idNumber");

    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const list = await contract.getAllMovements(BigInt(idNumber));
    if (!list || list.length === 0) return null;

    const m = list[list.length - 1];
    return {
      movementId: m.movementId?.toString?.(),
      idNumber: m.idNumber?.toString?.(),
      movementType: Number(m.core.movementType) === 0 ? "ENTRY" : "EXIT",
      country: m.core.country,
      borderPoint: m.core.borderPoint,
      stampNumber: m.core.stampNumber,
      stampDate: m.core.stampDate,
      passportNumber: m.core.passportNumber,
      officerStaffCode: m.core.officerStaffCode,
      recordedAt: Number(m.recordedAt),
      recordedBy: m.recordedBy,
    };
  };

  const recordMovementOnChain = async () => {
    if (!window.ethereum) {
      alert("يجب تثبيت MetaMask أو محفظة تدعم Ethereum في المتصفح.");
      throw new Error("No Ethereum provider");
    }
    if (!idNumber) {
      alert("لا يوجد idNumber للمسافر، تأكدي من طريقة التنقّل للصفحة.");
      throw new Error("Missing idNumber");
    }

    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const movementType = formData.direction === "entry" ? 0 : 1;

    const movementInput = {
      idNumber: BigInt(idNumber),
      passportNumber: passportNumber || "",
      movementType,
      country: formData.country,
      borderPoint: formData.borderPoint,
      stampNumber: formData.stampNumber,
      stampDate: formData.date,
      officerStaffCode: officerStaffCode || "",
    };

    const tx = await contract.recordMovement(movementInput);
    await tx.wait();
  };

  const saveMovementInBackend = async () => {
    if (!idNumber) throw new Error("Missing idNumber");

    const movementTypeStr = formData.direction === "entry" ? "ENTRY" : "EXIT";

    const payload = {
      movementType: movementTypeStr,
      country: formData.country,
      borderPoint: formData.borderPoint,
      stampNumber: formData.stampNumber,
      stampDate: formData.date,
      passportNumber: passportNumber || null,
      officerStaffCode: officerStaffCode || null,
    };

    const res = await fetch(`${API_BASE_URL}/api/passports/${idNumber}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Backend save error:", data);
      throw new Error(data?.error || "حدث خطأ أثناء حفظ الختم في الباك إند");
    }

    return data?.movementId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idNumber) {
      alert("لا يوجد idNumber للمسافر، تأكدي من طريقة التنقّل للصفحة.");
      return;
    }

    setLoading(true);
    try {
      await recordMovementOnChain();

      let lastMovement = null;
      try {
        lastMovement = await getLastMovementFromChain();
      } catch (err) {
        console.error("Could not read last movement from chain:", err);
      }

      // ✅ على user.e-passport.me ممنوع API -> لا تنادي الباك إند
      const isBlockchainOnlyHost = window.location.hostname.endsWith("user.e-passport.me");
      if (!isBlockchainOnlyHost) {
        await saveMovementInBackend(); // ✅ اللوكال يضل شغال زي ما هو
      }

      navigate("/StampData", {
        state: { idNumber, passportNumber, from: "STAFF", lastMovement },
      });
    } catch (err) {
      console.error(err);
      alert(err?.message || "حدث خطأ أثناء حفظ الختم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sf-scope">
      <div className="stamp-page">
        <Header />

        <main className="stamp-content sf-fade-in">
          <div className="stamp-card">
            <h2>Stamp Details</h2>

            <form onSubmit={handleSubmit} className="stamp-form">
              <label>
                Country:
                <input
                  type="text"
                  name="country"
                  placeholder="Enter country name"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Direction (Entry / Exit):
                <select name="direction" value={formData.direction} onChange={handleChange}>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              </label>

              <label>
                Date:
                <input type="date" name="date" value={formData.date} onChange={handleChange} required />
              </label>

              <label>
                Stamp Number:
                <input
                  type="text"
                  name="stampNumber"
                  placeholder="Enter stamp number"
                  value={formData.stampNumber}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Border Point:
                <input
                  type="text"
                  name="borderPoint"
                  placeholder="Enter border point"
                  value={formData.borderPoint}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="stamp-buttons">
                <button className="view-stamp-button" type="submit" disabled={loading}>
                  {loading ? "Saving on blockchain & backend..." : "View Stamp"}
                </button>
              </div>
            </form>

            {!idNumber && (
              <p className="sf-warning">⚠️ Missing idNumber: افتحي الصفحة من المسار الصحيح مع state.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
