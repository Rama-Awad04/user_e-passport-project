// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // عدّلي حسب إعدادات MySQL عندك
  password: 'root',  // عدّلي حسب إعدادات MySQL عندك
  database: 'epassport3',
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL Database (epassport3)');
});

module.exports = connection;
