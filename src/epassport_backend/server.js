// ======== استيراد المكتبات ========
require('dotenv').config();        // ← مهم جدًا
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// حمّل ملف env الموجود بجانب server.js داخل epassport_backend
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

console.log('📁 ENV FILE LOADED FROM:', path.resolve(__dirname, '.env'));
console.log('🔧 DEVICE_URL =', process.env.DEVICE_URL);

const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

// ======== إعدادات السيرفر ========
const app = express();
const PORT = 5000;
const db = require('./db');

app.use(cors());
app.use(bodyParser.json());

// ======== الاتصال بقاعدة البيانات ========
//const db = mysql.createConnection({
 // host: 'localhost',
  //user: 'root',          // 👈 عدل حسب إعدادات MySQL
  //password: 'root',      // 👈 عدل حسب إعدادات MySQL
  //database: 'epassport3' // اسم قاعدة البيانات
//});

//db.connect((err) => {
  //if (err) {
    //console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
    //return;
  //}
  //console.log('✅ تم الاتصال بقاعدة البيانات MySQL بنجاح');
//});

// ==========================================================
// ➕ إضافة جواز جديد
// ==========================================================
app.post('/api/passports', (req, res) => {
  const {
    fullName, idNumber, birthPlace, motherName,
    dob, gender, passportNumber, issueDate, expiryDate
  } = req.body;

  const sql = `
    INSERT INTO passports
    (fullName, idNumber, birthPlace, motherName, dob, gender, passportNumber, issueDate, expiryDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql,
    [fullName, idNumber, birthPlace, motherName, dob, gender, passportNumber, issueDate, expiryDate],
    (err, result) => {
      if (err) {
        console.error('❌ خطأ أثناء إدخال الجواز:', err);
        return res.status(500).json({ error: 'خطأ في إدخال البيانات' });
      }
      res.json({ message: '✅ تم إضافة الجواز بنجاح', id: result.insertId });
    });
});

// ==========================================================
// ➕ إضافة أو تحديث بصمة
// ==========================================================
app.post('/api/fingerprints', (req, res) => {
  const { idNumber, fingerprint_data, sensorId } = req.body;

  if (!idNumber || !fingerprint_data || !sensorId) {
    return res.status(400).json({ error: "idNumber و fingerprint_data و sensorId مطلوبة" });
  }

  let bufferData = fingerprint_data;
  if (fingerprint_data.type === "Buffer" && Array.isArray(fingerprint_data.data)) {
    bufferData = Buffer.from(fingerprint_data.data);
  }

  const sql = `
    INSERT INTO fingerprints (idNumber, fingerprint_data, sensorId)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      fingerprint_data = VALUES(fingerprint_data),
      sensorId = VALUES(sensorId)
  `;

  db.query(sql, [idNumber, bufferData, sensorId], (err) => {
    if (err) {
      console.error('❌ خطأ أثناء إدخال البصمة:', err);
      return res.status(500).json({ error: 'خطأ في إدخال البيانات' });
    }
    res.json({ message: '✅ تم إضافة/تحديث البصمة بنجاح' });
  });
});

// ==========================================================
// 📄 جلب جميع الجوازات
// ==========================================================
app.get('/api/passports', (req, res) => {
  const sql = 'SELECT * FROM passports';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ خطأ في جلب الجوازات:', err);
      return res.status(500).json({ error: 'خطأ في جلب البيانات' });
    }
    res.json(results);
  });
});

// ==========================================================
// 📄 جلب جميع البصمات
// ==========================================================
app.get('/api/fingerprints', (req, res) => {
  const sql = 'SELECT * FROM fingerprints';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ خطأ في جلب البصمات:', err);
      return res.status(500).json({ error: 'خطأ في جلب البيانات' });
    }
    res.json(results);
  });
});

// ==========================================================
// 📄 جلب الجوازات مع البصمات (JOIN)
// ==========================================================
app.get("/api/passports-with-fingerprints", (req, res) => {
  const sql = `
    SELECT p.*, f.sensorId, f.fingerprint_data
    FROM passports p
    LEFT JOIN fingerprints f ON p.idNumber = f.idNumber
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ خطأ في جلب البيانات:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ==========================================================
// 🔍 جلب جواز واحد عبر idNumber
// ==========================================================
app.get('/api/passports/:idNumber', (req, res) => {
  const { idNumber } = req.params;
  const sql = 'SELECT * FROM passports WHERE idNumber = ?';

  db.query(sql, [idNumber], (err, result) => {
    if (err) {
      console.error('❌ خطأ في جلب الجواز:', err);
      return res.status(500).json({ error: 'خطأ في جلب البيانات' });
    }
    if (result.length === 0) return res.status(404).json({ error: '⚠️ الجواز غير موجود' });
    res.json(result[0]);
  });
});

// ==========================================================
// ✏️ تحديث بيانات الجواز
// ==========================================================
app.put('/api/passports/:idNumber', (req, res) => {
  const { idNumber } = req.params;
  const {
    fullName, birthPlace, motherName, dob,
    gender, passportNumber, issueDate, expiryDate
  } = req.body;

  const sql = `
    UPDATE passports
    SET fullName=?, birthPlace=?, motherName=?, dob=?, gender=?, passportNumber=?, issueDate=?, expiryDate=?
    WHERE idNumber=?
  `;

  db.query(sql,
    [fullName, birthPlace, motherName, dob, gender, passportNumber, issueDate, expiryDate, idNumber],
    (err) => {
      if (err) {
        console.error('❌ خطأ أثناء تحديث الجواز:', err);
        return res.status(500).json({ error: 'خطأ في التحديث' });
      }
      res.json({ message: '✅ تم تحديث بيانات الجواز بنجاح' });
    });
});

// ==========================================================
// 🗑️ حذف جواز (مع بصماته بسبب ON DELETE CASCADE)
// ==========================================================
app.delete('/api/passports/:idNumber', (req, res) => {
  const { idNumber } = req.params;
  const sql = 'DELETE FROM passports WHERE idNumber = ?';

  db.query(sql, [idNumber], (err) => {
    if (err) {
      console.error('❌ خطأ أثناء الحذف:', err);
      return res.status(500).json({ error: 'خطأ في الحذف' });
    }
    res.json({ message: '✅ تم حذف الجواز والبصمات المرتبطة بنجاح' });
  });
});

// ==========================================================
// 🔍 جلب بيانات الجواز عبر sensorId
// ==========================================================
app.get('/api/lookup-by-sensor/:sensorId', (req, res) => {
  const { sensorId } = req.params;
  const sql = `
    SELECT p.*, f.sensorId
    FROM fingerprints f
    JOIN passports p ON p.idNumber = f.idNumber
    WHERE f.sensorId = ?
    LIMIT 1
  `;

  db.query(sql, [sensorId], (err, rows) => {
    if (err) {
      console.error('❌ خطأ في البحث:', err);
      return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'لا توجد بيانات لهذا sensorId' });
    }
    res.json(rows[0]);
  });
});

