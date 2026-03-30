const db = require('../config/db');

const insert = (data, cb) => {
  const sql = `INSERT INTO tb_file (user_idx, file_name, file_size, file_ext)
               VALUES (?, ?, ?, ?)`;
  db.query(sql, [data.user_idx, data.file_name, data.file_size, data.file_ext], cb);
};

module.exports = { insert };
