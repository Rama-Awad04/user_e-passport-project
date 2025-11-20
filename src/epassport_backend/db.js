const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // 👈 عدل حسب إعدادات MySQL
    password: 'root',      // 👈 عدل حسب إعدادات MySQL
    database: 'epassport3'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to MySQL Database!');
});

module.exports = connection;

