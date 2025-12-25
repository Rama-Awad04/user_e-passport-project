// server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const multer = require("multer");
const db = require("./db");

const app = express();

// ================== Helpers (SAFE FIXES) ==================
const toMysqlDate = (v) => {
  if (!v) return null;
  const s = String(v);
  if (s.includes("T")) return s.split("T")[0]; // 2025-12-24T...Z -> 2025-12-24
  // لو اجا كـ Date object string أو غيره
  // نخليه كما هو، على أساس الفرونت يبعث YYYY-MM-DD
  return s;
};

const normalizeGender = (g) => {
  const v = String(g || "").trim().toLowerCase();
  if (v === "m" || v === "male") return "male";
  if (v === "f" || v === "female") return "female";
  // إذا اجا "ذكر/انثى"
  if (v === "ذكر") return "male";
  if (v === "أنثى" || v === "انثى") return "female";
  return null; // نخليها null عشان نعرف اذا ناقصة فعلاً
};

// توحيد أسماء الحقول اللي بتوصل من صفحات مختلفة
const normalizePassportPayload = (body = {}) => {
  const fullName = body.fullName ?? body.name ?? body.full_name ?? null;
  const idNumber = body.idNumber ?? body.nationalId ?? body.id_number ?? null;

  const birthPlace = body.birthPlace ?? body.placeOfBirth ?? body.place_of_birth ?? null;
  const motherName = body.motherName ?? body.mother ?? body.mother_name ?? null;

  const dobRaw = body.dob ?? body.dateOfBirth ?? body.date_of_birth ?? null;
  const dob = toMysqlDate(dobRaw);

  const gender = normalizeGender(body.gender);

  const passportNumber = body.passportNumber ?? body.passport_number ?? null;
  const issueDate = toMysqlDate(body.issueDate ?? body.issue_date ?? null);
  const expiryDate = toMysqlDate(body.expiryDate ?? body.expiry_date ?? null);

  const createdBy = body.createdBy ?? body.created_by ?? null;

  return {
    fullName,
    idNumber,
    birthPlace,
    motherName,
    dob,
    gender,
    passportNumber,
    issueDate,
    expiryDate,
    createdBy,
  };
};

const isMissingRequired = (p) => {
  // required for INSERT passports table
  return !p.fullName || !p.idNumber || !p.birthPlace || !p.motherName || !p.dob || !p.gender;
};

