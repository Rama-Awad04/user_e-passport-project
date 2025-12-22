// StampForm.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers"; // ethers v6
import Header from "./Header";
import "./StampForm.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CONTRACT_ADDRESS = "0x00b390cab5863af012558a6829d4066280b860c5";

const CONTRACT_ABI = [
  "event MovementRecorded((uint256 movementId,uint256 idNumber,uint8 movementType,string country,string borderPoint,string stampNumber,string stampDate,string passportNumber,string officerStaffCode) data,address indexed recordedBy,uint256 recordedAt)",
  "function recordMovement((uint256 idNumber,string passportNumber,uint8 movementType,string country,string borderPoint,string stampNumber,string stampDate,string officerStaffCode) input) external returns (uint256 movementId)"
];

export default function StampForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const { idNumber, passportNumber, officerStaffCode } = location.state || {};

  const [formData, setFormData] = useState({
    country: "",
    direction: "exit", // entry / exit
    borderPoint: "",
    date: "",
    time: "", // مش مستخدمة حاليًا
    stampNumber: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------- 1) تسجيل على البلوكتشين ----------
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

    // enum MovementType { ENTRY=0, EXIT=1 }
    const movementType = formData.direction === "entry" ? 0 : 1;

    const movementInput = {
      idNumber: BigInt(idNumber),
      passportNumber: passportNumber || "",
      movementType,
      country: formData.country,
      borderPoint: formData.borderPoint,
      stampNumber: formData.stampNumber,
      stampDate: formData.date, // YYYY-MM-DD
      officerStaffCode: officerStaffCode || "",
    };

    console.log("Sending to blockchain:", movementInput);

    const tx = await contract.recordMovement(movementInput);
    console.log("Tx sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Tx confirmed:", receipt.hash);

    let movementIdOnChain = null;

    // قراءة event من اللوقز
    try {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === "MovementRecorded") {
            const eventData = parsed.args.data;
            movementIdOnChain = eventData.movementId.toString();
            console.log("MovementRecorded event data:", eventData);
            break;
          }
        } catch {
          continue;
        }
      }
    } catch (err) {
      console.error("Error parsing event:", err);
    }

    return movementIdOnChain;
  };

  // ---------- 2) حفظ في الباك إند ----------
  const saveMovementInBackend = async () => {
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

    const data = await res.json();

    if (!res.ok) {
      console.error("Error saving movement in backend:", data);
      throw new Error(data?.error || "حدث خطأ أثناء حفظ الختم في الباك إند");
    }

    return data?.movementId; // insertId من السيرفر
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idNumber) {
      alert("لا يوجد idNumber للمسافر، تأكدي من طريقة التنقّل للصفحة.");
      return;
    }

    setLoading(true);

    try {
      // 1) blockchain
      const movementIdOnChain = await recordMovementOnChain();

      // 2) backend (عشان المستخدم يقدر يشوفه لاحقًا من DB)
      const movementIdFromBackend = await saveMovementInBackend();

      // 3) روح لصفحة عرض الختم
      // ملاحظة: StampData عندك رح تعمل fetch حسب idNumber، فالمهم تبعثي idNumber
   navigate("/StampData", {
  state: {
    idNumber,
    passportNumber,
    from: "STAFF", // ✅ مهم
  },
});

    } catch (err) {
      console.error(err);
      alert(err.message || "حدث خطأ أثناء حفظ الختم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stamp-page">
      <Header />

      <main className="stamp-content fade-in">
        <div className="stamp-card">
          <h2>Stamp Details</h2>

          <form onSubmit={handleSubmit} className="stamp-form">
            <label>
              Country:
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Direction (Entry / Exit):
              <select
                name="direction"
                value={formData.direction}
                onChange={handleChange}
              >
                <option value="entry">Entry</option>
                <option value="exit">Exit</option>
              </select>
            </label>

            <label>
              Date:
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
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
                placeholder="Airport / Land border / Seaport"
                value={formData.borderPoint}
                onChange={handleChange}
                required
              />
            </label>

            <div className="stamp-buttons">
             <button
  className="view-stamp-button"
  type="submit"
  disabled={loading}
>
  {loading ? "Saving on blockchain & backend..." : "View Stamp"}
</button>

            </div>
          </form>

          {!idNumber && (
            <p style={{ marginTop: 12, textAlign: "center", opacity: 0.8 }}>
              ⚠️ Missing idNumber: افتحي الصفحة من المسار الصحيح مع state.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