// ==========================================================
// 🔍 جلب بصمة واحدة بالـ id
// ==========================================================
// ============================================================
// 🔍 جلب بصمة + بيانات الجواز حسب sensorId
// ============================================================
// 🔍 جلب بصمة + بيانات الجواز حسب sensorId (بأسماء أعمدة متوافقة مع الفرونت)
app.get('/api/fingerprints/by-sensor/:sensorId', (req, res) => {
  const { sensorId } = req.params;

  const sql = `
    SELECT 
      f.id           AS fingerprintId,
      f.sensorId     AS sensorId,
      f.idNumber     AS idNumber,
      p.fullName     AS fullName,
      p.birthPlace   AS placeOfBirth,
      p.motherName   AS motherName,
      p.dob          AS dateOfBirth,
      p.gender       AS gender,
      p.passportNumber AS passportNumber,
      p.issueDate    AS issueDate,
      p.expiryDate   AS expiryDate
    FROM fingerprints f
    LEFT JOIN passports p ON p.idNumber = f.idNumber
    WHERE f.sensorId = ?
    LIMIT 1
  `;

  db.query(sql, [sensorId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  });
});


// ============================================================
// 🔍 جلب بصمة حسب sensorId (رقمها في جهاز البصمة)
// ============================================================
//app.get('/api/fingerprints/by-sensor/:sensorId', (req, res) => {
  //const { sensorId } = req.params;
  //db.query('SELECT * FROM fingerprints WHERE sensorId = ?', [sensorId], (err, rows) => {
    //if (err) return res.status(500).json({ error: 'Database error' });
    //if (!rows.length) return res.status(404).json({ error: 'Not found' });
    //res.json(rows[0]);
  //});
//});

// ==========================================================
// 🆕 ربط sensorId مع idNumber (fingerprint-map)
// ==========================================================
app.post('/api/fingerprint-map', (req, res) => {
  console.log('→ /api/fingerprint-map called with:', req.body);
  const { idNumber, sensorId, fingerprint_data } = req.body;

  if (!idNumber || !sensorId) {
    return res.status(400).json({ error: 'idNumber و sensorId مطلوبان' });
  }

  let bufferData = fingerprint_data || Buffer.from([]);
  if (fingerprint_data && fingerprint_data.type === "Buffer" && Array.isArray(fingerprint_data.data)) {
    bufferData = Buffer.from(fingerprint_data.data);
  }

  const sql = `
    INSERT INTO fingerprints (idNumber, fingerprint_data, sensorId)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      sensorId = VALUES(sensorId),
      fingerprint_data = VALUES(fingerprint_data)
  `;

  db.query(sql, [idNumber, bufferData, sensorId], (err) => {
    if (err) {
      console.error("❌ خطأ أثناء ربط البصمة بالجواز:", err);
      return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
    }
    res.json({ message: "✅ تم ربط sensorId مع رقم الهوية بنجاح" });
  });
});
// ==========================================================
// 🔄 Proxy endpoint to reach ESP32 device from HTTPS frontend
// ==========================================================
const fetch = require('node-fetch'); // 👈 تأكدي من وجود هذا السطر بالأعلى أو هنا
const DEVICE_URL = process.env.DEVICE_URL;
console.log('🔧 DEVICE_URL =', DEVICE_URL);
app.get('/api/device/verify', async (req, res) => {
  try {
    const q = req.query.id ? `?id=${encodeURIComponent(req.query.id)}` : '';
    const response = await fetch(`${DEVICE_URL}/verify${q}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Device proxy error:', err.message);
    res.status(502).json({ status: 'error', message: 'Device unreachable' });
  }
});

app.get('/api/device/enroll', async (req, res) => {
  try {
    const step = req.query.step || '1';
    const response = await fetch(`${DEVICE_URL}/enroll?step=${encodeURIComponent(step)}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Device enroll proxy error:', err.message);
    res.status(502).json({ status: 'error', message: 'Device unreachable' });
  }
});
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ==========================================================
// تشغيل السيرفر
// ==========================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 السيرفر يعمل على: http://0.0.0.0:${PORT}`);
});