// ================== Multer (uploads) ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeExt = (ext || "").toLowerCase().replace(/\s+/g, "");
    cb(null, `passport_${Date.now()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.mimetype)) return cb(new Error("Only images allowed"));
    cb(null, true);
  },
});

// ================== Env ==================
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const DEVICE_URL = process.env.DEVICE_URL || "http://10.0.0.1";

console.log("🔧 Using DEVICE_URL =", DEVICE_URL);
console.log("🔧 FRONTEND_ORIGIN =", FRONTEND_ORIGIN);

if (typeof fetch !== "function") {
  console.warn("⚠️ fetch غير متوفر، تأكدي أن Node.js >= 18 أو اضيفي node-fetch");
}

// ================== Middlewares ==================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================== Health ==================
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ==================================================
// AUTH
// ==================================================
app.post("/api/auth/civil-login", (req, res) => {
  const { staffCode, password } = req.body;
  if (!staffCode || !password) return res.status(400).json({ error: "staffCode و password مطلوبان" });

  const sql = `
    SELECT id, staffCode, fullName, role
    FROM employees
    WHERE staffCode = ? AND password = ? AND role = 'CIVIL_REGISTRY'
    LIMIT 1
  `;

  db.query(sql, [staffCode, password], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0)
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة أو ليس موظف أحوال" });

    res.json({ message: "✅ Civil login successful", employee: rows[0] });
  });
});

app.post("/api/auth/officer-login", (req, res) => {
  const { staffCode, password } = req.body;
  if (!staffCode || !password) return res.status(400).json({ error: "staffCode و password مطلوبان" });

  const sql = `
    SELECT id, staffCode, fullName, role
    FROM employees
    WHERE staffCode = ? AND password = ? AND role = 'BORDER_TRANSIT_AUTHORITY'
    LIMIT 1
  `;

  db.query(sql, [staffCode, password], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0)
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة أو ليس ضابط جوازات" });

    res.json({ message: "✅ Officer login successful", employee: rows[0] });
  });
});

app.post("/api/auth/staff-login", (req, res) => {
  const { staffCode, password } = req.body;
  if (!staffCode || !password) return res.status(400).json({ error: "staffCode و password مطلوبان" });

  const sql = `
    SELECT id, staffCode, fullName, role
    FROM employees
    WHERE staffCode = ? AND password = ?
    LIMIT 1
  `;

  db.query(sql, [staffCode, password], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0) return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });

    res.json({ message: "✅ Login successful", employee: rows[0] });
  });
});

// ==================================================
// PASSPORTS
// ==================================================
app.get("/api/passports", (req, res) => {
  db.query("SELECT * FROM passports", (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

app.get("/api/passports-with-fingerprint", (req, res) => {
  const sql = `
    SELECT p.*, f.sensorId
    FROM passports p
    LEFT JOIN fingerprints f ON p.idNumber = f.idNumber
    ORDER BY p.createdAt DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// ✅ FIXED: robust POST /api/passports (normalize + date + gender)
app.post("/api/passports", (req, res) => {
  const p = normalizePassportPayload(req.body);

  console.log("POST /api/passports normalized body =", p);

  if (isMissingRequired(p)) {
    return res.status(400).json({
      error: "بعض الحقول الأساسية مفقودة",
      missing: {
        fullName: !p.fullName,
        idNumber: !p.idNumber,
        birthPlace: !p.birthPlace,
        motherName: !p.motherName,
        dob: !p.dob,
        gender: !p.gender,
      },
    });
  }

  const sql = `
    INSERT INTO passports
      (fullName, idNumber, birthPlace, motherName, dob, gender,
       passportNumber, issueDate, expiryDate, status, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
  `;

  db.query(
    sql,
    [
      p.fullName,
      p.idNumber,
      p.birthPlace,
      p.motherName,
      p.dob,
      p.gender,
      p.passportNumber || null,
      p.issueDate || null,
      p.expiryDate || null,
      p.createdBy || null,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          // موجود مسبقاً
          return res.status(409).json({ error: "Passport already exists for this ID number" });
        }
        console.error("❌ Error inserting passport:", err);
        return res.status(500).json({ error: "Database error while inserting passport", code: err.code });
      }

      res.json({ message: "✅ Passport inserted successfully", id: result.insertId });
    }
  );
});

app.get("/api/passports/:idNumber", (req, res) => {
  const { idNumber } = req.params;

  const sql = `
    SELECT
      fullName, idNumber, birthPlace, motherName, dob, gender,
      passportNumber, issueDate, expiryDate, status,
      createdBy, createdAt, decidedBy, decidedAt
    FROM passports
    WHERE idNumber = ?
    LIMIT 1
  `;

  db.query(sql, [idNumber], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Passport not found" });

    const row = rows[0];
    row.placeOfBirth = row.birthPlace;
    row.dateOfBirth = row.dob;
    res.json(row);
  });
});

app.patch("/api/passports/:idNumber/decision", (req, res) => {
  const { idNumber } = req.params;
  const { status, decidedBy } = req.body;

  if (!status || !["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "status يجب أن يكون APPROVED أو REJECTED" });
  }

  const sql = `
    UPDATE passports
    SET status = ?, decidedBy = ?, decidedAt = NOW()
    WHERE idNumber = ?
  `;

  db.query(sql, [status, decidedBy || null, idNumber], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Passport not found" });
    res.json({ message: "✅ Passport decision updated", status });
  });
});

