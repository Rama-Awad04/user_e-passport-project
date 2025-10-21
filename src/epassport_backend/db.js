const mysql = require('mysql2');
const connection = mysql.createConnection({  host: 'localhost',
    host: 'localhost',
    user: 'DB_Rama',          // 👈 عدل حسب إعدادات MySQL
    password: 'RaMa_190704',      // 👈 عدل حسب إعدادات MySQL
    database: 'DB_Epassport'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to MySQL Database!');
});

module.exports = connection;

