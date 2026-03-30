const db = require('../config/db');

const insert = (data, cb) => {
  const sql = `INSERT INTO tb_darkcircle (file_idx, user_idx, dc_score) VALUES (?, ?, ?)`;
  db.query(sql, [data.file_idx, data.user_idx, data.dc_score], cb);
};

// ✅ 추가: 다크서클 점수 조회 함수
const getScoreByFile = (file_idx, cb) => {
  const sql = `SELECT dc_score FROM tb_darkcircle WHERE file_idx = ?`;
  db.query(sql, [file_idx], (err, results) => {
    if (err) return cb(err);
    // 결과가 있으면 첫 번째 행의 점수를 반환
    const score = results.length > 0 ? results[0].dc_score : 80; // 없으면 기본값 80점
    cb(null, score);
  });
};

module.exports = { insert, getScoreByFile };