// ==================================================
// FINGERPRINT MAP
// ==================================================
/*app.post("/api/fingerprint-map", (req, res) => {
  const { idNumber, sensorId } = req.body;
  if (!idNumber || sensorId === undefined || sensorId === null || sensorId === "") {
    return res.status(400).json({ error: "idNumber و sensorId مطلوبان" });
  }

  db.query("SELECT idNumber FROM passports WHERE idNumber = ? LIMIT 1", [idNumber], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0) return res.status(404).json({ error: "No passport found for this idNumber" });

    const sql = `
      INSERT INTO fingerprints (sensorId, idNumber, fingerprint_data)
      VALUES (?, ?, NULL)
      ON DUPLICATE KEY UPDATE idNumber = VALUES(idNumber)
    `;

    db.query(sql, [sensorId, idNumber], (err2, result) => {
      if (err2) return res.status(500).json({ error: "Database error while saving mapping" });
      res.json({ message: "✅ Fingerprint mapping saved", affectedRows: result.affectedRows });
    });
  });
});*/
app.post("/api/fingerprint-map", (req, res) => {
  const { idNumber, sensorId } = req.body;
  if (!idNumber || sensorId === undefined || sensorId === null || sensorId === "") {
    return res.status(400).json({ error: "idNumber و sensorId مطلوبان" });
  }

  // 1) تأكد passport موجود
  db.query("SELECT idNumber FROM passports WHERE idNumber = ? LIMIT 1", [idNumber], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0) return res.status(404).json({ error: "No passport found for this idNumber" });

    // 2) ✅ أهم خطوة: افحص إذا sensorId مستخدم لشخص ثاني
    db.query("SELECT idNumber FROM fingerprints WHERE sensorId = ? LIMIT 1", [sensorId], (err2, frows) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      if (frows && frows.length > 0) {
        const existing = frows[0].idNumber;

        // لو نفس الشخص -> اعتبرها OK (بدون تغيير)
        if (existing === idNumber) {
          return res.json({ message: "✅ Fingerprint already linked to this ID", sensorId, idNumber });
        }

        // لو لشخص ثاني -> ارفض
        return res.status(409).json({
          error: "This fingerprint is already linked to another ID number",
          sensorId,
          linkedTo: existing,
        });
      }

      // 3) إذا مش مستخدم -> اعمل إدخال جديد
      const sql = `
        INSERT INTO fingerprints (sensorId, idNumber, fingerprint_data)
        VALUES (?, ?, NULL)
      `;

      db.query(sql, [sensorId, idNumber], (err3, result) => {
        if (err3) {
          // لو idNumber unique ضربت (مش مفروض يصير عندك) بس نخلي الرسالة واضحة
          if (err3.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "This ID number is already linked to another fingerprint" });
          }
          return res.status(500).json({ error: "Database error while saving mapping" });
        }

        res.json({ message: "✅ Fingerprint mapping saved", affectedRows: result.affectedRows });
      });
    });
  });
});

app.get("/api/fingerprints/by-sensor/:sensorId", (req, res) => {
  const { sensorId } = req.params;

  const sql = `
    SELECT
      p.fullName, p.idNumber, p.birthPlace, p.motherName, p.dob, p.gender,
      p.passportNumber, p.issueDate, p.expiryDate, p.status,
      p.createdBy, p.createdAt, p.decidedBy, p.decidedAt
    FROM fingerprints f
    JOIN passports p ON f.idNumber = p.idNumber
    WHERE f.sensorId = ?
    LIMIT 1
  `;

  db.query(sql, [sensorId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0) return res.status(404).json({ error: "No passport linked to this fingerprint" });

    const row = rows[0];
    row.placeOfBirth = row.birthPlace;
    row.dateOfBirth = row.dob;
    res.json(row);
  });
});

