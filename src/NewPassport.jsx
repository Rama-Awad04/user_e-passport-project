// NewPassport.jsx
import React, { useEffect, useState } from "react";
import "./NewPassport.css";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { BrowserProvider, Contract } from "ethers";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

// ✅ العقد الجديد
const CONTRACT_ADDRESS = "0x4f0F6b00894e8069C56cb55C4A167966Ff6592e2";

// ✅ ABI (tuple) بدون nationalityId ومع fingerprintHash
const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "fullName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "motherName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "idNumber",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "passportNumber",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "gender",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "dateOfBirth",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "placeOfBirth",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "issueDate",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "expiryDate",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "fingerprintHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "sensorId",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "photoUrl",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "active",
						"type": "bool"
					}
				],
				"internalType": "struct EPassportBNB.Passport",
				"name": "p",
				"type": "tuple"
			}
		],
		"name": "addPassport",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "idNumber",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "passportNumber",
				"type": "string"
			}
		],
		"name": "PassportAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "idNumber",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"name": "PassportStatusChanged",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_idNumber",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "_active",
				"type": "bool"
			}
		],
		"name": "setActive",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_idNumber",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_dateOfBirth",
				"type": "string"
			}
		],
		"name": "getPassport",
		"outputs": [
			{
				"internalType": "string",
				"name": "fullName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "motherName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "passportNumber",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "gender",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "dateOfBirth",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "placeOfBirth",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "issueDate",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "expiryDate",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "fingerprintHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "sensorId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "photoUrl",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export default function NewPassport() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    idNumber: "",
    fullName: "",
    birthPlace: "",
    motherName: "",
    dob: "",
    gender: "",
    photo: null,
    photoName: "",
  });

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [sensorId, setSensorId] = useState(101);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "radio" && !checked) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const id = (formData.idNumber || "").trim();
    if (id.length !== 10) return;

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
        if (res.status === 404) return;
        if (!res.ok) return;

        const data = await res.json().catch(() => ({}));
        setFormData((prev) => ({
          ...prev,
          fullName: data.fullName || "",
          birthPlace: data.birthPlace || "",
          motherName: data.motherName || "",
          dob: (data.dob || "").slice(0, 10),
          gender: data.gender || "",
        }));
      } catch (e) {
        console.error(e);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [formData.idNumber]);

  async function sha256Hex(text) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function getSignerAndContract() {
    if (!window.ethereum) throw new Error("الرجاء تثبيت MetaMask أولاً");
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    return { contract };
  }

  // ✅ فقط POST /api/passports (بدون PATCH/PUT)
  async function createPassportInDB(payload) {
    const res = await fetch(`${API_BASE_URL}/api/passports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // إذا موجود مسبقاً، كثير باك-إند بيرجع 409 أو 400
    // هون ما بنعمل إيرور، بنكمّل عادي
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn("DB create (POST /api/passports) not ok:", res.status, txt);
      return false;
    }
    return true;
  }

  // ✅ رفع الصورة بعد إنشاء السجل
  async function uploadPassportPhoto(idNumber, file) {
    const fd = new FormData();
    fd.append("photo", file);

    const photoRes = await fetch(`${API_BASE_URL}/api/passports/${idNumber}/photo`, {
      method: "POST",
      body: fd,
    });

    if (!photoRes.ok) {
      const txt = await photoRes.text().catch(() => "");
      throw new Error(`فشل رفع الصورة: ${txt || photoRes.status}`);
    }

    const photoData = await photoRes.json().catch(() => ({}));
    const uploadedPhotoUrl = photoData?.photoUrl || "";
    if (!uploadedPhotoUrl) throw new Error("السيرفر لم يرجّع photoUrl");
    return uploadedPhotoUrl;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = ["fullName", "idNumber", "birthPlace", "motherName", "dob", "gender"];
    for (const k of required) {
      if (!formData[k] || formData[k].toString().trim() === "") {
        alert(`⚠️ الحقل ${k} فارغ`);
        return;
      }
    }

    if (!formData.photo) {
      alert("⚠️ اختاري صورة المواطن");
      return;
    }

    const passportNumber = `P${Date.now()}`;
    const issueDate = new Date().toISOString().slice(0, 10);
    const expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 10))
      .toISOString()
      .slice(0, 10);

    const fingerprintHash = await sha256Hex(
      `${formData.fullName}|${formData.idNumber}|${formData.dob}|${formData.motherName}`
    );

    setLoading(true);
    setTxHash("");

    try {
      const createdBy = JSON.parse(localStorage.getItem("staff") || "null")?.staffCode || null;

      // 1) أنشئ سجل بالـ DB (حتى /photo ما يعمل Database error)
      const dbPayload = {
        fullName: formData.fullName,
        motherName: formData.motherName,
        idNumber: formData.idNumber,
        passportNumber,
        gender: formData.gender,
        dateOfBirth: formData.dob,
        placeOfBirth: formData.birthPlace,
        issueDate,
        expiryDate,
        fingerprintHash,
        sensorId: Number(sensorId) || 0,
        photoUrl: "", // لسه
        active: true,
        createdBy,
        txHash: "",
      };
      await createPassportInDB(dbPayload);

      // 2) ارفع الصورة (إذا فشل: ما نكسر كل العملية)
      let uploadedPhotoUrl = "";
      try {
        uploadedPhotoUrl = await uploadPassportPhoto(formData.idNumber, formData.photo);
      } catch (photoErr) {
        console.warn("Photo upload failed, continuing without photoUrl:", photoErr);
        // إذا بدك توقف العملية بدل ما تكمل، علّقي السطرين تحت وفَعّلي return
        // alert(photoErr?.message || "فشل رفع الصورة");
        // return;
      }

      // 3) ارسل للبلوكشين (حتى لو photoUrl فاضي)
      const { contract } = await getSignerAndContract();

      const passportStruct = {
        fullName: formData.fullName,
        motherName: formData.motherName,
        idNumber: formData.idNumber,
        passportNumber,
        gender: formData.gender,
        dateOfBirth: formData.dob,
        placeOfBirth: formData.birthPlace,
        issueDate,
        expiryDate,
        fingerprintHash,
        sensorId: Number(sensorId) || 0,
        photoUrl: uploadedPhotoUrl || "",
        active: true,
      };

      const tx = await contract.addPassport(passportStruct);
      const receipt = await tx.wait();
      const addedHash = receipt?.hash || tx?.hash || "";
      setTxHash(addedHash);

      navigate("/fingerprint", { state: { idNumber: formData.idNumber } });
    } catch (err) {
      console.error(err);
      alert(err?.shortMessage || err?.reason || err?.message || "حدث خطأ أثناء إرسال المعاملة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-passport-page">
      <Header />

      <div className="np-top-right">
        <button className="np-logout-btn" onClick={() => navigate("/civil-login")}>
          Logout
        </button>
      </div>

      <div className="passport-form-container fade-in">
        <h2>New Passport</h2>

        <form onSubmit={handleSubmit} className="passport-form" autoComplete="off">
          <input
            type="text"
            name="idNumber"
            placeholder="National ID Number"
            value={formData.idNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setFormData((prev) => ({ ...prev, idNumber: value }));
            }}
            required
            inputMode="numeric"
            pattern="\d{10}"
            maxLength="10"
            minLength="10"
            title="The ID number must be exactly 10 digits"
            autoComplete="off"
          />

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, "");
              setFormData((prev) => ({ ...prev, fullName: value }));
            }}
            required
            autoComplete="off"
          />

          <input
            type="text"
            name="birthPlace"
            placeholder="Place of Birth"
            value={formData.birthPlace}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, "");
              setFormData((prev) => ({ ...prev, birthPlace: value }));
            }}
            required
            autoComplete="off"
          />

          <input
            type="text"
            name="motherName"
            placeholder="Mother's Name"
            value={formData.motherName}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, "");
              setFormData((prev) => ({ ...prev, motherName: value }));
            }}
            required
            autoComplete="off"
          />

          <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />

          <div className="gender-row">
            <span className="gender-label">Gender</span>

            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === "male"}
                onChange={handleChange}
                required
              />
              Male
            </label>

            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === "female"}
                onChange={handleChange}
                required
              />
              Female
            </label>
          </div>

          <div className="file-upload-box">
            <span className="file-visible-text">{formData.photoName || "Personal Photo"}</span>

            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData((prev) => ({ ...prev, photo: file, photoName: file.name }));
                } else {
                  setFormData((prev) => ({ ...prev, photo: null, photoName: "" }));
                }
              }}
              required
            />
          </div>

          <input type="hidden" name="sensorId" value={sensorId} readOnly />

          <button type="submit" disabled={loading}>
            {loading ? "...جاري الإرسال" : "Next"}
          </button>
        </form>
      </div>
    </div>
  );
}
