const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',        // ضع كلمة مرور MySQL الخاصة بك
  database: 'epassport3'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to MySQL Database!');
});

module.exports = connection;