app.get("/api/fingerprints", (req, res) => {
  const sql = `
    SELECT sensorId, idNumber, fingerprint_data, createdAt
    FROM fingerprints
    ORDER BY createdAt DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// ==================================================
// DEVICE PROXY
// ==================================================
app.get("/api/device/enroll", async (req, res) => {
  const step = req.query.step;
  if (!step) return res.status(400).json({ status: "error", message: "step is required" });
  if (!DEVICE_URL) return res.status(500).json({ status: "error", message: "DEVICE_URL is not configured" });

  try {
    const resp = await fetch(`${DEVICE_URL}/enroll?step=${encodeURIComponent(step)}`);
    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = { status: "error", message: "Invalid JSON from device" };
    }
    if (!resp.ok) return res.status(502).json(data || { status: "error", message: "Device error" });
    res.json(data);
  } catch (err) {
    res.status(502).json({ status: "error", message: "Device unreachable" });
  }
});

app.get("/api/device/verify", async (_req, res) => {
  if (!DEVICE_URL) return res.status(500).json({ status: "error", message: "DEVICE_URL is not configured" });

  try {
    const resp = await fetch(`${DEVICE_URL}/verify`);
    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = { status: "error", message: "Invalid JSON from device" };
    }
    if (!resp.ok) return res.status(502).json(data || { status: "error", message: "Device error" });
    res.json(data);
  } catch (err) {
    res.status(502).json({ status: "error", message: "Device unreachable" });
  }
});

// ==================================================
// MOVEMENTS
// ==================================================
app.post("/api/passports/:idNumber/movements", (req, res) => {
  const { idNumber } = req.params;
  const { movementType, country, borderPoint, officerStaffCode, passportNumber, stampNumber, stampDate } = req.body;

  if (!movementType || !country || !borderPoint) {
    return res.status(400).json({ error: "movementType و country و borderPoint مطلوبة" });
  }
  if (!["ENTRY", "EXIT"].includes(movementType)) {
    return res.status(400).json({ error: "movementType يجب أن يكون ENTRY أو EXIT" });
  }

  const sql = `
    INSERT INTO passport_movements
      (idNumber, passportNumber, movementType, country, borderPoint, stampNumber, stampDate, officerStaffCode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      idNumber,
      passportNumber || null,
      movementType,
      country,
      borderPoint,
      stampNumber || null,
      toMysqlDate(stampDate) || null,
      officerStaffCode || null,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "✅ Movement saved successfully", movementId: result.insertId });
    }
  );
});

app.get("/api/passports/:idNumber/movements", (req, res) => {
  const { idNumber } = req.params;

  const sql = `
    SELECT id, passportNumber, movementType, country, borderPoint, stampNumber, stampDate, officerStaffCode, createdAt
    FROM passport_movements
    WHERE idNumber = ?
    ORDER BY createdAt DESC
  `;

  db.query(sql, [idNumber], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

app.get("/api/movements", (_req, res) => {
  const sql = `
    SELECT id, idNumber, passportNumber, movementType, country, borderPoint, stampNumber, stampDate, officerStaffCode, createdAt
    FROM passport_movements
    ORDER BY createdAt DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// ==================================================
// USERS (userinformation)
// ==================================================
app.get("/api/users/:idNumber", (req, res) => {
  const { idNumber } = req.params;

  const sql = `
    SELECT idNumber, fullName, birthPlace, motherName, dob, gender
    FROM userinformation
    WHERE idNumber = ?
    LIMIT 1
  `;

  db.query(sql, [idNumber], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  });
});

app.post("/api/users", (req, res) => {
  const { idNumber, fullName, birthPlace, motherName, dob, gender } = req.body;

  if (!idNumber || !fullName || !birthPlace || !motherName || !dob || !gender) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO userinformation (idNumber, fullName, birthPlace, motherName, dob, gender)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      fullName = VALUES(fullName),
      birthPlace = VALUES(birthPlace),
      motherName = VALUES(motherName),
      dob = VALUES(dob),
      gender = VALUES(gender)
  `;

  db.query(sql, [idNumber, fullName, birthPlace, motherName, toMysqlDate(dob), normalizeGender(gender) || gender], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "✅ User info saved" });
  });
});

