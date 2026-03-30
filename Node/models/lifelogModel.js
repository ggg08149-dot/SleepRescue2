const db = require('../config/db');

const insert = (data, cb) => {
  const sql = `INSERT INTO tb_lifelog (user_idx, exec_hours, phone_hours, work_hours, caffeine, sleep_hours)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [data.user_idx, data.exec_hours, data.phone_hours, data.work_hours, data.caffeine, data.sleep_hours], cb);
};

const updateSleepScore = (sleep_score, lifelog_idx, cb) => {
  db.query('UPDATE tb_lifelog SET sleep_score = ? WHERE lifelog_idx = ?', [sleep_score, lifelog_idx], cb);
};

module.exports = { insert, updateSleepScore };
