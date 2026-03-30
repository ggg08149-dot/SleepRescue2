const db = require('../config/db');

const findByEmail = (email, cb) => {
  db.query('SELECT * FROM tb_user WHERE email = ?', [email], cb);
};

const insert = (data, cb) => {
  const sql = 'INSERT INTO tb_user (account_id, name, email, password, gender, birthdate, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [data.email, data.name, data.email, data.hashedPw, data.gender, data.birthdate, 'user'], cb);
};

const findById = (user_idx, cb) => {
  db.query('SELECT password FROM tb_user WHERE user_idx = ?', [user_idx], cb);
};

const updatePassword = (hashedPw, user_idx, cb) => {
  db.query('UPDATE tb_user SET password = ? WHERE user_idx = ?', [hashedPw, user_idx], cb);
};

module.exports = { findByEmail, insert, findById, updatePassword };