// ==================================================
// PHOTO (SAFE FIX: auto-create placeholder passport if missing)
// ==================================================
const ensurePassportForPhoto = (idNumber, cb) => {
  db.query("SELECT idNumber FROM passports WHERE idNumber = ? LIMIT 1", [idNumber], (err, rows) => {
    if (err) return cb(err);

    if (rows && rows.length > 0) return cb(null, true); // موجود

    // مش موجود -> نحاول نجيب من userinformation
    db.query(
      "SELECT idNumber, fullName, birthPlace, motherName, dob, gender FROM userinformation WHERE idNumber = ? LIMIT 1",
      [idNumber],
      (err2, urows) => {
        if (err2) return cb(err2);

        const u = (urows && urows[0]) || null;

        const payload = {
          fullName: u?.fullName || "UNKNOWN",
          idNumber,
          birthPlace: u?.birthPlace || "UNKNOWN",
          motherName: u?.motherName || "UNKNOWN",
          dob: toMysqlDate(u?.dob) || "1900-01-01",
          gender: normalizeGender(u?.gender) || "male",
          passportNumber: null,
          issueDate: null,
          expiryDate: null,
          createdBy: null,
        };

        const insertSql = `
          INSERT INTO passports
            (fullName, idNumber, birthPlace, motherName, dob, gender,
             passportNumber, issueDate, expiryDate, status, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
        `;

        db.query(
          insertSql,
          [
            payload.fullName,
            payload.idNumber,
            payload.birthPlace,
            payload.motherName,
            payload.dob,
            payload.gender,
            payload.passportNumber,
            payload.issueDate,
            payload.expiryDate,
            payload.createdBy,
          ],
          (err3) => {
            if (err3 && err3.code !== "ER_DUP_ENTRY") return cb(err3);
            return cb(null, true);
          }
        );
      }
    );
  });
};

app.post("/api/passports/:idNumber/photo", upload.single("photo"), (req, res) => {
  const { idNumber } = req.params;

  if (!req.file) return res.status(400).json({ error: "Photo is required" });

  const cleanName = req.file.filename.replace(/\s+/g, "");
  const photoUrl = `${req.protocol}://${req.get("host")}/uploads/${cleanName}`;

  // ✅ ensure passport exists BEFORE insert photo to avoid FK error
  ensurePassportForPhoto(idNumber, (err) => {
    if (err) {
      console.error("❌ ensurePassportForPhoto error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const sql = `
      INSERT INTO passport_profile_photo (idNumber, photoUrl)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE photoUrl = VALUES(photoUrl)
    `;

    db.query(sql, [idNumber, photoUrl], (err2) => {
      if (err2) {
        console.error("❌ Error saving photo:", err2);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "✅ Photo uploaded successfully", photoUrl });
    });
  });
});

app.get("/api/passports/:idNumber/photo", (req, res) => {
  const { idNumber } = req.params;

  db.query("SELECT photoUrl FROM passport_profile_photo WHERE idNumber = ?", [idNumber], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0) return res.status(404).json({ error: "No photo found" });
    res.json(rows[0]);
  });
});

// ==================================================
// START SERVER
// ==================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 السيرفر يعمل على: http://localhost:${PORT}`);
});


//10.125.98.7:5000
//http://10.125.98.7:5000/api/health
//http://10.125.98.7:5000/api/fingerprints
//http://10.125.98.7:5000/api/passports/9765882123
///api/passports
///api/passports/{idNumber}
///api/fingerprints/by-sensor/{sensorId}
///api/passports/{idNumber}/photo
///api/users/{idNumber}














