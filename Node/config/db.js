const mysql = require('mysql2');

const db = mysql.createConnection({
  host    : process.env.DB_HOST,
  port    : process.env.DB_PORT,
  user    : process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log('❌ DB 연결 실패:', err.message);
    return;
  }
  console.log('✅ DB 연결 성공!');
});

module.exports = db;
