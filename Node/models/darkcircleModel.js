const db = require('../config/db');

const insert = (data, cb) => {
  const sql = `INSERT INTO tb_darkcircle (file_idx, user_idx, dc_score) VALUES (?, ?, ?)`;
  db.query(sql, [data.file_idx, data.user_idx, data.dc_score], cb);
};

module.exports = { insert };
