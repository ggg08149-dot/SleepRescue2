const db = require('../config/db');

const insert = (data, cb) => {
  const sql = `INSERT INTO tb_fatigue (file_idx, lifelog_idx, fatigue_score, fatigue_reason, fatigue_level, analysis_result)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [data.file_idx, data.lifelog_idx, data.fatigue_score, data.fatigue_reason, data.fatigue_level, data.analysis_result], cb);
};

// 사용자의 가장 최근 피로지수 1건
const getLatestByUser = (user_idx, cb) => {
  const sql = `SELECT f.fatigue_score, f.fatigue_level
               FROM tb_fatigue f
               JOIN tb_lifelog l ON f.lifelog_idx = l.lifelog_idx
               WHERE l.user_idx = ?
               ORDER BY f.fatigue_idx DESC
               LIMIT 1`;
  db.query(sql, [user_idx], (err, rows) => {
    if (err) return cb(err, null);
    cb(null, rows[0] || null);
  });
};

// 사용자의 최근 7일간 일별 최신 피로지수 (날짜 포함, 오래된 순)
const getWeeklyByUser = (user_idx, cb) => {
  const sql = `
    SELECT f.fatigue_score, f.fatigue_level,
           DATE_FORMAT(DATE(l.created_at), '%Y-%m-%d') AS log_date
    FROM tb_fatigue f
    INNER JOIN tb_lifelog l ON f.lifelog_idx = l.lifelog_idx
    INNER JOIN (
      SELECT MAX(f2.fatigue_idx) AS max_idx
      FROM tb_fatigue f2
      JOIN tb_lifelog l2 ON f2.lifelog_idx = l2.lifelog_idx
      WHERE l2.user_idx = ?
        AND l2.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(l2.created_at)
    ) t ON f.fatigue_idx = t.max_idx
    ORDER BY log_date ASC`;
  db.query(sql, [user_idx], (err, rows) => {
    if (err) return cb(err, null);
    cb(null, rows || []);
  });
};

// 캘린더용: 해당 월 일별 최신 피로지수 (재측정 시 최신 값으로 갱신)
const getCalendarByUser = (user_idx, year, month, cb) => {
  const sql = `
    SELECT
      DAY(l.created_at)  AS day,
      f.fatigue_score,
      f.fatigue_level
    FROM tb_fatigue f
    INNER JOIN tb_lifelog l ON f.lifelog_idx = l.lifelog_idx
    INNER JOIN (
      SELECT MAX(f2.fatigue_idx) AS max_idx
      FROM tb_fatigue f2
      JOIN tb_lifelog l2 ON f2.lifelog_idx = l2.lifelog_idx
      WHERE l2.user_idx = ?
        AND YEAR(l2.created_at)  = ?
        AND MONTH(l2.created_at) = ?
      GROUP BY DAY(l2.created_at)
    ) t ON f.fatigue_idx = t.max_idx
    ORDER BY day ASC`;
  db.query(sql, [user_idx, year, month], (err, rows) => {
    if (err) return cb(err, null);
    cb(null, rows || []);
  });
};

module.exports = { insert, getLatestByUser, getWeeklyByUser, getCalendarByUser };
