// server.js
const path = require('path');

// خلي dotenv يقرأ ملف .env اللي جنب server.js
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const db = require('./db');
const app = express();

const multer = require('multer');

// =============== إعدادات رفع الصور (Multer) =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeExt = (ext || "").toLowerCase().replace(/\s+/g, "");
cb(null, `passport_${Date.now()}${safeExt}`);

  },
});

/*const uploads = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only images allowed'));
    cb(null, true);
  },
});*/



// =============== إعدادات من .env ==================
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const DEVICE_URL = process.env.DEVICE_URL || 'http://10.0.0.1'; // ESP32 IP الافتراضي

console.log('🔧 Using DEVICE_URL =', DEVICE_URL);
console.log('🔧 FRONTEND_ORIGIN =', FRONTEND_ORIGIN);

// في Node 18+ في fetch جاهز
if (typeof fetch !== 'function') {
  console.warn('⚠️ fetch غير متوفر، تأكدي أن Node.js >= 18 أو اضيفي node-fetch');
}


/*const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  }
});*/
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only images allowed'));
    cb(null, true);
  },
});
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============== ميدل وير عامة ====================
//app.use(helmet());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// =============== راوت فحص الصحة ====================
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ==================================================
// 👤 1.a) تسجيل دخول موظف الأحوال فقط
//     POST /api/auth/civil-login
// ==================================================
app.post('/api/auth/civil-login', (req, res) => {
  const { staffCode, password } = req.body;

  if (!staffCode || !password) {
    return res.status(400).json({ error: 'staffCode و password مطلوبان' });
  }

  const sql = `
    SELECT id, staffCode, fullName, role
    FROM employees
    WHERE staffCode = ? AND password = ? AND role = 'CIVIL_REGISTRY'
    LIMIT 1
  `;

  db.query(sql, [staffCode, password], (err, rows) => {
    if (err) {
      console.error('❌ خطأ في تسجيل الدخول (civil):', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة أو ليس موظف أحوال' });
    }

    res.json({
      message: '✅ Civil login successful',
      employee: rows[0],
    });
  });
});

// ==================================================
// 👤 1.b) تسجيل دخول ضابط الجوازات فقط
//     POST /api/auth/officer-login
// ==================================================
app.post('/api/auth/officer-login', (req, res) => {
  const { staffCode, password } = req.body;

  if (!staffCode || !password) {
    return res.status(400).json({ error: 'staffCode و password مطلوبان' });
  }

  const sql = `
    SELECT id, staffCode, fullName, role
    FROM employees
    WHERE staffCode = ? AND password = ? AND role = 'BORDER_TRANSIT_AUTHORITY'
    LIMIT 1
  `;

  db.query(sql, [staffCode, password], (err, rows) => {
    if (err) {
      console.error('❌ خطأ في تسجيل الدخول (officer):', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة أو ليس ضابط جوازات' });
    }

    res.json({
      message: '✅ Officer login successful',
      employee: rows[0],
    });
  });
});

// ==================================================
// 👤 1.c) تسجيل دخول الموظف (عام) - نفس القديم
//     POST /api/auth/staff-login
// ==================================================
app.post('/api/auth/staff-login', (req, res) => {
  const { staffCode, password } = req.body;

  if (!staffCode || !password) {
    return res.status(400).json({ error: 'staffCode و password مطلوبان' });
  }

  const sql = `
    SELECT id, staffCode, fullName, role
    FROM employees
    WHERE staffCode = ? AND password = ?
    LIMIT 1
  `;

  db.query(sql, [staffCode, password], (err, rows) => {
    if (err) {
      console.error('❌ خطأ في تسجيل الدخول:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    res.json({
      message: '✅ Login successful',
      employee: rows[0],
    });
  });
});

// ==================================================
// 🔍 2) جلب جميع الجوازات
//     GET /api/passports
// ==================================================
app.get('/api/passports', (req, res) => {
  db.query('SELECT * FROM passports', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching all passports:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// 🔍 2.5) جلب جميع الجوازات مع رقم البصمة (إن وجد)
app.get('/api/passports-with-fingerprint', (req, res) => {
  const sql = `
    SELECT 
      p.*, 
      f.sensorId
    FROM passports p
    LEFT JOIN fingerprints f
      ON p.idNumber = f.idNumber
    ORDER BY p.createdAt DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error('❌ Error fetching passports with fingerprints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// ==================================================
// 📝 3) إضافة جواز جديد (من صفحة NewPassport)
//     POST /api/passports
// ==================================================
app.post('/api/passports', (req, res) => {
  const {
    fullName,
    idNumber,
    birthPlace,
    motherName,
    dob,
    gender,
    passportNumber,
    issueDate,
    expiryDate,
    createdBy,   // staffCode لموظف الأحوال (اختياري حاليًا)
  } = req.body;

  if (!fullName || !idNumber || !birthPlace || !motherName || !dob || !gender) {
    return res.status(400).json({ error: 'بعض الحقول الأساسية مفقودة' });
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
      fullName,
      idNumber,
      birthPlace,
      motherName,
      dob,
      gender,
      passportNumber || null,
      issueDate || null,
      expiryDate || null,
      createdBy || null,
    ],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.error('⚠️ Passport already exists:', err.message);
          return res.status(409).json({ error: 'Passport already exists for this ID number' });
        }
        console.error('❌ Error inserting passport:', err);
        return res.status(500).json({ error: 'Database error while inserting passport' });
      }

      res.json({
        message: '✅ Passport inserted successfully',
        id: result.insertId,
      });
    }
  );
});

// ==================================================
// 🔍 4) جلب جواز للمسافر حسب رقم الهوية
//     GET /api/passports/:idNumber
//     (تستخدمها UserPage + TempPassportPage + Summary Page)
// ==================================================
app.get('/api/passports/:idNumber', (req, res) => {
  const { idNumber } = req.params;

  const sql = `
    SELECT
      fullName,
      idNumber,
      birthPlace,
      motherName,
      dob,
      gender,
      passportNumber,
      issueDate,
      expiryDate,
      status,
      createdBy,
      createdAt,
      decidedBy,
      decidedAt
    FROM passports
    WHERE idNumber = ?
    LIMIT 1
  `;

  db.query(sql, [idNumber], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching passport:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    const row = rows[0];
    // aliases تناسب الفرونت اند (مثل PassportData.jsx و Summary Page)
    row.placeOfBirth = row.birthPlace;
    row.dateOfBirth = row.dob;

    res.json(row);
  });
});

// ==================================================
// ✅❌ 4.5) قرار ضابط الجوازات (قبول / رفض الجواز)
//     PATCH /api/passports/:idNumber/decision
// ==================================================
app.patch('/api/passports/:idNumber/decision', (req, res) => {
  const { idNumber } = req.params;
  const { status, decidedBy } = req.body;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'status يجب أن يكون APPROVED أو REJECTED' });
  }

  const sql = `
    UPDATE passports
    SET status = ?, decidedBy = ?, decidedAt = NOW()
    WHERE idNumber = ?
  `;

  db.query(sql, [status, decidedBy || null, idNumber], (err, result) => {
    if (err) {
      console.error('❌ Error updating passport decision:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    res.json({
      message: '✅ Passport decision updated',
      status,
    });
  });
});

// ==================================================
// 🖐️ 5) حفظ Mapping للبصمة (idNumber <-> sensorId)
//     POST /api/fingerprint-map
// ==================================================
app.post('/api/fingerprint-map', (req, res) => {
  const { idNumber, sensorId } = req.body;

  if (!idNumber || !sensorId) {
    return res.status(400).json({ error: 'idNumber و sensorId مطلوبان' });
  }

  // تأكد أن الجواز موجود
  db.query(
    'SELECT idNumber FROM passports WHERE idNumber = ? LIMIT 1',
    [idNumber],
    (err, rows) => {
      if (err) {
        console.error('❌ Error checking passport:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'No passport found for this idNumber' });
      }

      const sql = `
        INSERT INTO fingerprints (sensorId, idNumber, fingerprint_data)
        VALUES (?, ?, NULL)
        ON DUPLICATE KEY UPDATE idNumber = VALUES(idNumber)
      `;

      db.query(sql, [sensorId, idNumber], (err2, result) => {
        if (err2) {
          console.error('❌ Error saving fingerprint mapping:', err2);
          return res.status(500).json({ error: 'Database error while saving mapping' });
        }

        res.json({
          message: '✅ Fingerprint mapping saved',
          affectedRows: result.affectedRows,
        });
      });
    }
  );
});

// ==================================================
// 🔍 6) جلب بيانات جواز عبر sensorId البصمة
//     GET /api/fingerprints/by-sensor/:sensorId
// ==================================================
app.get('/api/fingerprints/by-sensor/:sensorId', (req, res) => {
  const { sensorId } = req.params;

  const sql = `
    SELECT
      p.fullName,
      p.idNumber,
      p.birthPlace,
      p.motherName,
      p.dob,
      p.gender,
      p.passportNumber,
      p.issueDate,
      p.expiryDate,
      p.status,
      p.createdBy,
      p.createdAt,
      p.decidedBy,
      p.decidedAt
    FROM fingerprints f
    JOIN passports  p ON f.idNumber = p.idNumber
    WHERE f.sensorId = ?
    LIMIT 1
  `;

  db.query(sql, [sensorId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching passport by sensor:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No passport linked to this fingerprint' });
    }

    const row = rows[0];
    row.placeOfBirth = row.birthPlace;
    row.dateOfBirth = row.dob;

    res.json(row);
  });
});

// 🔍 6.5) جلب جميع البصمات
app.get('/api/fingerprints', (req, res) => {
  const sql = `
    SELECT 
      sensorId, 
      idNumber, 
      fingerprint_data, 
      createdAt
    FROM fingerprints
    ORDER BY createdAt DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error('❌ Error fetching fingerprints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// ==================================================
// 🛰️ 7) بروكسي مع جهاز البصمة (ESP32 + R307)
//     GET /api/device/enroll?step=1 or 2
//     GET /api/device/verify
// ==================================================

// 🟦 Enrollment Steps
app.get('/api/device/enroll', async (req, res) => {
  const step = req.query.step;
  if (!step) {
    return res.status(400).json({ status: 'error', message: 'step is required' });
  }
  if (!DEVICE_URL) {
    return res.status(500).json({ status: 'error', message: 'DEVICE_URL is not configured' });
  }

  try {
    const resp = await fetch(`${DEVICE_URL}/enroll?step=${encodeURIComponent(step)}`);
    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = { status: 'error', message: 'Invalid JSON from device' };
    }

    if (!resp.ok) {
      console.error('❌ Device enroll error:', data);
      return res.status(502).json(data || { status: 'error', message: 'Device error' });
    }

    res.json(data);
  } catch (err) {
    console.error('❌ Device enroll proxy error:', err.message);
    res.status(502).json({ status: 'error', message: 'Device unreachable' });
  }
});

// 🟦 Verify fingerprint
app.get('/api/device/verify', async (_req, res) => {
  if (!DEVICE_URL) {
    return res.status(500).json({ status: 'error', message: 'DEVICE_URL is not configured' });
  }

  try {
    const resp = await fetch(`${DEVICE_URL}/verify`);
    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = { status: 'error', message: 'Invalid JSON from device' };
    }

    if (!resp.ok) {
      console.error('❌ Device verify error:', data);
      return res.status(502).json(data || { status: 'error', message: 'Device error' });
    }

    res.json(data);
  } catch (err) {
    console.error('❌ Device verify proxy error:', err.message);
    res.status(502).json({ status: 'error', message: 'Device unreachable' });
  }
});

// ==================================================
// 🛂 8) إضافة حركة (ختم دخول / خروج)
//     POST /api/passports/:idNumber/movements
// ==================================================
app.post('/api/passports/:idNumber/movements', (req, res) => {
  const { idNumber } = req.params;
  const { movementType, country, borderPoint, officerStaffCode, passportNumber,stampNumber,
    stampDate} = req.body;

  if (!movementType || !country || !borderPoint) {
    return res.status(400).json({ error: 'movementType و country و borderPoint مطلوبة' });
  }
  if (!['ENTRY', 'EXIT'].includes(movementType)) {
    return res.status(400).json({ error: 'movementType يجب أن يكون ENTRY أو EXIT' });
  }

  const sql = `
    INSERT INTO passport_movements
      (idNumber, passportNumber, movementType, country, borderPoint,stampNumber, stampDate, officerStaffCode)
    VALUES (?, ?, ?, ?, ?, ?,?,?)
  `;

  db.query(
    sql,
    [idNumber, passportNumber || null, movementType, country, borderPoint,stampNumber || null,
      stampDate || null, officerStaffCode || null],
    (err, result) => {
      if (err) {
        console.error('❌ Error inserting movement:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        message: '✅ Movement saved successfully',
        movementId: result.insertId,
      });
    }
  );
});

// ==================================================
// 📜 9) جلب سجل الحركات لمسافر
//     GET /api/passports/:idNumber/movements
// ==================================================
app.get('/api/passports/:idNumber/movements', (req, res) => {
  const { idNumber } = req.params;

  const sql = `
    SELECT id, passportNumber, movementType, country, borderPoint,
       stampNumber, stampDate,
       officerStaffCode, createdAt

    FROM passport_movements
    WHERE idNumber = ?
    ORDER BY createdAt DESC
  `;

  db.query(sql, [idNumber], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching movements:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});
// ==================================================rama here
// 📜 9.5) جلب كل التحركات (لكل المسافرين)
//     GET /api/movements
// ==================================================
app.get('/api/movements', (_req, res) => {
  const sql = `
    SELECT id, idNumber, passportNumber, movementType, country, borderPoint,
           stampNumber, stampDate, officerStaffCode, createdAt
    FROM passport_movements
    ORDER BY createdAt DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error('❌ Error fetching all movements:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});
app.get('/api/users/:idNumber', (req, res) => {
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
app.post('/api/users', (req, res) => {
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

  db.query(sql, [idNumber, fullName, birthPlace, motherName, dob, gender], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "✅ User info saved" });
  });
});

// ==================================================
// 🖼️ رفع صورة شخصية لجواز
// POST /api/passports/:idNumber/photo
// ==================================================
app.post('/api/passports/:idNumber/photo', upload.single('photo'), (req, res) => {
  const { idNumber } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Photo is required' });
  }

  //const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
const cleanName = req.file.filename.replace(/\s+/g, '');
const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${cleanName}`;

  const sql = `
    INSERT INTO passport_profile_photo (idNumber, photoUrl)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE photoUrl = VALUES(photoUrl)
  `;

  db.query(sql, [idNumber, photoUrl], (err) => {
    if (err) {
      console.error('❌ Error saving photo:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: '✅ Photo uploaded successfully', photoUrl });
  });
});

// ==================================================
// 🖼️ جلب رابط الصورة
// GET /api/passports/:idNumber/photo
// ==================================================
app.get('/api/passports/:idNumber/photo', (req, res) => {
  const { idNumber } = req.params;

  db.query(
    'SELECT photoUrl FROM passport_profile_photo WHERE idNumber = ?',
    [idNumber],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'No photo found' });

      res.json(rows[0]);
    }
  );
});

// ==================================================
// 🖼️ رفع صورة شخصية لجواز
// POST /api/passports/:idNumber/photo
// ==================================================
/*app.post('/api/passports/:idNumber/photo', upload.single('photo'), (req, res) => {
  const { idNumber } = req.params;

  if (!req.file) return res.status(400).json({ error: 'Photo is required' });

  const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  const sql = `
    INSERT INTO passport_profile_photo (idNumber, photoUrl)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE photoUrl = VALUES(photoUrl)
  `;

  db.query(sql, [idNumber, photoUrl], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: '✅ Photo uploaded successfully', photoUrl });
  });
});*/

// ==================================================
// 🖼️ جلب رابط الصورة
// GET /api/passports/:idNumber/photo
// ==================================================
/*app.get('/api/passports/:idNumber/photo', (req, res) => {
  const { idNumber } = req.params;

  db.query(
    'SELECT photoUrl FROM passport_profile_photo WHERE idNumber = ?',
    [idNumber],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'No photo found' });
      res.json(rows[0]);
    }
  );
});*/


// ==================================================
// 🚀 تشغيل السيرفر
// ==================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 السيرفر يعمل على: http://localhost:${PORT}`);
});
