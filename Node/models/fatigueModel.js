const db = require('../config/db');

const insert = (data, cb) => {
  const sql = `INSERT INTO tb_fatigue (file_idx, lifelog_idx, fatigue_score, fatigue_reason, fatigue_level, analysis_result)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [data.file_idx, data.lifelog_idx, data.fatigue_score, data.fatigue_reason, data.fatigue_level, data.analysis_result], cb);
};

module.exports = { insert };
