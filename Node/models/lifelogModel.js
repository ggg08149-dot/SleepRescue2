const db = require('../config/db');

const insert = (data, cb) => {
  const sql = `INSERT INTO tb_lifelog (user_idx, exec_hours, phone_hours, work_hours, caffeine, sleep_hours)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [data.user_idx, data.exec_hours, data.phone_hours, data.work_hours, data.caffeine, data.sleep_hours], cb);
};

const updateSleepScore = (sleep_score, lifelog_idx, cb) => {
  db.query('UPDATE tb_lifelog SET sleep_score = ? WHERE lifelog_idx = ?', [sleep_score, lifelog_idx], cb);
};

// 사용자의 가장 최근 lifelog 1건
const getLatestByUser = (user_idx, cb) => {
  const sql = `SELECT exec_hours, phone_hours, work_hours, caffeine, sleep_hours, sleep_score
               FROM tb_lifelog
               WHERE user_idx = ?
               ORDER BY lifelog_idx DESC
               LIMIT 1`;
  db.query(sql, [user_idx], (err, rows) => {
    if (err) return cb(err, null);
    cb(null, rows[0] || null);
  });
};

module.exports = { insert, updateSleepScore, getLatestByUser };
